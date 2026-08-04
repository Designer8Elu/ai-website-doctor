import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      {/* Bottom CTA Banner */}
      <div className="border-b border-slate-800 py-16 text-center px-6 bg-gradient-to-b from-slate-900 to-purple-950/40">
        <h2 className="text-3xl font-extrabold text-white">Start Healing Your Website Today</h2>
        <p className="text-slate-400 mt-2 max-w-lg mx-auto text-sm">
          Run your first automated audit in seconds using our modern Next.js and Cheerio analysis suite.
        </p>
        <button className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition shadow-lg shadow-purple-600/30">
          Run Free Website Audit
        </button>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
        <div>
          <span className="font-bold text-white text-sm">WebDoctor.ai</span>
          <p className="mt-2 text-slate-500 leading-relaxed">
            Automated website health and performance audits built for modern developers.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Product</h4>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:text-white">Features</Link></li>
            <li><Link href="#" className="hover:text-white">Pricing</Link></li>
            <li><Link href="#" className="hover:text-white">API Reference</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Company</h4>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:text-white">About</Link></li>
            <li><Link href="#" className="hover:text-white">Blog</Link></li>
            <li><Link href="#" className="hover:text-white">Careers</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Legal</h4>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:text-white">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 text-center py-6 text-slate-600 text-xs">
        © {new Date().getFullYear()} WebDoctor.ai. All rights reserved.
      </div>
    </footer>
  );
}