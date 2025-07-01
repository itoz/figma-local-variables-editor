import axios from "axios";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get("fileKey") || process.env.FIGMA_FILE_KEY;

    if (!fileKey) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }

    const res = await axios.get(
      `https://api.figma.com/v1/files/${fileKey}/variables/local`,
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
    const { variableId, valuesByMode, description } = body;

    if (!variableId) {
      return NextResponse.json(
        { error: "Variable ID is required" },
        { status: 400 }
      );
    }

    const res = await axios.patch(
      `https://api.figma.com/v1/variables/${variableId}`,
      description !== undefined ? { description } : { valuesByMode },
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
