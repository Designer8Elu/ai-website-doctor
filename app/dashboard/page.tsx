"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAudit } from "@/hooks/useAudit";
import Report from "../components/Report";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";

// Mock issue data corresponding to the design screenshot
const INITIAL_ISSUES = [
  {
    id: 1,
    title: "Missing alt attributes on 12 images",
    category: "Accessibility",
    severity: "High",
    pages: "8 pages",
    aiFix: "Available",
    status: "Open",
  },
  {
    id: 2,
    title: "Render-blocking resources (3 scripts)",
    category: "Performance",
    severity: "Medium",
    pages: "3 pages",
    aiFix: "Available",
    status: "In Progress",
  },
  {
    id: 3,
    title: "Missing meta descriptions",
    category: "SEO",
    severity: "Medium",
    pages: "15 pages",
    aiFix: "Available",
    status: "Open",
  },
  {
    id: 4,
    title: "Mixed content warnings",
    category: "Security",
    severity: "High",
    pages: "2 pages",
    aiFix: "Available",
    status: "Fixed",
  },
  {
    id: 5,
    title: "Low color contrast ratios",
    category: "Accessibility",
    severity: "Medium",
    pages: "5 pages",
    aiFix: "Available",
    status: "Open",
  },
  {
    id: 6,
    title: "Large unoptimized images",
    category: "Performance",
    severity: "Low",
    pages: "7 pages",
    aiFix: "Available",
    status: "Open",
  },
  {
    id: 7,
    title: "Duplicate H1 tags detected",
    category: "SEO",
    severity: "Medium",
    pages: "4 pages",
    aiFix: "Available",
    status: "Open",
  },
];

function DashboardContent() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") ?? "";
  const { url, setUrl, loading, error, report, elapsed, step, run } = useAudit(initialUrl);

  useEffect(() => {
    if (!initialUrl) return;
    void run(initialUrl);
  }, [initialUrl, run]);

  const overallScore = useMemo(() => {
    const score = report?.performance.mobile.data?.performanceScore ?? null;
    return score === null ? 87 : Math.round(score);
  }, [report]);

  const cardsLoading = loading && report !== null;

  const issueCount = useMemo(() => {
    if (!report) return 42;

    const accessibilityIssues = report.accessibility.data?.issues.length ?? 0;
    const securityIssues = report.security.data?.issues.length ?? 0;
    const seoIssues = report.seo.data?.failed ?? 0;
    const contentSeoIssues = report.contentSeo.data?.failed ?? 0;
    const imageIssues = report.images.data ? report.images.data.missingAlt + report.images.data.missingLazy : 0;
    const brokenLinks = report.links.data?.broken.length ?? 0;

    return accessibilityIssues + securityIssues + seoIssues + contentSeoIssues + imageIssues + brokenLinks;
  }, [report]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    await run(url);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex font-sans antialiased selection:bg-indigo-200 selection:text-slate-900">
      
      {/* ================= 1. SIDEBAR NAVIGATION ================= */}
      <aside className="w-64 bg-white/60 glass border-r border-gray-200 flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          {/* Logo & Workspace */}
          <div className="p-5 border-b border-gray-200 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500 flex items-center justify-center font-bold text-slate shadow-md">
              Dx
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate flex items-center gap-1.5">
                WebDoctor
                <span className="text-[9px] font-semibold bg-purple-900/80 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded-full">
                  AI
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">stripe.com</div>
            </div>
          </div>

          {/* Nav Items */}
            <nav className="p-3 space-y-1">
            {[
              { name: "Dashboard", icon: "📊" },
              { name: "Website Scan", icon: "🌐" },
              { name: "Reports", icon: "📄" },
              { name: "AI Fixes", icon: "✨", badge: "5" },
              { name: "History", icon: "🕒" },
              { name: "AI Assistant", icon: "💬" },
              { name: "Integrations", icon: "🔌" },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                  activeTab === item.name
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-indigo-600 text-slate text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Sidebar Settings & Mode Switch */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          <button className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white-800/50 transition">
            <span>💳</span> Billing
          </button>
          <button className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white-800/50 transition">
            <span>⚙️</span> Settings
          </button>
          
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between px-3.5 py-1">
            <span className="text-xs text-slate-400 font-medium">Light Mode</span>
            <div className="w-8 h-4 rounded-full bg-white-800 relative cursor-pointer border border-gray-700">
              <div className="w-3 h-3 rounded-full bg-white-400 absolute top-0.5 left-0.5" />
            </div>
          </div>
        </div>
      </aside>

      {/* ================= 2. MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-gray-200 bg-white/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <h1 className="text-sm font-semibold text-slate-700">Dashboard</h1>
          
          <div className="flex items-center gap-4">
            {/* Global Search */}
              <div className="relative hidden sm:block">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search..."
                className="w-48 xl:w-64 bg-white border border-gray-200 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-600 placeholder-slate-400 outline-none focus:border-indigo-300"
              />
              <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-[10px] font-mono text-slate-500 bg-white-800 px-1.5 py-0.5 rounded border border-gray-700">
                ⌘K
              </span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-slate-500 hover:text-slate-900 transition">
              🔔
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500" />
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-slate font-bold text-xs flex items-center justify-center border border-purple-400">
                SC
              </div>
              <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                Sarah Chen
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Welcome Banner & Instant Scan Input */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                Good morning, Sarah 👋
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {url} • Last scanned {report ? "just now" : "12 minutes ago"} •{" "}
                <span className="text-amber-600 font-medium">{issueCount} issues found</span>
              </p>
            </div>

            {/* URL Input */}
            <form onSubmit={handleScan} className="flex items-center gap-2 p-1.5 rounded-xl border border-gray-200 bg-white/60 glass">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-transparent px-3 py-1.5 text-xs text-slate-700 outline-none w-56 md:w-64 placeholder-slate-400 font-mono"
              />
              <button
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-600 text-slate font-semibold text-xs px-4 py-2 rounded-lg transition shadow-sm shrink-0"
              >
                Scan Now
              </button>
            </form>
          </div>

          {/* Overview Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Overall Health Card */}
            <div className="glass border border-gray-200 p-5 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden lg:col-span-1">
              <span className="text-xs font-semibold text-slate-500 mb-3">Overall Health</span>
              <div className="w-20 h-20 rounded-full border-4 border-indigo-500 flex items-center justify-center text-2xl font-extrabold text-slate-900 shadow-sm my-1 bg-white">
                {overallScore}
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full mt-3">
                +3 from last scan
              </span>
            </div>

            {/* Performance Card */}
            <div className="glass border border-gray-200 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">⚡ Performance</span>
                <span className="text-[10px] text-emerald-700 font-medium">+3 pts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-extrabold text-emerald-700 mt-4">{report?.performance.mobile.data?.performanceScore ?? 94}</div>
                {cardsLoading ? (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-slate-600">Updating</span>
                ) : null}
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-emerald-500 h-full w-[94%]" />
              </div>
            </div>

            {/* SEO Card */}
            <div className="glass border border-gray-200 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">🔍 SEO</span>
                <span className="text-[10px] text-emerald-700 font-medium">+1 pts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-extrabold text-indigo-600 mt-4">{report?.seo.data ? Math.max(0, 100 - (report.seo.data.failed * 10)) : 88}</div>
                {cardsLoading ? (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-slate-600">Updating</span>
                ) : null}
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-indigo-500 h-full w-[88%]" />
              </div>
            </div>

            {/* Accessibility Card */}
            <div className="glass border border-gray-200 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">♿ Accessibility</span>
                <span className="text-[10px] text-red-600 font-medium">-2 pts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-extrabold text-amber-700 mt-4">{report?.accessibility.data ? Math.max(0, 100 - (report.accessibility.data.failed * 12)) : 76}</div>
                {cardsLoading ? (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-slate-600">Updating</span>
                ) : null}
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-amber-500 h-full w-[76%]" />
              </div>
            </div>

            {/* Security Card */}
            <div className="glass border border-gray-200 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">🛡️ Security</span>
                <span className="text-[10px] text-slate-500 font-medium">±0 pts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-extrabold text-cyan-600 mt-4">{report?.security.data ? Math.max(0, 100 - (report.security.data.failed * 8)) : 91}</div>
                {cardsLoading ? (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-slate-600">Updating</span>
                ) : null}
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-cyan-500 h-full w-[91%]" />
              </div>
            </div>

          </div>

          {loading ? (
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/60 glass p-5">
              <AnimatedGridPattern
                style={{ zIndex: 1, opacity: 0.2 }}
                numSquares={24}
                maxOpacity={0.18}
                duration={3}
                repeatDelay={1}
                className={cn("absolute inset-0 -z-10", "[mask-image:radial-gradient(900px_circle_at_center,white,transparent)]")}
              />
              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{step}</p>
                    <p className="text-xs text-slate-500">{elapsed}s elapsed</p>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(10, elapsed * 8))}%` }} />
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {report ? (
            <div className="bg-[#0B0D1B] border border-gray-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Latest Audit Report
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Showing the latest analysis for {url}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-800  p-4">
                <Report report={report} />
              </div>
            </div>
          ) : null}

          {/* Core Web Vitals Section */}
          <div className="bg-[#0B0D1B] border border-gray-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Core Web Vitals
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white-900/50 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                  <span>✓</span> Good
                </div>
                <div className="text-2xl font-bold text-slate mt-1">1.2s</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-0.5">LCP</div>
                <div className="text-[10px] text-slate-500">Largest Contentful Paint • &lt; 2.5s</div>
              </div>

              <div className="bg-white-900/50 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                  <span>✓</span> Good
                </div>
                <div className="text-2xl font-bold text-slate mt-1">18ms</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-0.5">FID</div>
                <div className="text-[10px] text-slate-500">First Input Delay • &lt; 100ms</div>
              </div>

              <div className="bg-white-900/50 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                  <span>✓</span> Good
                </div>
                <div className="text-2xl font-bold text-slate mt-1">0.02</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-0.5">CLS</div>
                <div className="text-[10px] text-slate-500">Cumulative Layout Shift • &lt; 0.1</div>
              </div>

              <div className="bg-white-900/50 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                  <span>✓</span> Good
                </div>
                <div className="text-2xl font-bold text-slate mt-1">340ms</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-0.5">TTFB</div>
                <div className="text-[10px] text-slate-500">Time to First Byte • &lt; 800ms</div>
              </div>

            </div>
          </div>

          {/* Issues Data Table */}
          <div className="bg-[#0B0D1B] border border-gray-200 rounded-2xl p-5 space-y-4">
            
            {/* Table Filters & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate">Issues</h3>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-purple-500"
                />

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-slate-500 outline-none focus:border-purple-500"
                >
                  <option>All categories</option>
                  <option>Accessibility</option>
                  <option>Performance</option>
                  <option>SEO</option>
                  <option>Security</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                    <th className="py-3 px-3">Issue</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Severity</th>
                    <th className="py-3 px-3">Pages</th>
                    <th className="py-3 px-3">AI Fix</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {INITIAL_ISSUES.map((issue) => (
                    <tr key={issue.id} className="hover:bg-white-900/40 transition">
                      
                      {/* Title */}
                      <td className="py-3.5 px-3 font-semibold text-slate-200">
                        {issue.title}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 text-slate-400">
                        {issue.category}
                      </td>

                      {/* Severity Pill */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            issue.severity === "High"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : issue.severity === "Medium"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-white-800 text-slate-400"
                          }`}
                        >
                          {issue.severity}
                        </span>
                      </td>

                      {/* Affected Pages */}
                      <td className="py-3.5 px-3 text-slate-400">
                        {issue.pages}
                      </td>

                      {/* AI Fix Badge */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition">
                          ✨ {issue.aiFix}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-right">
                        <span className={`font-semibold text-[11px] ${
                            issue.status === "Fixed"
                              ? "text-emerald-600"
                              : issue.status === "In Progress"
                              ? "text-amber-600"
                              : "text-slate-600"
                          }`}>
                          {issue.status}
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer Pagination */}
            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <span>Showing 7 of 42 issues</span>
              <div className="flex items-center gap-1">
                <button className="w-6 h-6 rounded-lg bg-indigo-600 text-slate font-bold flex items-center justify-center text-xs">
                  1
                </button>
                <button className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-slate-600 hover:bg-indigo-50 flex items-center justify-center text-xs">
                  2
                </button>
                <button className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-slate-600 hover:bg-indigo-50 flex items-center justify-center text-xs">
                  3
                </button>
                <span className="px-1">...</span>
                <button className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-slate-600 hover:bg-indigo-50 flex items-center justify-center text-xs">
                  6
                </button>
              </div>
            </div>

          </div>

        </main>
      </div>

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070913] text-slate-100 flex items-center justify-center">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}