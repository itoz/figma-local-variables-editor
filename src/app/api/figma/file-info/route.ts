import axios from "axios";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get("fileKey");

    if (!fileKey) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }

    const res = await axios.get(
      `https://api.figma.com/v1/files/${fileKey}?branch_data=true`,
      {
        headers: {
          "X-Figma-Token": process.env.FIGMA_TOKEN,
        },
      }
    );

    // Extract relevant file information
    const fileInfo = {
      name: res.data.name,
      lastModified: res.data.lastModified,
      thumbnailUrl: res.data.thumbnailUrl,
      version: res.data.version,
      role: res.data.role,
      editorType: res.data.editorType,
      linkAccess: res.data.linkAccess,
      mainFileKey: res.data.mainFileKey ?? null,
    };

    return NextResponse.json(fileInfo);
  } catch (error) {
    console.error("Error fetching file info:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error response:", error.response?.data);
      console.error("Axios error status:", error.response?.status);

      if (error.response?.status === 404) {
        return NextResponse.json(
          { error: "File not found or access denied" },
          { status: 404 }
        );
      }
      if (error.response?.status === 403) {
        return NextResponse.json(
          { error: "Access denied to this file" },
          { status: 403 }
        );
      }
    }
    return NextResponse.json(
      { error: "Failed to fetch file information" },
      { status: 500 }
    );
  }
}
