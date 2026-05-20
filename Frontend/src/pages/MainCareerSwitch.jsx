import React from "react";
import Header from './Header';
import Footer from './Footer';
import { Briefcase, Users, Target, BookOpen, Award, CheckCircle, XCircle, ArrowRight, GraduationCap, TrendingUp, Clock, Shield } from "lucide-react";

const MainCareerSwitch = () => {
  return (
    <>
      <Header />
      <div className="bg-gradient-to-b from-purple-50 to-white text-gray-800">

        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 py-20 text-center">
          <span className="inline-block mb-4 px-4 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded-full">
            Career Transition Program
          </span>

          <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-gray-900">
            Transition into Recruitment with
            <br /> Structure, Support, and Confidence
          </h1>

          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            RecruiterV enables Career Transition Recruiters—professionals moving into recruitment from other corporate roles—to build a credible, long-term recruitment career without the risks of going solo.
          </p>
          
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            Whether you are currently working in another function or returning after a career break, RecruiterV gives you a structured freelance pathway to enter recruitment with real hiring work, real guidance, and real team support.
          </p>
        </section>

        {/* Who Are Career Transition Recruiters */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-10">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Who Are Career Transition Recruiters?
            </h2>

            <p className="text-center text-gray-600 mb-8">
              Career Transition Recruiters are professionals who:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Have worked in non-recruitment corporate roles",
                "Want to move into recruitment as a profession",
                "May be currently employed and exploring recruitment as a side hustle",
                "Or may have taken a career break and now want to start in recruitment",
                "Prefer flexible, freelance, remote work with long-term growth potential",
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <CheckCircle size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl text-center">
              <p className="text-gray-700">
                You don't need prior recruitment experience.<br />
                <span className="font-semibold text-purple-700">You do need professional maturity, learning intent, and consistency.</span>
              </p>
            </div>
          </div>
        </section>

        {/* Why RecruiterV Is Built for Career Transition Recruiters */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-semibold text-center mb-8">
            Why RecruiterV Is Built for Career Transition Recruiters
          </h2>

          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Career transitions succeed when learning meets structure. RecruiterV provides both.
          </p>

          {/* Work on Real Hiring Roles */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-10 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Briefcase size={28} />
              <h3 className="text-xl font-semibold">Work on Real Hiring Roles (Not Simulations)</h3>
            </div>
            <p className="text-purple-100 mb-4">
              At RecruiterV, you learn recruitment by doing recruitment.
            </p>
            <p className="text-lg font-medium">
              You work on live client mandates, supported by a system designed to reduce confusion and accelerate learning.
            </p>
          </div>

          {/* Dedicated Client SPOC */}
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-10 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Users size={28} className="text-purple-600" />
              <h3 className="text-xl font-semibold">Dedicated Client SPOC for Every Position</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Every position you work on comes with a dedicated Client SPOC who partners with you throughout the hiring cycle.
            </p>

            <p className="text-gray-600 mb-4 font-medium">The Client SPOC:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Explains role context and expectations",
                "Assigns positions aligned with your background and strengths",
                "Reviews submissions and shares clear feedback",
                "Updates you on interview schedules and outcomes",
                "Guides you on candidate engagement and follow-ups",
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <p className="text-gray-700">
                This ensures you always know what to do, why you're doing it, and how to improve.
              </p>
            </div>
          </div>

          {/* Learn from Hiring Gurus */}
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-10 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <GraduationCap size={28} className="text-purple-600" />
              <h3 className="text-xl font-semibold">Learn from Hiring Gurus (Included)</h3>
            </div>

            <p className="text-gray-600 mb-4">
              All Career Transition Recruiters get free access to Hiring Gurus—experienced recruiters who help you build strong recruitment fundamentals.
            </p>

            <p className="text-gray-600 mb-4 font-medium">Hiring Gurus help you:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Understand end-to-end recruitment processes",
                "Learn modern sourcing tools and techniques",
                "Build effective candidate screening skills",
                "Improve candidate communication and engagement",
                "Identify outdated practices and adopt current ones",
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <CheckCircle size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <p className="text-purple-800 font-medium">
                This prevents trial-and-error learning and builds confidence faster.
              </p>
            </div>
          </div>

          {/* Expert Guidance */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-10">
            <div className="flex items-center gap-3 mb-6">
              <Award size={28} />
              <h3 className="text-xl font-semibold">Expert Guidance from Industry Professionals</h3>
            </div>

            <p className="text-purple-100 mb-6">
              RecruiterV also provides access to a seasoned Industry Expert Panel.
            </p>

            <p className="text-white mb-4 font-medium">Experts guide you on:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Understanding hiring manager expectations",
                "Identifying best-fit candidate profiles",
                "Evaluating resumes beyond keywords",
                "Avoiding common mistakes made by new recruiters",
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <CheckCircle size={18} className="text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-white/20 backdrop-blur-sm rounded-lg">
              <p className="text-white font-medium">
                This helps you think like a hiring consultant, not just a coordinator.
              </p>
            </div>
          </div>
        </section>

        {/* Start Small. Scale with Confidence. */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-10">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp size={28} className="text-purple-600" />
              <h3 className="text-2xl font-semibold">Start Small. Scale with Confidence.</h3>
            </div>

            <p className="text-gray-600 mb-6">
              RecruiterV allows Career Transition Recruiters to:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Start with limited roles",
                  desc: "Manageable positions to build confidence",
                },
                {
                  title: "Work alongside existing job",
                  desc: "Where feasible, maintain current employment",
                },
                {
                  title: "Increase responsibility",
                  desc: "As skills improve, take on more",
                },
                {
                  title: "Grow sustainably",
                  desc: "At a pace that works for you",
                },
              ].map((item, index) => (
                <div key={index} className="text-center p-6 bg-purple-50 rounded-xl">
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-700 font-medium">
                No pressure. No unrealistic targets. Just steady progress.
              </p>
            </div>
          </div>
        </section>

        {/* What Kind of Roles Will You Work On */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-b from-purple-50 to-white rounded-2xl border border-purple-200 p-10">
            <h2 className="text-2xl font-semibold text-center mb-6">
              What Kind of Roles Will You Work On?
            </h2>

            <p className="text-center text-gray-600 mb-8">
              Based on your background and learning stage, you may work on:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                "Entry to mid-level IT hiring",
                "Corporate and non-IT recruitment",
                "Domain-aligned roles where your prior experience adds value",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <Target size={20} className="text-purple-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-gray-600">
              All roles are active, transparent, and well-supported.
            </p>
          </div>
        </section>

        {/* What We Look For */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-10">
            <h2 className="text-2xl font-semibold text-center mb-8">
              What We Look For in Career Transition Recruiters
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Shield size={24} />,
                  title: "Solid corporate experience",
                  desc: "Professional background in any field",
                },
                {
                  icon: <Users size={24} />,
                  title: "Clear communication",
                  desc: "Professional and effective communicator",
                },
                {
                  icon: <BookOpen size={24} />,
                  title: "Learning mindset",
                  desc: "Open to feedback and structured learning",
                },
                {
                  icon: <TrendingUp size={24} />,
                  title: "Long-term vision",
                  desc: "Want to build recruitment as a career, not experiment",
                },
              ].map((item, index) => (
                <div key={index} className="text-center p-6 bg-purple-50 rounded-xl">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 mx-auto mb-4">
                    {item.icon}
                  </div>
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
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
                "Guaranteed income from day one",
                "Passive or low-effort freelance work",
                "Quick earnings without skill-building",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-lg">
                  <XCircle size={20} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Begin Your Career Transition */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-semibold mb-4">
              Begin Your Career Transition to Recruitment
            </h2>

            <p className="text-purple-100 mb-4 max-w-xl mx-auto">
              You don't need to quit your current role to start.
            </p>
            
            <p className="text-xl font-medium mb-8">
              You need the right platform to transition confidently.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-2xl mx-auto">
              <p className="text-lg font-semibold">
                RecruiterV — enabling Career Transition Recruiters to build recruitment careers with structure, support, and real-world exposure.
              </p>
            </div>

            <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-medium hover:bg-purple-50 transition flex items-center justify-center gap-2 mx-auto">
              <span>Start Your Transition</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </section>

      </div>
      <Footer />
    </>
  );
};

export default MainCareerSwitch;

