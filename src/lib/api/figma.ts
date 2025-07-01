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
  value: any
) {
  const res = await fetch("/api/figma/variables", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      variableId,
      ...(value.type === "DESCRIPTION_UPDATE"
        ? { description: value.description }
        : { valuesByMode: { [modeId]: value } }),
    }),
  });
  if (!res.ok) throw new Error("Failed to update variable");
  return res.json();
}
