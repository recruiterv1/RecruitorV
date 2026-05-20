import React from "react";
import Header from './Header';
import Footer from './Footer';
import { Briefcase, Users, Target, TrendingUp, CheckCircle, Clock, ArrowRight, Award } from "lucide-react";

const MainCorporate = () => {
  return (
    <>
      <Header />
      <div className="bg-gradient-to-b from-blue-50 to-white text-gray-800">

        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 py-20 text-center">
          <span className="inline-block mb-4 px-4 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
            For Corporate Recruiters
          </span>

          <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-gray-900">
            Use Your Recruitment Skills
            <br /> Selectively
          </h1>

          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Turn your recruitment expertise into side income —
            work on your terms, without compromising your primary job.
          </p>
        </section>

        {/* How It Works */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-semibold text-center mb-12">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Briefcase size={24} />,
                title: "Access verified, active hiring roles",
                desc: "Browse pre-qualified positions ready for sourcing",
              },
              {
                icon: <Target size={24} />,
                title: "Choose one role at a time",
                desc: "Or as many as you can do justice to",
              },
              {
                icon: <TrendingUp size={24} />,
                title: "Work with consistency",
                desc: "Focus on the roles you select",
              },
              {
                icon: <Users size={24} />,
                title: "Submit carefully screened profiles",
                desc: "Role-relevant candidates only",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 text-center"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quality Policy */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Target size={28} className="text-blue-600" />
              <h2 className="text-2xl font-semibold">
                Quality Policy
              </h2>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <p className="text-lg text-gray-700">
                For every position, each recruiter may submit a <span className="font-bold text-blue-700">maximum of 3 CVs</span>.
              </p>
            </div>
            
            <p className="text-center text-gray-600 mt-6">
              Fewer, better submissions lead to better outcomes.
            </p>
          </div>
        </section>

        {/* How You're Measured */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-10">
            <h2 className="text-2xl font-semibold text-center mb-6">
              How You're Measured
            </h2>
            
            <p className="text-center text-xl mb-6 text-blue-100">
              Performance is measured through your <span className="font-semibold text-white">CV Selection Ratio</span> — the percentage of your submissions shortlisted by the client.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <p className="text-lg font-medium">
                Fewer, better submissions lead to better outcomes.
              </p>
            </div>
          </div>
        </section>

        {/* How You're Compensated */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-semibold text-center mb-10">
            How You're Compensated
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Revenue Share */}
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">₹</span>
                <h3 className="text-xl font-semibold">Revenue Share</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Earn a share of actual client revenue (typically <span className="font-bold text-gray-900">6%–15% of Fixed CTC</span>)
              </p>
            </div>

            {/* Commission Tiers */}
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp size={28} className="text-blue-600" />
                <h3 className="text-xl font-semibold">Commission Tiers</h3>
              </div>
              <div className="space-y-3">
                {[
                  { tier: "50%", ratio: "70%+ selection ratio", highlight: true },
                  { tier: "40%", ratio: "60–69% selection ratio" },
                  { tier: "30%", ratio: "50–59% selection ratio" },
                ].map((item, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${item.highlight ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                    <span className={`font-bold ${item.highlight ? 'text-green-700' : 'text-gray-700'}`}>{item.tier}</span>
                    <span className="text-sm text-gray-600">{item.ratio}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bonus Commission */}
          <div className="mt-8 bg-gradient-to-b from-green-50 to-white rounded-2xl border border-green-200 p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Award size={24} className="text-green-600" />
              <span className="text-xl font-semibold text-gray-900">🎯 2 or more candidate joinings in a month</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              → additional 10% commission
            </p>
          </div>
        </section>

        {/* Payment Cycle */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-10">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Payment Cycle
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: <Clock size={24} />,
                  title: "50% after 1 month",
                  desc: "When candidate completes their first month",
                },
                {
                  icon: <CheckCircle size={24} />,
                  title: "50% after 90 days",
                  desc: "When candidate completes 90 days",
                },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-6 bg-blue-50 rounded-xl">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What This Model Respects */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-10">
            <h2 className="text-2xl font-semibold text-center mb-8">
              What This Model Respects
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                "Your current role and employer obligations",
                "Your available time",
                "Your professional judgment",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* In One Line */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-10 text-center">
            <h3 className="text-lg font-medium mb-4 text-blue-100">
              In One Line
            </h3>
            <p className="text-2xl font-semibold">
              Recruiterv allows recruiters to work on a limited number of roles, submit up to three high-quality profiles per position, and earn based on outcomes—without compromising their primary job.
            </p>
          </div>
        </section>

        {/* Ready to Get Started */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-semibold mb-8">
              Ready to Get Started?
            </h2>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition flex items-center justify-center gap-2">
                <span>View Active Roles</span>
                <ArrowRight size={20} />
              </button>
              
              <button className="bg-blue-700 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-800 transition flex items-center justify-center gap-2">
                <span>Apply to Participate</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </section>

      </div>
      <Footer />
    </>
  );
};

export default MainCorporate;

