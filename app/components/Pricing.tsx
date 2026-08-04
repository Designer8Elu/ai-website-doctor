const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for quick checks and personal sites.",
    features: ["5 Audits per month", "Basic SEO & Alt Check", "Cheerio DOM Parsing", "Summary Report"],
    buttonText: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "Ideal for web developers, freelancers, and small teams.",
    features: ["Unlimited Audits", "Full AI Remediation Steps", "Deep Security & Core Web Vitals", "PDF Exportable Reports", "API Endpoint Access"],
    buttonText: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Custom",
    price: "Custom",
    description: "Built for enterprise agencies managing hundreds of client domains.",
    features: ["Bulk Automated Scanning", "Custom Webhook Integrations", "Dedicated Support", "SLA Guarantee"],
    buttonText: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-600 mt-3">Start free, upgrade as your site needs grow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-2xl p-8 flex flex-col justify-between transition-all ${
                plan.popular
                  ? "bg-purple-900 text-white shadow-xl ring-2 ring-purple-600"
                  : "bg-white text-slate-900 border border-slate-200"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className={`text-xs mt-1 ${plan.popular ? "text-purple-200" : "text-slate-500"}`}>
                  {plan.description}
                </p>

                <div className="my-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  {plan.period && <span className="text-sm opacity-80">{plan.period}</span>}
                </div>

                <ul className="space-y-3 text-sm border-t border-slate-200/20 pt-6">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2">
                      <span className="text-purple-400 font-bold">✓</span> {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`mt-8 w-full py-3 rounded-lg font-semibold text-sm transition ${
                  plan.popular
                    ? "bg-white text-purple-900 hover:bg-slate-100"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}