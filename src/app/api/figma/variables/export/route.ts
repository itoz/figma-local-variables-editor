import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { fileKey, variableData, sourceFileKey } = await request.json();

    if (!fileKey) {
      return NextResponse.json(
        { error: "Target file key is required" },
        { status: 400 }
      );
    }

    if (!variableData) {
      return NextResponse.json(
        { error: "Variable data is required" },
        { status: 400 }
      );
    }

    if (sourceFileKey && fileKey === sourceFileKey) {
      return NextResponse.json(
        {
          error:
            "Cannot export variables to the same file they were retrieved from",
        },
        { status: 400 }
      );
    }

    console.log("Exporting variables to file:", fileKey);
    console.log("Variable data:", JSON.stringify(variableData, null, 2));

    const res = await axios.post(
      `https://api.figma.com/v1/files/${fileKey}/variables`,
      variableData,
      {
        headers: {
          "X-Figma-Token": process.env.FIGMA_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Export successful:", res.data);
    return NextResponse.json(res.data);
  } catch (error) {
    console.error("Error exporting variables:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error response:", error.response?.data);
      console.error("Axios error status:", error.response?.status);

      if (error.response?.status === 400) {
        return NextResponse.json(
          {
            error: `Bad request: ${
              error.response.data?.message || "Invalid data"
            }`,
          },
          { status: 400 }
        );
      }
      if (error.response?.status === 403) {
        return NextResponse.json(
          {
            error:
              "Access denied. This API requires Enterprise plan and edit access to the target file.",
          },
          { status: 403 }
        );
      }
      if (error.response?.status === 404) {
        return NextResponse.json(
          { error: "Target file not found" },
          { status: 404 }
        );
      }
      if (error.response?.status === 413) {
        return NextResponse.json(
          { error: "Request payload too large. Maximum allowed size is 4MB." },
          { status: 413 }
        );
      }
    }
    return NextResponse.json(
      { error: "Failed to export variables" },
      { status: 500 }
    );
  }
}
