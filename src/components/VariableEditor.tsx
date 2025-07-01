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
import React, { useState } from "react";

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
  const [groupedVars, setGroupedVars] = useState<GroupedVariables>({});
  const [loading, setLoading] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [figmaUrl, setFigmaUrl] = useState("WZ1EEljhqZdxA3FCYasvz1");
  const [toast, setToast] = useState<ToastState>({
    open: false,
    title: "",
    description: "",
    variant: "default",
  });

  // Extract file key from Figma URL or return as-is if it's already a file key
  const extractFileKey = (input: string): string | null => {
    const trimmed = input.trim();

    // If it looks like a URL, extract the file key
    const match = trimmed.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    if (match) {
      return match[1];
    }

    // If it's already a file key (alphanumeric string), return as-is
    if (/^[a-zA-Z0-9]+$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  };

  const handleFetchFromUrl = () => {
    if (!figmaUrl.trim()) {
      setToast({
        open: true,
        title: "エラー",
        description: "FigmaファイルのURLまたはファイルキーを入力してください。",
        variant: "destructive",
      });
      return;
    }

    const fileKey = extractFileKey(figmaUrl);
    if (!fileKey) {
      setToast({
        open: true,
        title: "エラー",
        description: "有効なFigmaファイルのURLまたはファイルキーを入力してください。",
        variant: "destructive",
      });
      return;
    }

    fetchVariables(fileKey);
  };

  const fetchVariables = async (fileKey?: string) => {
    setLoading(true);
    try {
      const data = (await getVariables(fileKey)) as VariablesResponse;
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

  const handleChange = (id: string, newValue: string) => {
    setVariables((prev) =>
      prev.map((v) => (v.id === id ? { ...v, value: newValue } : v))
    );
  };

  const updateDescription = (variableId: string, description: string) => {
    // Update local state only, don't send API request immediately
    setVariables((prev) =>
      prev.map((v) =>
        v.id === variableId ? { ...v, description } : v
      )
    );

    // Update grouped variables as well
    setGroupedVars((prev) => {
      const newGrouped = { ...prev };
      Object.keys(newGrouped).forEach(collectionId => {
        newGrouped[collectionId] = {
          ...newGrouped[collectionId],
          variables: newGrouped[collectionId].variables.map(v =>
            v.id === variableId ? { ...v, description } : v
          )
        };
      });
      return newGrouped;
    });
  };

  const updateSingleVariable = async (variableId: string) => {
    setUpdatingIds(prev => new Set(prev).add(variableId));

    try {
      const variable = variables.find((v) => v.id === variableId);
      if (!variable) return;

      // Update both value and description
      let newValue: any;

      if (variable.resolvedType === "COLOR") {
        const match = variable.value.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+),\s*(\d+(\.\d+)?)\)/
        );
        if (!match) {
          throw new Error("Invalid color format");
        }
        const [_, r, g, b, a] = match;
        newValue = {
          r: parseInt(r) / 255,
          g: parseInt(g) / 255,
          b: parseInt(b) / 255,
          a: parseFloat(a),
        };
      } else if (variable.resolvedType === "FLOAT") {
        newValue = parseFloat(variable.value);
      }

      // Update the variable value
      await updateVariable(variable.id, variable.modeId, newValue);

      // Update the description if it exists
      if (variable.description !== undefined && variable.description !== null) {
        await updateVariable(variable.id, variable.modeId, {
          type: "DESCRIPTION_UPDATE",
          description: variable.description,
        });
      }

      setToast({
        open: true,
        title: "成功",
        description: `変数 "${variable.name}" を更新しました。`,
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to update variable:", error);
      setToast({
        open: true,
        title: "エラー",
        description: "変数の更新に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(variableId);
        return newSet;
      });
    }
  };

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="mb-6 space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="FigmaファイルのURLまたはファイルキーを入力してください (例: WZ1EEljhqZdxA3FCYasvz1)"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleFetchFromUrl} disabled={loading}>
              {loading ? (
                <>
                  <Loader size={16} className="mr-2" />
                  取得中...
                </>
              ) : (
                "取得"
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            FigmaファイルのURLまたはファイルキーを入力して変数を取得できます。
          </p>
        </div>

        {Object.keys(groupedVars).length === 0 && !loading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-md border">
            <div className="text-center">
              <p className="text-muted-foreground">FigmaファイルのURLを入力して変数を取得してください</p>
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[100px]">Scopes</TableHead>
                  <TableHead className="w-[200px]">Value</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedVars).map(([collectionId, group]) => (
                  <React.Fragment key={collectionId}>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={6} className="py-2">
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
                            <Input
                              value={v.value}
                              onChange={(e) => handleChange(v.id, e.target.value)}
                              className="h-6 text-xs"
                              placeholder="値を入力..."
                            />
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
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => updateSingleVariable(v.id)}
                            disabled={updatingIds.has(v.id)}
                            className="h-6 px-2 text-xs"
                          >
                            {updatingIds.has(v.id) ? (
                              <>
                                <Loader size={12} className="mr-1" />
                                更新中
                              </>
                            ) : (
                              "POST"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}


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