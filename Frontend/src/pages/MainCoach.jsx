import React, { useState } from "react";
import Header from './Header';
import Footer from './Footer';
import { CheckCircle, ArrowRight, ChevronDown, ChevronUp, Users, Award, Clock, TrendingUp, Star, Zap, Target, Shield, DollarSign } from "lucide-react";

const MainCoach = () => {
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);

  const toggleFAQ = (index) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

  const faqs = [
    { question: "Is a Hiring Guru a recruiter or consultant?", answer: "No. A Hiring Guru is a Hiring Coach / Recruitment Coach, not an execution resource." },
    { question: "Can I decline recruiter requests?", answer: "Yes. You have full control over which requests you accept." },
    { question: "How much time commitment is expected?", answer: "Engagements are selective, role-specific, and non-operational. On average you may invest 4-5hrs a week." },
    { question: "Who can reach out to me on the platform?", answer: "Only recruiters working on roles aligned with your experience and tagging." },
    { question: "Is this suitable for CXOs and senior leaders?", answer: "Yes. The model is designed for leaders who want impact without operational load." }
  ];

  const responsibilities = [
    {
      id: 1,
      icon: <Target size={36} />,
      title: "Role Clarity & Calibration",
      color: "orange",
      points: ["Interpreting and refining job requirements", "Defining must-have vs good-to-have skills", "Setting clear rejection criteria", "Aligning recruiters on success metrics"]
    },
    {
      id: 2,
      icon: <Users size={36} />,
      title: "Recruiter Enablement",
      color: "blue",
      points: ["Search and sourcing logic", "Resume screening frameworks", "Interview focus areas", "Red flags and deal-breakers"]
    },
    {
      id: 3,
      icon: <Shield size={36} />,
      title: "Hiring Quality Governance",
      color: "green",
      points: ["Reviewing shortlists for role alignment", "Course-correcting quality deviations", "Ensuring shared hiring standards"]
    }
  ];

  const stats = [
    { value: "10-25+", label: "Years Experience" },
    { value: "100+", label: "Interviews Conducted" },
    { value: "5", label: "Max Recruiters" },
    { value: "10%", label: "Revenue Share" }
  ];

  const benefits = [
    { icon: <Clock size={28} />, title: "Flexible Schedule", desc: "Work 4-5 hrs weekly", color: "blue" },
    { icon: <DollarSign size={28} />, title: "10% Revenue", desc: "Earn on placements", color: "green" },
    { icon: <TrendingUp size={28} />, title: "Scale Impact", desc: "Guide multiple recruiters", color: "purple" },
    { icon: <Award size={28} />, title: "Premium Network", desc: "Elite professionals", color: "orange" }
  ];

  const backgrounds = [
    "Senior Recruiters / Recruitment Managers",
    "Ex-Talent Acquisition Heads",
    "Ex-Hiring Managers with strong hiring exposure",
    "Consultants known for hiring quality"
  ];

  const valueProps = {
    companies: [
      { icon: "✓", text: "Clear hiring expectations" },
      { icon: "✓", text: "Fewer interviews, better decisions" },
      { icon: "✓", text: "Reduced hiring risk" }
    ],
    recruiters: [
      { icon: "✓", text: "Better role clarity" },
      { icon: "✓", text: "Higher closure probability" },
      { icon: "✓", text: "Less wasted effort" }
    ]
  };

  const colorMap = {
    orange: { light: "bg-orange-50", dark: "bg-orange-500", text: "text-orange-600", border: "border-orange-200" },
    blue: { light: "bg-blue-50", dark: "bg-blue-500", text: "text-blue-600", border: "border-blue-200" },
    green: { light: "bg-green-50", dark: "bg-green-500", text: "text-green-600", border: "border-green-200" },
    purple: { light: "bg-purple-50", dark: "bg-purple-500", text: "text-purple-600", border: "border-purple-200" }
  };

  return (
    <>
      <Header />
      <div className="bg-gradient-to-b from-orange-50 via-white to-orange-50 text-gray-800 overflow-x-hidden">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 py-20 text-center relative">
          <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl"></div>
          <div className="absolute top-20 right-20 w-40 h-40 bg-blue-200/30 rounded-full blur-3xl"></div>
          
          <span className="relative inline-block mb-6 px-6 py-2 text-sm font-semibold text-orange-700 bg-orange-100 rounded-full animate-pulse shadow-lg">
            Hiring Guru Program
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 mb-6">
            Join RecruiterV as a <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">Hiring Guru</span>
            <br />Premium Network of Hiring Coaches
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
            RecruiterV's Hiring Guru program is a curated network of senior hiring professionals who bring depth, judgment, and clarity to complex hiring decisions.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <button className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2">
              <Zap size={20} className="group-hover:animate-pulse" />
              <span>Register as Hiring Guru</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="group border-2 border-orange-300 text-orange-700 px-8 py-4 rounded-xl font-semibold hover:bg-orange-50 transition-all flex items-center gap-2">
              <span>Learn More</span>
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-600">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {benefits.map((benefit, index) => {
              const colorClasses = {
                blue: "bg-blue-100 text-blue-600",
                green: "bg-green-100 text-green-600",
                purple: "bg-purple-100 text-purple-600",
                orange: "bg-orange-100 text-orange-600"
              };
              return (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`bg-white rounded-2xl shadow-sm border border-orange-100 p-6 text-center transition-all duration-300 cursor-pointer ${
                    hoveredCard === index ? 'transform -translate-y-2 shadow-xl border-orange-300' : ''
                  }`}
                >
                  <div className={`w-14 h-14 mx-auto rounded-2xl ${colorClasses[benefit.color]} flex items-center justify-center mb-4`}>
                    {benefit.icon}
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1">{benefit.title}</h3>
                  <p className="text-sm text-gray-500">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Who Is a Hiring Guru */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white rounded-3xl shadow-lg border border-orange-100 p-8 md:p-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Who Is a Hiring Guru?</h2>
            
            <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-10">
              A Hiring Guru is a senior hiring specialist responsible for ensuring hiring excellence through guidance, not execution.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
              {[
                { icon: "🎯", title: "Clear Understanding", desc: "Define what success looks like" },
                { icon: "🤝", title: "Strong Alignment", desc: "Guide and support teams" },
                { icon: "⭐", title: "Quality Focus", desc: "Maintain high standards" }
              ].map((item, index) => (
                <div
                  key={index}
                  className="text-center p-6 bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-200 hover:shadow-lg transition-all cursor-pointer transform hover:scale-105"
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h4 className="font-bold text-gray-800 mb-2">{item.title}</h4>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 text-center max-w-2xl mx-auto">
              <p className="text-lg text-gray-700 italic">
                "Think of the Hiring Guru as the <span className="font-semibold text-orange-600">quality anchor</span> in the hiring process."
              </p>
            </div>
          </div>
        </section>

        {/* Core Responsibilities - Interactive Tabs */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Core Responsibilities</h2>

          {/* Tab Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {responsibilities.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(index)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === index
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-600 hover:bg-orange-50 border border-orange-200'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {responsibilities.map((item, index) => {
            if (activeTab !== index) return null;
            const colors = colorMap[item.color];

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl shadow-xl border border-orange-100 p-8 md:p-10 animate-fade-in"
              >
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className={`w-20 h-20 rounded-2xl ${colors.light} ${colors.text} flex items-center justify-center flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">{item.title}</h3>
                    <p className="text-gray-600 mb-6">Hiring Gurus help maintain consistency and quality by:</p>
                    <ul className="space-y-3">
                      {item.points.map((point, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle className={`${colors.text} flex-shrink-0 mt-0.5`} size={20} />
                          <span className="text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Eligibility */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-center mb-8">Eligibility Criteria (Mandatory)</h2>
              <p className="text-orange-100 text-center max-w-2xl mx-auto mb-10">
                RecruiterV maintains a high-trust, high-credibility network. You are eligible if you have:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {[
                  "10-25+ years in recruitment or hiring leadership",
                  "Proven track record of closing roles consistently",
                  "Conducted or oversaw 100+ interviews",
                  "Strong understanding of hiring trade-offs"
                ].map((criteria, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-white text-orange-600 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{criteria}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Preferred Backgrounds */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white rounded-3xl shadow-lg border border-orange-100 p-8 md:p-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Preferred Backgrounds</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {backgrounds.map((bg, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 bg-gradient-to-r from-orange-50 to-white p-5 rounded-2xl border border-orange-200 hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 text-white flex items-center justify-center">
                    <Award size={24} />
                  </div>
                  <span className="font-semibold text-gray-700">{bg}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Commercial Model */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-br from-green-50 to-white rounded-3xl shadow-xl border border-green-200 p-8 md:p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-500 text-white flex items-center justify-center shadow-lg">
                <DollarSign size={48} />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold mb-6 text-green-800">Commercial Model</h2>
            <p className="text-4xl md:text-5xl font-bold text-green-600 mb-4">
              10% Revenue Share
            </p>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-6">
              Hiring Gurus earn 10% of the revenue earned by Changeleaders for a successfully closed position
            </p>
            
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-6 py-3 rounded-full font-medium">
              <Clock size={20} />
              <span>Payment within 7 days after 90-day candidate retention</span>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Value Proposition</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-3xl shadow-lg border border-blue-200 p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 text-white flex items-center justify-center">
                  <TrendingUp size={28} />
                </div>
                <h3 className="text-2xl font-bold text-blue-800">For Companies</h3>
              </div>
              <div className="space-y-4">
                {valueProps.companies.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                      {item.icon}
                    </div>
                    <span className="text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white rounded-3xl shadow-lg border border-green-200 p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-green-500 text-white flex items-center justify-center">
                  <Users size={28} />
                </div>
                <h3 className="text-2xl font-bold text-green-800">For Recruiters</h3>
              </div>
              <div className="space-y-4">
                {valueProps.recruiters.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                      {item.icon}
                    </div>
                    <span className="text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-white rounded-3xl shadow-lg border border-orange-100 p-8 md:p-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Frequently Asked Questions</h2>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-orange-200 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between bg-gradient-to-r from-orange-50 to-white hover:from-orange-100 hover:to-orange-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-800 pr-4">{faq.question}</span>
                    {activeFAQ === index ? (
                      <ChevronUp className="text-orange-500 flex-shrink-0" size={24} />
                    ) : (
                      <ChevronDown className="text-orange-500 flex-shrink-0" size={24} />
                    )}
                  </button>
                  {activeFAQ === index && (
                    <div className="px-6 py-5 bg-white border-t border-orange-100">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Get Started CTA */}
        <section className="max-w-4xl mx-auto px-6 py-20 pb-24">
          <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 text-white rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Started Today</h2>
              <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
                If you bring 10+ years of hiring expertise and want to shape hiring quality at scale, register as a Hiring Guru on RecruiterV.
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {["Guide hiring", "Coach recruiters", "Govern outcomes"].map((item, index) => (
                  <span key={index} className="px-5 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                    {item}
                  </span>
                ))}
              </div>

              <button className="group bg-white text-orange-600 px-10 py-4 rounded-xl font-bold hover:bg-orange-50 transition-all transform hover:scale-105 shadow-2xl flex items-center gap-3 mx-auto">
                <Zap size={24} className="group-hover:animate-pulse" />
                <span>Register as Hiring Guru</span>
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>

      </div>
      <Footer />
    </>
  );
};

export default MainCoach;

