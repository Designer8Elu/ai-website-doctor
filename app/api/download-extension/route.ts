import archiver from "archiver";
import { createReadStream } from "fs";
import { resolve } from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    const extensionPath = resolve(process.cwd(), "chrome-extension");

    // Set up the response headers
    const response = new NextResponse(null, {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="ai-website-doctor-extension.zip"',
      },
    });

    // Use a writable stream to pipe archive to response
    const chunks: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    archive.on("end", () => {
      // Respond with the zip file
      return response;
    });

    archive.on("error", (err: Error) => {
      console.error("Archive error:", err);
    });

    // Add all files from chrome-extension directory
    archive.directory(extensionPath, false);

    await archive.finalize();

    // Create the response body from chunks
    const body = Buffer.concat(chunks);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="ai-website-doctor-extension.zip"',
      },
    });
  } catch (error) {
    console.error("Download extension error:", error);
    return NextResponse.json({ error: "Failed to create extension archive" }, { status: 500 });
  }
}
