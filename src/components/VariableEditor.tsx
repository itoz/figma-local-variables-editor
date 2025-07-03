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
import { getFileInfo, getVariables, updateVariable as updateVariableAPI } from "@/lib/api/figma";
// import { convertVariablesToExportFormat, exportVariablesToFile } from "@/lib/api/figma"; // Temporarily disabled
import { rgbaToHex } from "@/lib/utils";
import React, { useState } from "react";

type Variable = {
  id: string;
  name: string;
  resolvedType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
  modeId: string;
  value: string;
  description?: string;
  scopes?: string[];
  variableCollectionId?: string;
  remote?: boolean;
  key?: string;
  isAlias?: boolean;
  aliasTarget?: string;
  codeSyntax?: { [key: string]: string };
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
  resolvedType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
  valuesByMode: {
    [key: string]: any;
  };
  description?: string;
  scopes?: string[];
  variableCollectionId: string;
  remote?: boolean;
  key?: string;
  codeSyntax?: { [key: string]: string };
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

type FileInfo = {
  name: string;
  lastModified: string;
  thumbnailUrl?: string;
  version: string;
  role: string;
  editorType: string;
  linkAccess: string;
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
  const [figmaUrl, setFigmaUrl] = useState("");
  const [fileKey, setFileKey] = useState<string>("");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [loadingFileInfo, setLoadingFileInfo] = useState(false);
  // const [targetFileUrl, setTargetFileUrl] = useState(""); // Temporarily disabled
  // const [exporting, setExporting] = useState(false); // Temporarily disabled
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

  // Add file info fetching function
  const fetchFileInfo = async (fileKey: string) => {
    setLoadingFileInfo(true);
    try {
      const info = await getFileInfo(fileKey);
      setFileInfo(info);
    } catch (error) {
      console.error("Failed to fetch file info:", error);
      // エラー時はファイル情報を null にして非表示にする（エラーメッセージは表示しない）
      setFileInfo(null);
    } finally {
      setLoadingFileInfo(false);
    }
  };

  // 変数をターゲットファイルにエクスポート - Temporarily disabled
  /*
  const handleExportVariables = async () => {
    if (!targetFileUrl.trim()) {
      setToast({
        open: true,
        title: "エラー",
        description: "エクスポート先のFigmaファイルURLまたはファイルキーを入力してください。",
        variant: "destructive",
      });
      return;
    }

    const targetFileKey = extractFileKey(targetFileUrl);
    if (!targetFileKey) {
      setToast({
        open: true,
        title: "エラー",
        description: "有効なFigmaファイルのURLまたはファイルキーを入力してください。",
        variant: "destructive",
      });
      return;
    }

    // 取得元と同じファイルへのエクスポートを防ぐ
    if (targetFileKey === fileKey) {
      setToast({
        open: true,
        title: "エラー",
        description: "取得元と同じファイルにはエクスポートできません。異なるファイルを指定してください。",
        variant: "destructive",
      });
      return;
    }

    if (Object.keys(groupedVars).length === 0) {
      setToast({
        open: true,
        title: "エラー",
        description: "エクスポートする変数がありません。まず変数を取得してください。",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    try {
      // 変数データをエクスポート形式に変換
      const variableData = convertVariablesToExportFormat(groupedVars);

      console.log("Exporting variables:", variableData);

      // 変数をエクスポート
      const result = await exportVariablesToFile(targetFileKey, variableData, fileKey);

      console.log("Export result:", result);

      setToast({
        open: true,
        title: "エクスポート成功",
        description: `変数が正常にエクスポートされました。コレクション数: ${variableData.variableCollections.length}、変数数: ${variableData.variables.length}`,
        variant: "default",
      });

      // エクスポート後にターゲットファイルのURLをクリア
      setTargetFileUrl("");

    } catch (error) {
      console.error("Failed to import variables:", error);
      setToast({
        open: true,
        title: "インポートエラー",
        description: `変数のインポートに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };
  */

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
    // Fetch both variables and file info
    fetchVariables(extractedFileKey);
    fetchFileInfo(extractedFileKey);
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
              codeSyntax: v.codeSyntax,
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
              placeholder="FigmaファイルのURLまたはファイルキーを入力してください"
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

        {/* File Info Display */}
        {fileInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">ファイル情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-600">ファイル名:</span>
                <span className="ml-2 text-gray-800">{fileInfo.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">バージョン:</span>
                <span className="ml-2 text-gray-800">{fileInfo.version}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">最終更新:</span>
                <span className="ml-2 text-gray-800">
                  {new Date(fileInfo.lastModified).toLocaleString('ja-JP')}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">アクセス権限:</span>
                <span className="ml-2 text-gray-800">{fileInfo.role}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-600">ファイルキー:</span>
                <span className="ml-2 text-gray-800 font-mono text-xs">{fileKey}</span>
              </div>
            </div>
          </div>
        )}

        {/* Variable Export Section - Temporarily disabled */}
        {/*
        {Object.keys(groupedVars).length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3 text-blue-800">変数エクスポート</h3>
            <p className="text-sm text-blue-600 mb-4">
              取得した変数を他のFigmaファイルにエクスポートできます。
              <br />
              <strong>注意:</strong> この機能はEnterpriseプランでのみ利用可能で、対象ファイルへの編集権限が必要です。
            </p>

            <div className="bg-white border border-blue-300 rounded p-3 mb-4">
              <div className="text-sm">
                <span className="font-medium text-blue-700">取得元ファイル:</span>
                <span className="ml-2 text-blue-800">
                  {fileInfo?.name || "ファイル名不明"}
                </span>
                <span className="ml-2 text-blue-600 font-mono text-xs">
                  ({fileKey})
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                ※ 取得元と同じファイルにはエクスポートできません
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="エクスポート先のFigmaファイルURLまたはファイルキーを入力"
                value={targetFileUrl}
                onChange={(e) => setTargetFileUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleExportVariables}
                disabled={exporting || !targetFileUrl.trim()}
                variant="outline"
              >
                {exporting ? (
                  <>
                    <Loader size={16} className="mr-2" />
                    エクスポート中...
                  </>
                ) : (
                  "変数をエクスポート"
                )}
              </Button>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              エクスポート対象: {Object.values(groupedVars).reduce((total, group) => total + group.variables.length, 0)} 個の変数、
              {Object.keys(groupedVars).length} 個のコレクション
            </div>
          </div>
        )}
        */}

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
                                      {v.resolvedType === "COLOR" ? (
                                        <>
                                          <div className="text-xs">HEX: {rgbaToHex(v.value)}</div>
                                          <div className="text-xs">RGBA: {v.value}</div>
                                        </>
                                      ) : (
                                        <div className="text-xs">{v.value}</div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            ) : (
                              v.resolvedType === "COLOR" ? (
                                <span className="text-xs text-muted-foreground">{rgbaToHex(v.value)}</span>
                              ) : v.codeSyntax && Object.keys(v.codeSyntax).length > 0 ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="text-xs font-mono cursor-help bg-gray-100 hover:bg-gray-200">
                                      {v.codeSyntax.WEB || Object.values(v.codeSyntax)[0]}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs">{v.value}</div>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="text-xs text-muted-foreground">{v.value}</span>
                              )
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