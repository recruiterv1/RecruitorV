import React from "react";

const MainEstablished=()=>{
  return (
    <main className="bg-gradient-to-b from-blue-50 to-white text-slate-800">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1 mb-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
          👑 Elite Partner Program
        </span>
        <h1 className="text-4xl md:text-5xl font-semibold mb-6">
          Add premium clients without doing business development.
        </h1>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto">
          Exclusive partnership for top-performing recruiters. Invitation only.
        </p>
      </section>

      {/* What Makes Elite Different */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-semibold text-center mb-12">
          What Makes Elite Different
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Limited partners per mandate",
              desc: "Maximum 3 recruiters per role with significantly higher closure probability.",
            },
            {
              title: "Exclusive roles",
              desc: "Premium mandates not available on other platforms. C-suite and niche roles.",
            },
            {
              title: "Brand leverage",
              desc: "Represent a respected recruitment brand with instant candidate credibility.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm p-8 border border-blue-100"
            >
              <div className="w-12 h-12 mb-4 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                {i + 1}
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Elite Partnership Benefits */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-3xl shadow-md p-10">
          <h2 className="text-2xl font-semibold text-center mb-12">
            Elite Partnership Benefits
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Account Manager, not SPOC",
                desc: "Dedicated account manager who understands your specialty and matches ideal mandates.",
              },
              {
                title: "Premium payout structure",
                desc: "Highest payout percentages with fastest payment cycles (3–5 days).",
              },
              {
                title: "Strategic business reviews",
                desc: "Quarterly planning sessions aligned on growth opportunities.",
              },
              {
                title: "First right of refusal",
                desc: "Premium roles offered to you before distribution to others.",
              },
              {
                title: "Brand co-marketing",
                desc: "Featured in marketing materials and thought leadership content.",
              },
              {
                title: "Elite network events",
                desc: "Exclusive access to networking events with senior HR leaders.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  ✓
                </div>
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Gets Invited */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-blue-50 rounded-3xl p-10">
          <h2 className="text-2xl font-semibold text-center mb-8">
            Who Gets Invited?
          </h2>
          <ul className="max-w-3xl mx-auto space-y-4">
            {["Proven track record with 15%+ closure rate over 6 months","High-quality submissions and strong conversion ratios","Deep specialization in specific industries or roles","Excellent professional conduct and feedback"].map(
              (item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">★</span>
                  <p className="text-slate-700">{item}</p>
                </li>
              )
            )}
          </ul>
        </div>
      </section>

      {/* Invite Only CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-semibold mb-4">
            Recruiterv Elite Partner
          </h2>
          <p className="text-lg text-blue-100 mb-2">Invite Only</p>
          <p className="text-blue-100 mb-8">
            Reserved for the top 5% of recruitment professionals
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-medium hover:bg-blue-50 transition">
            Express Interest →
          </button>
        </div>
      </section>
    </main>
  );
}
export default MainEstablished