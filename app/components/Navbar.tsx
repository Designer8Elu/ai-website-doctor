"use client";

import { navigate } from "next/dist/client/components/segment-cache/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-purple-500/20">
            W
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">
            WebDoctor<span className="text-purple-600">.ai</span>
          </span>
        </div>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="#features" className="hover:text-purple-600 transition">Features</Link>
          <Link href="#how-it-works" className="hover:text-purple-600 transition">How It Works</Link>
          <Link href="#pricing" className="hover:text-purple-600 transition">Pricing</Link>
          <Link href="#faq" className="hover:text-purple-600 transition">FAQ</Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/auth")} className="text-sm font-medium text-slate-700 hover:text-slate-900">
            Sign In
          </button>
          <button onClick={() => router.push('/auth')} className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-sm shadow-purple-600/30">
            Get Started Free
          </button>
        </div>
      </div>
    </header>
  );
}