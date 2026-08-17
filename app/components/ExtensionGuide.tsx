"use client";

import { useState } from "react";

interface ExtensionGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExtensionGuide({ isOpen, onClose }: ExtensionGuideProps) {

  const steps = [
    {
      title: "Extract the ZIP File",
      description: "Unzip the downloaded 'ai-website-doctor-extension.zip' file to any location on your computer.",
      icon: "📦",
    },
    {
      title: "Open Chrome Extensions Page",
      description: "Go to chrome://extensions/ in your Chrome address bar, or click Menu → More Tools → Extensions.",
      icon: "⚙️",
    },
    {
      title: "Enable Developer Mode",
      description: "Toggle 'Developer mode' in the top-right corner of the extensions page.",
      icon: "🔧",
    },
    {
      title: "Load Unpacked Extension",
      description: "Click 'Load unpacked' and select the extracted 'chrome-extension' folder.",
      icon: "📂",
    },
    {
      title: "Verify Installation",
      description: "You should see 'AI Website Doctor' in your extensions list. Pin it to your Chrome toolbar for easy access.",
      icon: "✅",
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">How to Install the Chrome Extension</h2>
          <button
            onClick={onClose}
            className="text-xl font-bold text-slate-500 cursor-pointer hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`rounded-lg p-3 transition-all ${
                "border-2 border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-xl">{step.icon}</div>
                <div className="flex-1">
                  <h3 className="text-md font-semibold text-slate-900">
                    Step {index + 1}: {step.title}
                  </h3>
                  <p className=" text-slate-700">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
