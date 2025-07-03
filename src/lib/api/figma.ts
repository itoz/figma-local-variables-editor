export async function getVariables(fileKey?: string) {
  const url = fileKey
    ? `/api/figma/variables?fileKey=${fileKey}`
    : "/api/figma/variables";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch variables");
  return res.json();
}

export async function getFileInfo(fileKey: string) {
  const res = await fetch(`/api/figma/file-info?fileKey=${fileKey}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch file information");
  }
  return res.json();
}

export async function updateVariable(
  variableId: string,
  modeId: string,
  value: any,
  fileKey: string,
  description?: string,
  resolvedType?: string
) {
  const requestBody: any = {
    variableId,
    fileKey,
    modeId,
  };

  // Add description if provided
  if (description !== undefined) {
    requestBody.description = description;
  }

  // Add value if provided (and not a description-only update)
  if (value !== undefined && !value.type) {
    requestBody.value = value;
    requestBody.resolvedType = resolvedType;
  }

  console.log("updateVariable called with:", {
    variableId,
    modeId,
    value,
    fileKey,
    description,
    resolvedType,
    requestBody,
  });

  const res = await fetch("/api/figma/variables", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  console.log("Response status:", res.status);
  console.log("Response ok:", res.ok);

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Update variable failed:", errorText);
    throw new Error("Failed to update variable");
  }
  return res.json();
}

// 変数データを他のファイルにエクスポート可能な形式に変換
export function convertVariablesToExportFormat(groupedVars: any) {
  const variableCollections: any[] = [];
  const variableModes: any[] = [];
  const variables: any[] = [];
  const variableModeValues: any[] = [];

  Object.entries(groupedVars).forEach(
    ([collectionId, group]: [string, any]) => {
      const collection = group.collection;
      const tempCollectionId = `temp_collection_${collectionId}`;
      const tempModeId = `temp_mode_${collection.defaultModeId}`;

      // コレクションを作成
      variableCollections.push({
        action: "CREATE",
        id: tempCollectionId,
        name: collection.name,
        initialModeId: tempModeId,
        hiddenFromPublishing: false,
      });

      // 変数を作成
      group.variables.forEach((variable: any) => {
        const tempVariableId = `temp_var_${variable.id}`;

        variables.push({
          action: "CREATE",
          id: tempVariableId,
          name: variable.name,
          variableCollectionId: tempCollectionId,
          resolvedType: variable.resolvedType,
          description: variable.description || "",
          hiddenFromPublishing: false,
        });

        // 変数値を設定
        let value = variable.value;

        // カラー値の場合、rgbaからFigma APIの形式に変換
        if (variable.resolvedType === "COLOR" && typeof value === "string") {
          if (value.startsWith("rgba(")) {
            const match = value.match(
              /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/
            );
            if (match) {
              value = {
                r: parseInt(match[1]) / 255,
                g: parseInt(match[2]) / 255,
                b: parseInt(match[3]) / 255,
                a: parseFloat(match[4]),
              };
            }
          } else if (value.startsWith("#")) {
            // HEXからRGBAに変換
            const hex = value.replace("#", "");
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;
            const a =
              hex.length === 8 ? parseInt(hex.substr(6, 2), 16) / 255 : 1;
            value = { r, g, b, a };
          }
        }

        // エイリアス（参照変数）の場合は除外（後で処理）
        if (!variable.isAlias) {
          variableModeValues.push({
            variableId: tempVariableId,
            modeId: tempModeId,
            value: value,
          });
        }
      });
    }
  );

  return {
    variableCollections,
    variableModes,
    variables,
    variableModeValues,
  };
}

// 変数を他のファイルにエクスポート
export async function exportVariablesToFile(
  targetFileKey: string,
  variableData: any,
  sourceFileKey?: string
) {
  const res = await fetch(`/api/figma/variables/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileKey: targetFileKey,
      variableData,
      sourceFileKey,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to export variables");
  }

  return res.json();
}
