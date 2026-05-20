import React from "react";
import Header from './Header';
import Footer from './Footer';
import { Brain, Target, Users, CheckCircle, Lightbulb, ArrowRight, Award, TrendingUp, Briefcase } from "lucide-react";

const MainExpert = () => {
  return (
    <>
      <Header />
      <div className="bg-gradient-to-b from-slate-50 to-white text-gray-800">

        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 py-20 text-center">
          <span className="inline-block mb-4 px-4 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-full">
            Join as a Freelance Expert Panel
          </span>

          <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-gray-900">
            Be the Mind Behind Great Hires
          </h1>

          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Monetize your hiring judgment and help recruiters make better decisions —
            without attending endless interviews yourself.
          </p>
        </section>

        {/* If You've Ever Thought... */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-10">
            <h2 className="text-2xl font-semibold text-center mb-8">
              If You've Ever Thought…
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Most recruiters don't really understand what panels look for.",
                "Good candidates get rejected for avoidable reasons.",
                "Hiring decisions are often made without clarity.",
                "My interview judgment took years to build — there should be a way to use it beyond my own team.",
              ].map((thought, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg">
                  <span className="text-indigo-600 font-bold">"{thought}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why This Role Exists */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-2xl p-10">
            <h2 className="text-2xl font-semibold text-center mb-6">
              Why This Role Exists (And Why It's Powerful)
            </h2>
            
            <div className="text-center mb-8">
              <p className="text-xl font-medium text-indigo-100">
                Recruitment doesn't fail due to lack of resumes.<br />
                It fails due to lack of judgment at the sourcing stage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Freelance recruiters",
                  desc: "Work in isolation",
                },
                {
                  title: "Rely on JDs",
                  desc: "That don't reflect reality",
                },
                {
                  title: "Guess what",
                  desc: "Interview panels might probe",
                },
              ].map((item, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-indigo-100 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What You Actually Do as a Panel Expert */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-semibold text-center mb-4">
            What You Actually Do as a Panel Expert
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            You become the thinking layer behind great hiring.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-8">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <Target size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-4">You Will</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Decode what the client really wants beyond the JD</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Advise recruiters on which companies to target</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Share which backgrounds usually succeed</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Identify which profiles look good but fail interviews</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Share how panels evaluate depth, not keywords</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Help recruiters screen with a panel mindset</span>
                </li>
              </ul>
            </div>

            <div className="bg-indigo-50 rounded-xl p-8 flex flex-col justify-center">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-indigo-600 text-white mx-auto mb-6">
                <Brain size={32} />
              </div>
              <h3 className="text-xl font-semibold text-center mb-4">Your Value</h3>
              <p className="text-gray-700 text-center">
                You transform raw hiring into strategic hiring. Your years of interview experience become a scalable asset that improves hiring outcomes across multiple organizations.
              </p>
            </div>
          </div>
        </section>

        {/* Why This Is Exciting for Senior Professionals */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-10">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Why This Is Exciting for Senior Professionals
            </h2>

            <p className="text-center text-xl text-indigo-600 font-medium mb-10">
              Because for the first time:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <TrendingUp size={24} />,
                  title: "Your hiring wisdom scales",
                  desc: "Influence hiring decisions across multiple companies",
                },
                {
                  icon: <Users size={24} />,
                  title: "Your judgment influences multiple companies",
                  desc: "Expand your impact beyond your current role",
                },
                {
                  icon: <span className="text-xl">₹</span>,
                  title: "Your experience gets monetized without burnout",
                  desc: "Earn income without attending every interview",
                },
                {
                  icon: <Lightbulb size={24} />,
                  title: "You shape outcomes, not calendars",
                  desc: "Focus on strategy, not scheduling",
                },
              ].map((item, index) => (
                <div key={index} className="text-center p-6">
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mx-auto mb-4">
                    {item.icon}
                  </div>
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Revenue Model */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-b from-indigo-50 to-white rounded-2xl border border-indigo-200 p-10 text-center">
            <h2 className="text-2xl font-semibold mb-8">
              Revenue Model (Aligned With Impact)
            </h2>

            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-8 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-3xl font-bold text-gray-900">10%</span>
              </div>
              <p className="text-gray-600 mb-4">
                of the revenue earned by Changeleaders
              </p>
              <p className="text-sm text-gray-500">
                Applicable for successfully closed positions
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-gray-600">
              <CheckCircle size={20} className="text-green-600" />
              <span>Payment released within 7 days after 90-day candidate retention</span>
            </div>

            <p className="mt-6 text-gray-700">
              You earn when your guidance leads to durable, high-quality hires.
            </p>
          </div>
        </section>

        {/* Who This Role Is Ideal For */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-semibold text-center mb-10">
            This Role Is Ideal For
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {[
              {
                icon: <Award size={24} />,
                title: "Ex-CXOs & Functional Heads",
                desc: "Leaders with extensive hiring experience at the highest levels",
              },
              {
                icon: <Briefcase size={24} />,
                title: "Senior Managers",
                desc: "Professionals with strong experience in interview judgement",
              },
              {
                icon: <Brain size={24} />,
                title: "Architects & Domain Specialists",
                desc: "Experts who understand what makes candidates succeed",
              },
              {
                icon: <TrendingUp size={24} />,
                title: "Advisory Professionals",
                desc: "Those transitioning into advisory or portfolio careers",
              },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 flex gap-4">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-indigo-600 rounded-2xl p-8 text-center">
            <p className="text-white text-lg mb-2">
              If people have said:
            </p>
            <p className="text-2xl font-semibold text-white">
              "Your interview judgment is sharp."
            </p>
            <p className="text-indigo-200 text-lg mt-4">
              You belong here.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-semibold mb-4">
              Ready to Monetize Your Hiring Wisdom?
            </h2>

            <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
              Join our panel of expert advisors and start influencing better hiring decisions today.
            </p>

            <button className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-medium hover:bg-indigo-50 transition flex items-center justify-center gap-2 mx-auto">
              <span>Apply Now</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </section>

      </div>
      <Footer />
    </>
  );
};

export default MainExpert;

