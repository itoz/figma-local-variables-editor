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
    const { variableId, description, fileKey } = body;

    console.log("PATCH request body:", JSON.stringify(body, null, 2));
    console.log("Variable ID:", variableId);
    console.log("Description:", description);
    console.log("File Key:", fileKey);
    console.log("FIGMA_TOKEN exists:", !!process.env.FIGMA_TOKEN);

    if (!variableId || !fileKey) {
      return NextResponse.json(
        { error: "Variable ID and File Key are required" },
        { status: 400 }
      );
    }

    if (description === undefined) {
      return NextResponse.json(
        { error: "Description is required for update" },
        { status: 400 }
      );
    }

    // Use the correct Figma API endpoint for bulk variable operations
    const payload = {
      variables: [
        {
          action: "UPDATE",
          id: variableId,
          description: description,
        },
      ],
    };

    console.log("Sending to Figma API:", JSON.stringify(payload, null, 2));
    console.log(
      "Figma API URL:",
      `https://api.figma.com/v1/files/${fileKey}/variables`
    );

    const res = await axios.post(
      `https://api.figma.com/v1/files/${fileKey}/variables`,
      payload,
      {
        headers: {
          "X-Figma-Token": process.env.FIGMA_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );
    return NextResponse.json(res.data);
  } catch (error) {
    console.error("Error updating variable:", error);
    if (axios.isAxiosError(error)) {
      console.error(
        "Axios error response:",
        JSON.stringify(error.response?.data, null, 2)
      );
      console.error("Axios error status:", error.response?.status);
    }
    return NextResponse.json(
      {
        error: "Failed to update variable",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
