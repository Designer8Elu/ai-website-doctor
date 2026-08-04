"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';

export default function AuthPage() {
     const router = useRouter();
  // Toggle between Sign In (false) and Create Account (true)
  const [isSignUp, setIsSignUp] = useState(false);

  // Form states
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberOrTerms, setRememberOrTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }
      console.log("Signing up:", { fullName, email, password, agreeTerms: rememberOrTerms });
    } else {
      console.log("Signing in:", { email, password, rememberMe: rememberOrTerms });
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans antialiased">
      {/* ================= LEFT BRAND PANEL (Shared across both views) ================= */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-[#0B0D1B] text-white p-8 xl:p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800">
        
        {/* Top Branding */}
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-base shadow-lg shadow-purple-600/30">
            Dx
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            WebDoctor
          </span>
          <span className="text-[10px] font-semibold bg-purple-900/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
            AI
          </span>
        </div>

        {/* Hero Copy & Feature List */}
        <div className="my-8 space-y-8 max-w-lg">
          <div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Your website's AI-powered health system
            </h1>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              Instantly audit performance, SEO, accessibility, and security — with AI-generated code fixes ready to deploy.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 text-amber-400">
                ⚡
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Instant analysis</h2>
                <p className="text-xs text-slate-400">Full audit in under 30 seconds</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 text-purple-400">
                ✨
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-200">AI-generated fixes</h2>
                <p className="text-xs text-slate-400">One-click code patches for every issue</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 text-emerald-400">
                📈
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Track progress over time</h2>
                <p className="text-xs text-slate-400">Monitor your scores across every scan</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 text-cyan-400">
                🛡️
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Security monitoring</h2>
                <p className="text-xs text-slate-400">Real-time alerts on critical issues</p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
            <div>
              <div className="text-xl font-extrabold text-white">2.4M+</div>
              <div className="text-[11px] text-slate-400">Websites analyzed</div>
            </div>
            <div>
              <div className="text-xl font-extrabold text-white">18M+</div>
              <div className="text-[11px] text-slate-400">Issues detected</div>
            </div>
            <div>
              <div className="text-xl font-extrabold text-white">94%</div>
              <div className="text-[11px] text-slate-400">Avg score improvement</div>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial Card */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <p className="text-xs text-slate-300 italic leading-relaxed">
            "WebDoctor found 23 critical issues our team had missed for months. The AI fixes saved us 3 days of engineering work."
          </p>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                SC
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Sarah Chen</div>
                <div className="text-[10px] text-slate-400">Head of Eng • Stripe</div>
              </div>
            </div>
            <div className="text-amber-400 text-xs tracking-tighter">★★★★★</div>
          </div>
        </div>

      </div>

      {/* ================= RIGHT DYNAMIC FORM PANEL ================= */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md space-y-6">
          
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {isSignUp ? "Free forever. No credit card required." : "Sign in to continue to your dashboard"}
            </p>
          </div>

          {/* Social Auth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              {isSignUp ? "Continue with Google" : "Google"}
            </button>

            <button
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition shadow-sm"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              {isSignUp ? "Continue with GitHub" : "GitHub"}
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-slate-50 px-3 text-xs text-slate-400 absolute">
              or with email
            </span>
          </div>

          {/* Main Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name field (Only visible on Create Account) */}
            {isSignUp && (
              <div>
                <label htmlFor="fullname" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
                    👤
                  </span>
                  <input
                    id="fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sarah Chen"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                {isSignUp ? "Work email" : "Email address"}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
                  ✉
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@company.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition shadow-sm"
                />
              </div>
            </div>

            {/* Password Field / Confirm Fields */}
            {isSignUp ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition shadow-sm"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700">
                      Confirm
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-purple-600 font-semibold"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition shadow-sm"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <a href="#forgot" className="text-xs text-purple-600 font-medium hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
                    🔒
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-12 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}

            {/* Checkbox (Remember me vs Terms of service agreement) */}
            <div className="flex items-start gap-2 pt-1">
              <input
                id="checkbox-option"
                type="checkbox"
                required={isSignUp}
                checked={rememberOrTerms}
                onChange={(e) => setRememberOrTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="checkbox-option" className="text-xs text-slate-600 leading-normal">
                {isSignUp ? (
                  <>
                    I agree to the <a href="#terms" className="text-purple-600 underline">Terms of Service</a> and <a href="#privacy" className="text-purple-600 underline">Privacy Policy</a>
                  </>
                ) : (
                  "Remember me for 30 days"
                )}
              </label>
            </div>

            {/* Submit Action Button */}
            <button
            onClick={() => router.push('/dashboard')}
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition shadow-md shadow-purple-600/25 flex items-center justify-center gap-1.5"
            >
              {isSignUp ? "Create Free Account →" : "Sign In →"}
            </button>
          </form>

          {/* Footer Switch Link & Security Note */}
          <div className="text-center text-xs text-slate-500 space-y-4 pt-2">
            <p>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setRememberOrTerms(false);
                }}
                className="text-purple-600 font-semibold hover:underline focus:outline-none"
              >
                {isSignUp ? "Sign in" : "Create one free"}
              </button>
            </p>
            <p className="text-[11px] text-slate-400">
              Protected by enterprise-grade encryption • SOC 2 Type II
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}