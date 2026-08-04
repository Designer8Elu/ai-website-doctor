const featureItems = [
  {
    title: "SEO Health Check",
    desc: "Scrapes and checks meta tags, OpenGraph data, heading hierarchies, and missing image alt attributes.",
    icon: "🔍",
  },
  {
    title: "Performance Metrics",
    desc: "Detects oversized assets, missing compression headers, and slow-rendering DOM structures.",
    icon: "⚡",
  },
  {
    title: "Accessibility (a11y)",
    desc: "Verifies HTML semantic structures, color contrasts, and aria-labels for screen reader compliance.",
    icon: "♿",
  },
  {
    title: "Security Auditing",
    desc: "Checks HTTPS deployment, modern security response headers, and vulnerable public scripts.",
    icon: "🛡️",
  },
  {
    title: "Cheerio DOM Parser",
    desc: "Fast, server-side static analysis extracts insights rapidly without heavy browser instances.",
    icon: "⚙️",
  },
  {
    title: "AI Actionable Fixes",
    desc: "Get intelligent step-by-step recommendations generated automatically for every detected issue.",
    icon: "🪄",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-white border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            Comprehensive Auditing
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-4">
            360° Website Intelligence
          </h2>
          <p className="text-slate-600 mt-3">
            Everything you need to diagnose bugs, improve ranking, and deliver optimal web experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureItems.map((item, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-purple-300 hover:shadow-lg transition duration-200"
            >
              <div className="text-3xl mb-4 bg-white w-12 h-12 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}