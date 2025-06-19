'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { getVariables, updateVariable } from "@/lib/api/figma";
import React, { useEffect, useState } from "react";

type Variable = {
  id: string;
  name: string;
  resolvedType: "COLOR" | "FLOAT";
  modeId: string;
  value: string;
  description?: string;
  scopes?: string[];
};

type VariableCollection = {
  id: string;
  name: string;
  defaultModeId: string;
  remote: boolean;
  key: string;
  variableIds: string[];
};

type VariableData = {
  id: string;
  name: string;
  resolvedType: "COLOR" | "FLOAT";
  valuesByMode: {
    [key: string]: any;
  };
  description?: string;
  scopes?: string[];
  variableCollectionId: string;
  remote?: boolean;
  key?: string;
};

type VariablesResponse = {
  meta: {
    variableCollections: {
      [key: string]: VariableCollection;
    };
    variables: {
      [key: string]: VariableData;
    };
  };
};

type ToastState = {
  open: boolean;
  title: string;
  description: string;
  variant: "default" | "destructive";
};

type GroupedVariables = {
  [collectionId: string]: {
    collection: VariableCollection;
    variables: Variable[];
  };
};

export default function VariableEditor() {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    title: "",
    description: "",
    variant: "default",
  });
  const [groupedVars, setGroupedVars] = useState<GroupedVariables>({});

  useEffect(() => {
    const fetchVariables = async () => {
      setLoading(true);
      try {
        const data = (await getVariables()) as VariablesResponse;
        console.log('Collections:', Object.values(data.meta.variableCollections).map(c => ({
          id: c.id,
          name: c.name,
          remote: c.remote,
          key: c.key
        })));
        const meta = data.meta;

        // Get all collections and their modes
        const collections = Object.values(meta.variableCollections);
        const collectionModes = new Map(
          collections.map(collection => [collection.id, collection.defaultModeId])
        );

        const resolveColorValue = (variableId: string, collectionId: string): string => {
          const variable = meta.variables[variableId];
          if (!variable) {
            console.warn('Variable not found:', variableId);
            return 'rgba(0, 0, 0, 1)';
          }

          const modeId = collectionModes.get(variable.variableCollectionId);
          if (!modeId) {
            console.warn('Mode not found for collection:', variable.variableCollectionId);
            return 'rgba(0, 0, 0, 1)';
          }

          const valueData = variable.valuesByMode[modeId];

          if (valueData && typeof valueData === 'object') {
            if ('type' in valueData && valueData.type === 'VARIABLE_ALIAS') {
              return resolveColorValue(valueData.id, variable.variableCollectionId);
            }
            if ('r' in valueData) {
              const { r, g, b, a } = valueData;
              return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
            }
          }

          console.warn('Unexpected value data format:', valueData);
          return 'rgba(0, 0, 0, 1)';
        };

        const groupedVars = collections.reduce<GroupedVariables>((acc, collection) => {
          const collectionVars = Object.entries(meta.variables)
            .filter(([_, v]) => v.variableCollectionId === collection.id)
            .map(([id, v]) => {
              const modeId = collectionModes.get(v.variableCollectionId) || '';
              let value = "";

              if (v.resolvedType === "COLOR") {
                value = resolveColorValue(id, v.variableCollectionId);
              } else if (v.resolvedType === "FLOAT") {
                const valueData = v.valuesByMode[modeId];
                if (valueData && typeof valueData === 'object' && 'type' in valueData && valueData.type === 'VARIABLE_ALIAS') {
                  const resolvedVar = meta.variables[valueData.id];
                  const resolvedModeId = collectionModes.get(resolvedVar.variableCollectionId) || '';
                  value = String(resolvedVar.valuesByMode[resolvedModeId]);
                } else {
                  value = String(valueData);
                }
              }

              return {
                id: v.id,
                name: v.name,
                resolvedType: v.resolvedType,
                modeId,
                value,
                description: v.description,
                scopes: v.scopes,
              };
            });

          acc[collection.id] = {
            collection,
            variables: collectionVars,
          };
          return acc;
        }, {});

        setGroupedVars(groupedVars);
        setVariables(Object.values(groupedVars).flatMap(g => g.variables));
      } catch (error) {
        console.error("Failed to fetch variables:", error);
        setToast({
          open: true,
          title: "エラー",
          description: "変数の取得に失敗しました。",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVariables();
  }, []);

  const handleChange = (id: string, newValue: string) => {
    setVariables((prev) =>
      prev.map((v) => (v.id === id ? { ...v, value: newValue } : v))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const v of variables) {
        let newValue: any;

        if (v.resolvedType === "COLOR") {
          const match = v.value.match(
            /rgba?\((\d+),\s*(\d+),\s*(\d+),\s*(\d+(\.\d+)?)\)/
          );
          if (!match) continue;
          const [_, r, g, b, a] = match;
          newValue = {
            r: parseInt(r) / 255,
            g: parseInt(g) / 255,
            b: parseInt(b) / 255,
            a: parseFloat(a),
          };
        } else if (v.resolvedType === "FLOAT") {
          newValue = parseFloat(v.value);
        }

        await updateVariable(v.id, v.modeId, newValue);
      }

      setToast({
        open: true,
        title: "成功",
        description: "変数を更新しました。",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to save variables:", error);
      setToast({
        open: true,
        title: "エラー",
        description: "変数の更新に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateDescription = async (variableId: string, description: string) => {
    try {
      const variable = variables.find((v) => v.id === variableId);
      if (!variable) return;

      await updateVariable(variableId, variable.modeId, {
        type: "DESCRIPTION_UPDATE",
        description,
      });

      // Update local state
      setVariables((prev) =>
        prev.map((v) =>
          v.id === variableId ? { ...v, description } : v
        )
      );

      setToast({
        open: true,
        title: "成功",
        description: "説明を更新しました。",
        variant: "default"
      });
    } catch (error) {
      console.error("Failed to update description:", error);
      setToast({
        open: true,
        title: "エラー",
        description: "説明の更新に失敗しました。",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex min-h-[400px] items-center justify-center rounded-md border">
          <Loader size={32} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[100px]">Scopes</TableHead>
                <TableHead className="w-[200px]">Value</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedVars).map(([collectionId, group]) => (
                <React.Fragment key={collectionId}>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={5} className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{group.collection.name}</span>
                        {group.collection.remote && (
                          <Badge variant="secondary" className="text-xs">Remote</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {group.variables.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell>{v.resolvedType}</TableCell>
                      <TableCell className="text-xs">{v.scopes?.join(", ")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {v.resolvedType === "COLOR" && (
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: v.value }}
                            />
                          )}
                          {v.value}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <Input
                          value={v.description || ""}
                          onChange={(e) => updateDescription(v.id, e.target.value)}
                          className="h-6 text-xs"
                          placeholder="説明を入力..."
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader size={16} className="mr-2" />
                保存中...
              </>
            ) : (
              "保存"
            )}
          </Button>
        </div>
      </div>

      <ToastProvider>
        <Toast open={toast.open} onOpenChange={(open) => setToast({ ...toast, open })} variant={toast.variant}>
          <div className="grid gap-1">
            <ToastTitle>{toast.title}</ToastTitle>
            <ToastDescription>{toast.description}</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    </>
  );
} 