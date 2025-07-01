export async function getVariables(fileKey?: string) {
  const url = fileKey
    ? `/api/figma/variables?fileKey=${fileKey}`
    : "/api/figma/variables";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch variables");
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
