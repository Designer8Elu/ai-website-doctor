import { resolve } from "path";
import { NextResponse } from "next/server";
import { PassThrough } from "stream";

// @ts-ignore - archiver is a valid package with working types at runtime
const archiver = require("archiver");

export async function GET() {
  try {
    const extensionPath = resolve(process.cwd(), "chrome-extension");
    
    // Create a PassThrough stream to handle the data
    const passThrough = new PassThrough();
    
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    // Handle archive errors
    archive.on("error", (err: Error) => {
      console.error("Archive error:", err);
      passThrough.destroy(err);
    });

    // Pipe archive to passthrough stream
    archive.pipe(passThrough);

    // Add all files from chrome-extension directory
    archive.directory(extensionPath, false);

    // Finalize the archive
    await archive.finalize();

    return new Response(passThrough as unknown as BodyInit, {
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

