"use client";

import { useState } from "react";
import ExtensionGuide from "./ExtensionGuide";

export default function DownloadExtensionButton() {
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/download-extension");

      if (!response.ok) {
        throw new Error("Failed to download extension");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ai-website-doctor-extension.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show guide after download
      setShowGuide(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download extension");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-2 ">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="cursor-pointer inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? "Downloading..." : "Download Chrome Extension"}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGuide(true)}
            className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            View Installation Guide
          </button>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      <ExtensionGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </>
  );
}
