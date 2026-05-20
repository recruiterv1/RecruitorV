import React from "react";
import Header from './Header';
import Footer from './Footer';
import { RefreshCw, Users, Target, BookOpen, Award, CheckCircle, XCircle, ArrowRight, Briefcase, Heart, Globe, Clock } from "lucide-react";

const MainRestart = () => {
  return (
    <>
      <Header />
      <div className="bg-gradient-to-b from-teal-50 to-white text-gray-800">

        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 py-20 text-center">
          <span className="inline-block mb-4 px-4 py-1 text-sm font-medium text-teal-700 bg-teal-100 rounded-full">
            Career Restart Program
          </span>

          <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-gray-900">
            Restart Your Recruitment Career
            <br /> with Confidence
          </h1>

          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            RecruiterV offers a structured, freelance-first career restart opportunity for experienced recruitment professionals who want flexibility without losing the feeling of working with a real team.
          </p>
          
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            Whether your break was for family, health, relocation, or personal reasons—your experience still matters.
          </p>
        </section>

        {/* Who Is This Opportunity For */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-10">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Who Is This Opportunity For?
            </h2>

            <p className="text-center text-gray-600 mb-8">
              RecruiterV's Career Restart program is ideal for professionals who:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Have prior experience in recruitment / talent acquisition / staffing",
                "Took a career break and now want to re-enter the workforce",
                "Prefer freelance, remote recruitment work",
                "Want access to live client hiring mandates",
                "Value guidance, feedback, and collaboration, not isolation",
                "Career break is not a barrier. Commitment and capability are.",
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-teal-50 rounded-lg">
                  <CheckCircle size={20} className="text-teal-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why RecruiterV Is Ideal for Career Restarters */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-semibold text-center mb-4">
            Why RecruiterV Is Ideal for Career Restarters
          </h2>

          {/* A True Team Experience */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl p-10 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users size={28} />
              <h3 className="text-xl font-semibold">A True Team Experience (Even as a Freelancer)</h3>
            </div>
            <p className="text-teal-100 mb-4">
              Unlike typical freelance platforms, RecruiterV ensures you never work alone.
            </p>
            <p className="text-lg font-medium">
              For every position, RecruiterV assigns a dedicated Client SPOC who works closely with you throughout the hiring process.
            </p>
          </div>

          {/* Dedicated Client SPOC */}
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-10 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Target size={28} className="text-teal-600" />
              <h3 className="text-xl font-semibold">Dedicated Client SPOC for Every Role</h3>
            </div>
            
            <p className="text-gray-600 mb-6">Your Client SPOC:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Assigns positions based on your skills and hiring background",
                "Shares regular updates on every CV you submit",
                "Clearly explains why a CV is shortlisted or rejected",
                "Keeps you informed about interview schedules and feedback",
                "Advises you on candidate engagement and follow-ups",
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-teal-50 rounded-lg">
              <p className="text-gray-700">
                This structured support is especially valuable when you are restarting after a career break.
              </p>
            </div>
          </div>

          {/* Right Roles, Not Random Work */}
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-10">
            <div className="flex items-center gap-3 mb-6">
              <Briefcase size={28} className="text-teal-600" />
              <h3 className="text-xl font-semibold">Right Roles, Not Random Work</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "No Random Positions",
                  desc: "You are not given random or irrelevant positions",
                },
                {
                  title: "Aligned to Expertise",
                  desc: "Roles are aligned to your domain expertise and comfort level",
                },
                {
                  title: "Gradual Scaling",
                  desc: "You can scale your workload gradually, at your own pace",
                },
              ].map((item, index) => (
                <div key={index} className="text-center p-6 bg-teal-50 rounded-xl">
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-gray-700 text-center">
              This allows you to rebuild confidence and momentum step by step.
            </p>
          </div>
        </section>

        {/* Free Access to Hiring Gurus */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-10">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen size={28} className="text-teal-600" />
              <h3 className="text-2xl font-semibold">Free Access to Hiring Gurus</h3>
            </div>

            <p className="text-gray-600 mb-6">
              All RecruiterV recruiters get free access to Hiring Gurus—experienced professionals who help you refresh and upgrade your recruitment skills.
            </p>

            <p className="text-gray-600 mb-4">Hiring Gurus help you:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Refresh modern hiring techniques",
                "Learn new sourcing tools and methods",
                "Improve candidate engagement strategies",
                "Understand what practices work today and what can be dropped",
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg">
                  <CheckCircle size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg">
              <p className="text-teal-800 font-medium">
                Perfect for recruiters returning after a break who want to feel current and relevant again.
              </p>
            </div>
          </div>
        </section>

        {/* Guidance from Seasoned Industry Experts */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl p-10">
            <div className="flex items-center gap-3 mb-6">
              <Award size={28} />
              <h3 className="text-2xl font-semibold">Guidance from Seasoned Industry Experts</h3>
            </div>

            <p className="text-teal-100 mb-6">
              RecruiterV also gives you access to a seasoned Expert Panel. Professionals who have been into interview panels with similar industries are only selected as Expert Panel.
            </p>

            <p className="text-white mb-4 font-medium">Experts guide you on:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Identifying the best-fit candidate profiles",
                "Understanding hiring manager expectations",
                "Avoiding common resume misinterpretations",
                "Thinking beyond keywords and resumes",
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <CheckCircle size={18} className="text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-white/20 backdrop-blur-sm rounded-lg">
              <p className="text-white font-medium">
                This expert guidance helps bridge the confidence gap many career restarters face.
              </p>
            </div>
          </div>
        </section>

        {/* What We Look For */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-10">
            <h2 className="text-2xl font-semibold text-center mb-8">
              What We Look For
            </h2>

            <p className="text-center text-gray-600 mb-8">
              To maintain quality and trust, we onboard recruiters who:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                "Have hands-on recruitment experience",
                "Want to restart recruitment as a serious profession",
                "Are open to feedback, learning, and collaboration",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-teal-50 rounded-lg">
                  <CheckCircle size={20} className="text-teal-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* This May Not Be the Right Fit If */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-10">
            <h3 className="text-xl font-semibold text-center mb-6">
              This May Not Be the Right Fit If You Are Looking For
            </h3>

            <div className="space-y-4">
              {[
                "Guaranteed income without performance",
                "Non-recruitment career switching",
                "Casual or experimental freelance work",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-lg">
                  <XCircle size={20} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ready to Get Started */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-semibold mb-4">
              Ready to Restart Your Career?
            </h2>

            <p className="text-teal-100 mb-8 max-w-xl mx-auto">
              Join RecruiterV's Career Restart program and get back to doing what you love—with full support every step of the way.
            </p>

            <button className="bg-white text-teal-600 px-8 py-3 rounded-lg font-medium hover:bg-teal-50 transition flex items-center justify-center gap-2 mx-auto">
              <span>Start Your Journey</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </section>

      </div>
      <Footer />
    </>
  );
};

export default MainRestart;

