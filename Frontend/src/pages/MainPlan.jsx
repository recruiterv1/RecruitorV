import React from "react";

const MainPlan=()=>{
  const plans = [
    {
      tag: "Fresher",
      title: "LaunchPad",
      price: "₹999/month",
      badgeBg: "bg-blue-100",
      badgeText: "text-blue-700",
      btn: "bg-blue-600 hover:bg-blue-700",
    },
    {
      tag: "Corporate",
      title: "SideHustle",
      price: "₹2,999/year",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-700",
      btn: "bg-emerald-600 hover:bg-emerald-700",
    },
    {
      tag: "Career Break",
      title: "Restart",
      price: "₹1,499/quarter",
      badgeBg: "bg-orange-100",
      badgeText: "text-orange-700",
      btn: "bg-orange-500 hover:bg-orange-600",
    },
    {
      tag: "Most Popular",
      title: "Pro Freelancer",
      price: "₹3,999/month",
      badgeBg: "bg-indigo-100",
      badgeText: "text-indigo-700",
      btn: "bg-indigo-600 hover:bg-indigo-700",
      highlight: true,
    },
    {
      tag: "Top Freelancers",
      title: "Elite Partner",
      price: "Invite Only",
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-700",
      btn: "bg-amber-500 hover:bg-amber-600",
    },
  ];

  return (
    <main className="bg-gradient-to-b from-blue-50 via-sky-50 to-white">
      {/* Compare Plans */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-semibold text-center text-gray-900">
          Compare Plans
        </h2>
        <p className="text-center text-gray-600 mt-4">
          Choose the plan that matches your recruitment journey
        </p>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl bg-white p-6 transition shadow-sm hover:shadow-md ${
                plan.highlight
                  ? "border-2 border-indigo-500"
                  : "border border-gray-200"
              }`}
            >
              <span
                className={`inline-block mb-4 px-3 py-1 text-xs font-medium rounded-full ${plan.badgeBg} ${plan.badgeText}`}
              >
                {plan.tag}
              </span>
              <h3 className="text-xl font-semibold text-gray-900">
                {plan.title}
              </h3>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {plan.price}
              </p>
              <button
                className={`mt-6 w-full rounded-xl py-2.5 text-sm font-medium text-white transition ${plan.btn}`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Table */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50">
              <tr className="text-left">
                {[
                  "Feature",
                  "LaunchPad",
                  "SideHustle",
                  "Restart",
                  "Pro Freelancer",
                  "Elite Partner",
                ].map((h) => (
                  <th key={h} className="px-6 py-4 font-semibold text-gray-800">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {["Live Mandates", "Training", "Support", "Payout Speed", "Competition"].map(
                (feature, i) => (
                  <tr key={i} className="hover:bg-blue-50/40">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {feature}
                    </td>
                    <td className="px-6 py-4">Limited</td>
                    <td className="px-6 py-4">Selective</td>
                    <td className="px-6 py-4">Limited</td>
                    <td className="px-6 py-4 text-indigo-700 font-medium">
                      Unlimited
                    </td>
                    <td className="px-6 py-4 text-amber-700 font-medium">
                      Premium only
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Growth Journey */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-12 text-center">
          <h3 className="text-3xl font-semibold text-gray-900">
            Your Growth Journey
          </h3>
          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4">
            <span className="px-6 py-3 bg-white rounded-xl shadow-sm text-sm">
              LaunchPad / SideHustle / Restart
            </span>
            <span className="text-indigo-500">→</span>
            <span className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-sm text-sm">
              Pro Freelancer
            </span>
            <span className="text-indigo-500">→</span>
            <span className="px-6 py-3 bg-amber-500 text-white rounded-xl shadow-sm text-sm">
              Elite Partner
            </span>
          </div>
          <p className="mt-6 text-gray-600 text-sm">
            Automatic upgrade prompts based on your performance and closure rates
          </p>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="max-w-6xl mx-auto px-6 pb-24 text-center">
        <h3 className="text-3xl font-semibold text-gray-900">
          Not Paying for Jobs. Paying for Outcomes.
        </h3>
        <p className="mt-4 text-gray-600 max-w-3xl mx-auto">
          Recruiterv enables recruiters to focus purely on hiring by removing
          client acquisition, mandate confusion, and operational friction.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {["No client hunting", "No operational delays", "Higher closure rates"].map(
            (item) => (
              <div
                key={item}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              >
                <p className="font-medium text-gray-800">{item}</p>
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}
export default MainPlan