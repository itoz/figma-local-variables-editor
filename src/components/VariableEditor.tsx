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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getVariables, updateVariable as updateVariableAPI } from "@/lib/api/figma";
import { rgbaToHex } from "@/lib/utils";
import React, { useState } from "react";

type Variable = {
  id: string;
  name: string;
  resolvedType: "COLOR" | "FLOAT";
  modeId: string;
  value: string;
  description?: string;
  scopes?: string[];
  variableCollectionId?: string;
  remote?: boolean;
  key?: string;
  isAlias?: boolean;
  aliasTarget?: string;
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
  const [fileKey, setFileKey] = useState<string>("");
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

    const extractedFileKey = extractFileKey(figmaUrl);
    if (!extractedFileKey) {
      setToast({
        open: true,
        title: "エラー",
        description: "有効なFigmaファイルのURLまたはファイルキーを入力してください。",
        variant: "destructive",
      });
      return;
    }

    setFileKey(extractedFileKey);
    fetchVariables(extractedFileKey);
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
            let isAlias = false;
            let aliasTarget = "";

            if (v.resolvedType === "COLOR") {
              const valueData = v.valuesByMode[modeId];
              if (valueData && typeof valueData === 'object' && 'type' in valueData && valueData.type === 'VARIABLE_ALIAS') {
                isAlias = true;
                const targetVar = meta.variables[valueData.id];
                aliasTarget = targetVar ? targetVar.name : valueData.id;
                value = resolveColorValue(id, v.variableCollectionId);
              } else {
                value = resolveColorValue(id, v.variableCollectionId);
              }
            } else if (v.resolvedType === "FLOAT") {
              const valueData = v.valuesByMode[modeId];
              if (valueData && typeof valueData === 'object' && 'type' in valueData && valueData.type === 'VARIABLE_ALIAS') {
                isAlias = true;
                const targetVar = meta.variables[valueData.id];
                aliasTarget = targetVar ? targetVar.name : valueData.id;
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
              variableCollectionId: v.variableCollectionId,
              remote: v.remote,
              key: v.key,
              isAlias,
              aliasTarget,
            };
          });

        acc[collection.id] = {
          collection,
          variables: collectionVars,
        };
        return acc;
      }, {});

      setGroupedVars(groupedVars);
      const allVariables = Object.values(groupedVars).flatMap(g => g.variables);
      setVariables(allVariables);

      // Log variable details for debugging
      console.log("=== Variable Details ===");
      allVariables.forEach(variable => {
        if (variable.name.includes('disabled') || variable.name.includes('text')) {
          console.log(`Variable: ${variable.name}`, {
            id: variable.id,
            name: variable.name,
            remote: variable.remote,
            key: variable.key,
            variableCollectionId: variable.variableCollectionId,
            resolvedType: variable.resolvedType
          });
        }
      });
      console.log("=== End Variable Details ===");
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

  const updateVariable = async (variableId: string) => {
    setUpdatingIds(prev => new Set(prev).add(variableId));

    try {
      const variable = variables.find((v) => v.id === variableId);
      if (!variable) return;

      console.log("Updating variable description:", {
        id: variable.id,
        name: variable.name,
        description: variable.description,
        fileKey: fileKey
      });

      // Check if this is a remote variable
      if (variable.remote) {
        setToast({
          open: true,
          title: "エラー",
          description: "リモート変数は更新できません。元のファイルで編集してください。",
          variant: "destructive",
        });
        return;
      }

      // Update description only via API
      await updateVariableAPI(
        variable.id,
        variable.modeId,
        null, // No value update
        fileKey,
        variable.description,
        variable.resolvedType
      );

      setToast({
        open: true,
        title: "成功",
        description: `変数 "${variable.name}" の説明を更新しました。`,
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to update variable description:", error);
      setToast({
        open: true,
        title: "エラー",
        description: "変数の説明の更新に失敗しました。",
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
    <TooltipProvider>
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
                        <TableCell className="font-medium">
                          {v.name}
                          {v.remote && (
                            <Badge variant="secondary" className="ml-2 text-xs">Remote</Badge>
                          )}
                        </TableCell>
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
                            {v.isAlias ? (
                              <div className="flex items-center gap-2 flex-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="text-xs font-mono cursor-help bg-gray-100 hover:bg-gray-200">
                                      {v.aliasTarget}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      {v.resolvedType === "COLOR" && (
                                        <div className="text-xs">HEX: {rgbaToHex(v.value)}</div>
                                      )}
                                      <div className="text-xs">RGBA: {v.value}</div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {v.resolvedType === "COLOR" ? rgbaToHex(v.value) : v.value}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <Input
                            value={v.description || ""}
                            onChange={(e) => updateDescription(v.id, e.target.value)}
                            className="h-6 text-xs"
                            placeholder={v.remote ? "リモート変数は編集不可" : "説明を入力..."}
                            disabled={v.remote}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => updateVariable(v.id)}
                              disabled={updatingIds.has(v.id) || v.remote}
                              className="h-6 px-2 text-xs"
                            >
                              {updatingIds.has(v.id) ? (
                                <>
                                  <Loader size={12} className="mr-1" />
                                  更新中
                                </>
                              ) : (
                                "説明更新"
                              )}
                            </Button>
                          </div>
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
    </TooltipProvider>
  );
} 