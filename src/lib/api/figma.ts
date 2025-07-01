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
  fileKey: string
) {
  const requestBody = {
    variableId,
    fileKey,
    ...(value.type === "DESCRIPTION_UPDATE"
      ? { description: value.description }
      : { valuesByMode: { [modeId]: value } }),
  };

  console.log("updateVariable called with:", {
    variableId,
    modeId,
    value,
    fileKey,
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
