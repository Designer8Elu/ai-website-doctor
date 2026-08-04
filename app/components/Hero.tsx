"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";

export default function Hero() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextUrl = url.trim();
    if (!nextUrl) return;

    router.push("/dashboard?url=" + encodeURIComponent(nextUrl));
  }

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-purple-50/50 via-white to-slate-50">
      <AnimatedGridPattern
      style={{zIndex:1, opacity:0.5}}
        numSquares={30}
        maxOpacity={0.15}
        duration={3}
        repeatDelay={1}
        className={cn(
          "absolute inset-0 -z-10",
          "[mask-image:radial-gradient(900px_circle_at_center,white,transparent)]" ,
        )}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column - Content */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold tracking-wide border border-purple-200">
            <span>✨ Powered by AI & Cheerio Engine</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
            AI Website{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              Doctor
            </span>
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
            An all-in-one automated website auditor. Detect SEO issues,
            performance bottlenecks, accessibility standard gaps, and security
            risks in seconds.
          </p>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-2 max-w-md bg-white p-2 rounded-xl shadow-lg border border-slate-200"
          >
            <input
              type="url"
              required
              placeholder="https://yourwebsite.com"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="flex-1 px-4 py-2.5 text-sm outline-none text-slate-800 placeholder-slate-400 bg-transparent"
            />
            <button
              type="submit"
              disabled={url.trim() === ""}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-all shadow-md shadow-purple-600/20 shrink-0"
            >
              Analyze
            </button>
          </form>
          <p className="text-xs text-slate-400">
            ⚡ Free audit • Instant report • No credit card required
          </p>
        </div>

        {/* Right Column - Scorecard Graphic Mockup */}
        <div className="lg:col-span-6">
          <div className="relative rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                audit-report.json
              </span>
            </div>

            {/* Score Ring / Display */}
            <div className="flex items-center justify-between bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Overall Score
                </span>
                <div className="text-4xl font-extrabold text-green-400 mt-1">
                  87<span className="text-lg text-slate-500">/100</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                  Passed Audit
                </span>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">SEO Health</span>
                <div className="text-lg font-bold text-indigo-400 mt-1">
                  94%
                </div>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Performance</span>
                <div className="text-lg font-bold text-emerald-400 mt-1">
                  82%
                </div>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Accessibility</span>
                <div className="text-lg font-bold text-amber-400 mt-1">78%</div>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Security</span>
                <div className="text-lg font-bold text-cyan-400 mt-1">95%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
