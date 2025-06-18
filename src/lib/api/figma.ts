export async function getVariables() {
  const res = await fetch("/api/figma/variables");
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
      valuesByMode: {
        [modeId]: value,
      },
    }),
  });
  if (!res.ok) throw new Error("Failed to update variable");
  return res.json();
}
