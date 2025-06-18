import axios from "axios";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await axios.get(
      `https://api.figma.com/v1/files/${process.env.FIGMA_FILE_KEY}/variables/local`,
      {
        headers: {
          "X-Figma-Token": process.env.FIGMA_TOKEN,
        },
      }
    );
    return NextResponse.json(res.data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch variables" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { variableId, valuesByMode } = body;

    const res = await axios.patch(
      `https://api.figma.com/v1/variables/${variableId}`,
      { valuesByMode },
      {
        headers: {
          "X-Figma-Token": process.env.FIGMA_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );
    return NextResponse.json(res.data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update variable" },
      { status: 500 }
    );
  }
}
