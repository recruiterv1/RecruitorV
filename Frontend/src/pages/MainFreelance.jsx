import React from "react";

const MainFreelance=()=>{
  return (
    <main className="bg-gradient-to-b from-blue-50 to-white text-slate-800">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1 mb-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
          🚀 Full-Time Freelancing
        </span>
        <h1 className="text-4xl md:text-5xl font-semibold mb-6">
          Turn recruitment into your full-time income stream.
        </h1>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto">
          Build a sustainable freelance career with consistent mandates and professional support.
        </p>
      </section>

      {/* Built for Success */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-semibold text-center mb-12">
          Built for Full-Time Success
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Predictable mandates",
              desc: "Consistent flow of quality roles so you can plan your month with confidence.",
            },
            {
              title: "Faster payouts",
              desc: "Optimized payment cycles to manage your cash flow better.",
            },
            {
              title: "Dedicated SPOC",
              desc: "Single point of contact for quick resolutions and guidance.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm p-8 border border-slate-100"
            >
              <div className="w-12 h-12 mb-4 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">
                {i + 1}
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pro Level Benefits */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-3xl shadow-md p-10">
          <h2 className="text-2xl font-semibold text-center mb-12">
            Pro-Level Benefits
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Priority Mandate Access",
                desc: "Get first look at new client requirements.",
              },
              {
                title: "Higher Earning Potential",
                desc: "Premium mandates with better payout structures.",
              },
              {
                title: "Strategic Partnership",
                desc: "Treated as a core partner, not just a vendor.",
              },
              {
                title: "Performance Dashboard",
                desc: "Track performance with advanced analytics.",
              },
              {
                title: "Exclusive Client Network",
                desc: "Work with premium clients you couldn’t access alone.",
              },
              {
                title: "Business Development Support",
                desc: "We handle BD, negotiations, and client management.",
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

      {/* By the Numbers */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-blue-50 rounded-3xl p-10 grid md:grid-cols-3 text-center gap-8">
          <div>
            <p className="text-3xl font-semibold text-blue-600">50+</p>
            <p className="text-sm text-slate-600">Active mandates monthly</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-blue-600">7 days</p>
            <p className="text-sm text-slate-600">Average payout cycle</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-blue-600">24/5</p>
            <p className="text-sm text-slate-600">SPOC availability</p>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-semibold mb-4">
            Recruiterv Pro Freelancer
          </h2>
          <p className="text-4xl font-bold mb-4">₹3,999<span className="text-lg font-medium">/month</span></p>
          <p className="text-blue-100 mb-8">
            Everything you need to run recruitment as a full-time business
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-medium hover:bg-blue-50 transition">
            Go Full-Time →
          </button>
        </div>
      </section>
    </main>
  );
}
export default MainFreelance