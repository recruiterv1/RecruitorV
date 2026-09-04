import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Clock,
  Target,
  Award,
  Users,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Phone,
  Calendar,
  TrendingUp,
  Sparkles,
  Shield,
  Star,
  Play,
  Mail
} from "lucide-react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import Header from "./Header";
import Footer from "./Footer";

const AnimatedSection = ({ children, className = "", delay = 0 }) => {
  const { ref, isVisible, hasAnimated } = useScrollAnimation(0.1);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-1000 ${
        hasAnimated
          ? isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-50 translate-y-10"
          : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, gradient, delay }) => {
  const { ref, isVisible, hasAnimated } = useScrollAnimation(0.2);

  return (
    <div
      ref={ref}
      className={`group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 transition-all duration-500 transform hover:-translate-y-2 ${
        hasAnimated
          ? isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
          : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

const StepCard = ({ number, title, description, icon: Icon, gradient, delay }) => {
  const { ref, isVisible, hasAnimated } = useScrollAnimation(0.2);

  return (
    <div
      ref={ref}
      className={`relative bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transition-all duration-500 ${
        hasAnimated
          ? isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
          : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
        {number}
      </div>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 mt-2`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { ref, isVisible, hasAnimated } = useScrollAnimation(0.1);

  return (
    <div
      ref={ref}
      className={`bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 ${
        isOpen ? "shadow-lg" : ""
      } ${hasAnimated && isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-800 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-4 text-gray-600 leading-relaxed">{answer}</div>
      </div>
    </div>
  );
};

const SkillBadge = ({ skill, icon: Icon }) => (
  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 rounded-full border border-blue-200">
    <Icon className="w-4 h-4 text-blue-600" />
    <span className="text-sm font-medium text-gray-700">{skill}</span>
  </div>
);

const MainFresher = () => {
  const faqs = [
    {
      question: "Q1. Is this an internship?",
      answer: "No. This is a Freelance Recruiter role with real hiring responsibilities. You work on actual client requirements and earn based on performance."
    },
    {
      question: "Q2. Do I need prior recruitment experience?",
      answer: "No. Guidance and support are provided for beginners. Our Hiring Gurus and Expert Panel will help you learn recruitment from scratch."
    },
    {
      question: "Q3. Is the work paid?",
      answer: "This is a performance-linked freelance role. Experience and certification are earned through successful closures. You earn incentives when you successfully close a position."
    },
    {
      question: "Q4. What if I don't close a position immediately?",
      answer: "Learning continues. The journey is about building skills. Certificates are issued only on successful closure, so keep learning and applying the guidance."
    },
    {
      question: "Q5. Can I request guidance for every role?",
      answer: "Yes. You can raise guidance requests for any assigned position. Our experts are here to support your learning journey."
    },
    {
      question: "Q6. How many hours do I need to work daily?",
      answer: "A minimum of 4 focused hours daily is recommended to get results and learn effectively. Consistency is key in recruitment."
    },
    {
      question: "Q7. Will experts always accept my guidance request?",
      answer: "Approval depends on skill match and expert availability. Requests are matched based on the position requirements and expert specialization."
    }
  ];

  const eligibilityItems = [
    { icon: GraduationCap, text: "A college student or recent graduate" },
    { icon: Target, text: "Interested in building a career in Recruitment / Talent Acquisition" },
    { icon: Users, text: "Comfortable working independently" },
    { icon: Clock, text: "Ready to spend minimum 4 focused hours daily" }
  ];

  const whatYouGet = [
    {
      icon: Calendar,
      title: "Live Hiring Positions (Real Hiring Work)",
      desc: "Once registered and approved, freshers receive up to 4 active positions every month. These are live client hiring requirements. You work on real roles, real candidates, and real interviews.",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: Award,
      title: "Experience Certificate on Successful Closure",
      desc: "If you close even one position, you receive a Recruitment Experience Certificate. The certificate is based on actual hiring closure, not participation.",
      gradient: "from-orange-500 to-orange-600"
    },
    {
      icon: Lightbulb,
      title: "Structured Guidance From Experts",
      desc: "Freshers are supported by Hiring Gurus (experienced recruitment professionals) and Expert Panel members (domain experts) who share interview and industry insights.",
      gradient: "from-purple-500 to-purple-600"
    }
  ];

  const guidanceSteps = [
    {
      step: "1",
      icon: Mail,
      title: "Raise a Guidance Request",
      desc: "After registration, freshers can raise a guidance request for any assigned position. Select the specific position and choose between Hiring Guru or Expert Panel."
    },
    {
      step: "2",
      icon: Users,
      title: "Matching & Request Visibility",
      desc: "The request appears as 'Pending' on expert dashboards. Experts see position details, required skills, and help needed. Matching is based on skill alignment."
    },
    {
      step: "3",
      icon: Phone,
      title: "Approval & Contact Access",
      desc: "Once approved, you can view the expert's name and contact number. Only after approval can direct communication begin for focused guidance."
    }
  ];

  const bestPractices = [
    { icon: BookOpen, text: "Understand the role fully before sourcing" },
    { icon: Target, text: "Focus on 1–2 roles at a time" },
    { icon: TrendingUp, text: "Speak clearly and honestly with candidates" },
    { icon: Star, text: "Apply feedback immediately" },
    { icon: Sparkles, text: "Learn from every rejection" }
  ];

  const skillsYouLearn = [
    { icon: BookOpen, skill: "Role Understanding" },
    { icon: Users, skill: "Candidate Screening" },
    { icon: Calendar, skill: "Interview Coordination" },
    { icon: Award, skill: "Offer Closure Process" },
    { icon: TrendingUp, skill: "Recruiter Communication" },
    { icon: Target, skill: "Recruiter Judgment" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-orange-500/5 pointer-events-none"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>

        <div className="max-w-6xl mx-auto px-6 py-20 relative">
          <AnimatedSection className="text-center" delay={0}>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <GraduationCap size={18} />
              <span>🎓 For Freshers & College Pass-outs</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 leading-tight mb-6">
              Fresher Freelance Recruiter Role{" "}
              <span className="text-blue-600">on RecruiterV</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
              Recruitment is one of the few professions where freshers can start early, learn on real work, and grow through performance rather than years of experience.
            </p>

            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-10">
              RecruiterV enables freshers and college pass-outs to start their journey as Freelance Recruiters, working on real hiring requirements with expert guidance and flexible working hours.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/join"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <span>Start Your Journey</span>
                <ArrowRight size={20} />
              </Link>
              <Link
                to="/log_rec"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 border-2 border-blue-200 px-8 py-4 rounded-full font-semibold hover:bg-blue-50 transition-all"
              >
                <span>Sign In</span>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Who Can Join */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-12" delay={0}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Who Can Join as Fresher Freelance Recruiter?
            </h2>
            <p className="text-gray-600">This role is suitable if you are:</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {eligibilityItems.map((item, index) => (
              <AnimatedSection key={index} delay={index * 100}>
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <p className="text-gray-700 font-medium">{item.text}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* What Freshers Get */}
      <section className="py-16 px-6 bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-12" delay={0}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              What Freshers Get on RecruiterV
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {whatYouGet.map((item, index) => (
              <FeatureCard
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.desc}
                gradient={item.gradient}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Time Commitment */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 md:p-12 shadow-2xl text-white">
            <AnimatedSection className="text-center mb-8" delay={0}>
              <Clock className="w-16 h-16 mx-auto mb-6 text-blue-200" />
              <h2 className="text-3xl font-bold mb-4">Time Commitment & Work Expectations</h2>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
                <p className="text-blue-100 text-lg leading-relaxed mb-4">
                  To get results and learn effectively, freshers are expected to:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Work minimum 4 hours daily</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Be consistent across working days</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Actively apply guidance received from experts</span>
                  </li>
                </ul>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-orange-500/20 px-4 py-2 rounded-full">
                  <TrendingUp className="w-5 h-5 text-orange-300" />
                  <span className="text-orange-100 font-medium">
                    Recruitment rewards discipline and focus
                  </span>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How Guidance System Works */}
      <section className="py-16 px-6 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-12" delay={0}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              How the Guidance System Works
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              RecruiterV follows a request-based guidance model to ensure the right expert supports the right role.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {guidanceSteps.map((step, index) => (
              <StepCard
                key={index}
                number={step.step}
                icon={step.icon}
                title={step.title}
                description={step.desc}
                gradient={index === 0 ? "from-blue-500 to-blue-600" : index === 1 ? "from-orange-500 to-orange-600" : "from-green-500 to-green-600"}
                delay={index * 150}
              />
            ))}
          </div>

          <AnimatedSection className="mt-8 text-center" delay={500}>
            <p className="text-gray-600 text-sm">
              This system ensures focused guidance, protects expert time, and avoids random or mismatched support.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Expert Usage Guide */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-12" delay={0}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              How to Work With Experts Effectively
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Hiring Gurus */}
            <AnimatedSection delay={0}>
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 text-white">
                <Users className="w-12 h-12 mb-4 text-blue-200" />
                <h3 className="text-2xl font-bold mb-4">Hiring Gurus</h3>
                <p className="text-blue-100 mb-6">Best used before sourcing candidates for:</p>
                <ul className="space-y-3">
                  {[
                    "Understanding what a good hire looks like",
                    "Identifying must-have vs good-to-have skills",
                    "Knowing common rejection reasons",
                    "Learning acceptable trade-offs"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Play className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-blue-400/30">
                  <span className="inline-flex items-center gap-2 bg-blue-400/30 px-3 py-1 rounded-full text-sm">
                    👉 Best used before sourcing candidates
                  </span>
                </div>
              </div>
            </AnimatedSection>

            {/* Expert Panel */}
            <AnimatedSection delay={200}>
              <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-8 text-white">
                <Lightbulb className="w-12 h-12 mb-4 text-orange-200" />
                <h3 className="text-2xl font-bold mb-4">Expert Panel</h3>
                <p className="text-orange-100 mb-6">Best used during screening and interview preparation for:</p>
                <ul className="space-y-3">
                  {[
                    "Interview expectations",
                    "Industry-specific skills",
                    "Candidate readiness checks",
                    "Understanding interview failures"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Play className="w-5 h-5 text-orange-300 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-orange-400/30">
                  <span className="inline-flex items-center gap-2 bg-orange-400/30 px-3 py-1 rounded-full text-sm">
                    👉 Best used during screening & interview prep
                  </span>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="py-16 px-6 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-12" delay={0}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Best Practices to Close Positions Faster
            </h2>
            <p className="text-gray-600">Consistency and learning mindset matter more than speed.</p>
          </AnimatedSection>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bestPractices.map((practice, index) => (
                <AnimatedSection key={index} delay={index * 50}>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <practice.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-gray-700">{practice.text}</span>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-12" delay={0}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              What Freshers Learn as Freelance Recruiters
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              By working on RecruiterV, freshers gain hands-on experience that prepares them for successful careers.
            </p>
          </AnimatedSection>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 md:p-12 shadow-2xl text-white">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {skillsYouLearn.map((skill, index) => (
                <AnimatedSection key={index} delay={index * 50}>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl">
                    <skill.icon className="w-5 h-5 text-blue-300" />
                    <span className="font-medium">{skill.skill}</span>
                  </div>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection delay={400}>
              <div className="border-t border-white/20 pt-8">
                <h3 className="text-xl font-bold mb-4">This prepares them for:</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-blue-300" />
                    <p className="font-medium">Corporate recruitment roles</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-300" />
                    <p className="font-medium">Long-term freelancing</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <Star className="w-8 h-8 mx-auto mb-2 text-blue-300" />
                    <p className="font-medium">HR & Talent Acquisition careers</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-12" delay={0}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              FAQs – Fresher Freelance Recruiter Role
            </h2>
          </AnimatedSection>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-8" delay={0}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              RecruiterV LaunchPad
            </h2>
            <p className="text-blue-100">Your launchpad into the recruitment industry</p>
          </AnimatedSection>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center">
              <p className="text-5xl font-bold text-white mb-2">
                ₹999<span className="text-xl font-medium text-blue-200">/month</span>
              </p>
              <p className="text-blue-100">One-time registration fee with monthly access</p>
            </div>
            
            <div className="p-8">
              <ul className="space-y-4 mb-8">
                {[
                  "Access to live hiring positions",
                  "Up to 4 active positions per month",
                  "Guidance from Hiring Gurus & Experts",
                  "Experience Certificate on closure",
                  "Flexible working hours",
                  "Dedicated support"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                to="/join"
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-full font-bold hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <span>Get Started Now</span>
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl p-8 md:p-12 text-white text-center relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10">
              <GraduationCap className="w-16 h-16 mx-auto mb-6 text-blue-300" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Your Recruitment Journey?
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                Join RecruiterV today and get access to real hiring work, expert guidance, and certification opportunities.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/join"
                  className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-full font-bold hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <span>Register Now</span>
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/recruiter"
                  className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/50 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all"
                >
                  <span>Learn More</span>
                </Link>
              </div>

              <p className="mt-8 text-gray-400 text-sm">
                No prior experience required • Expert guidance provided • Flexible working hours
              </p>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>

      <Footer />
    </div>
  );
};

export default MainFresher;

