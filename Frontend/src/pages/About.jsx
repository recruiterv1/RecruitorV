import React from 'react';
import { TrendingUp, Target, Users, Award, Zap, Shield, Globe, Briefcase, Brain, CheckCircle, ArrowRight, BarChart3, Sparkles } from 'lucide-react';

const About = () => {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-orange-500 py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <Sparkles size={20} className="text-white" />
              <span className="text-white font-semibold text-sm">Performance-Led Recruitment Ecosystem</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              RecruiterV: Transforming Freelance<br className="hidden sm:block" /> Recruitment Through Performance
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              A structured ecosystem designed to enable independent recruiters and organizations to collaborate with clarity, support, and sustained performance.
            </p>
          </div>
        </div>
      </section>

      {/* Executive Summary */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-orange-50 p-6 sm:p-8 border-b-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-orange-500 rounded-xl">
                  <Target size={28} className="text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Executive Summary</h2>
              </div>
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                RecruiterV is a structured freelance recruitment ecosystem designed to transform how independent recruiters and organizations collaborate.
              </p>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-gray-700 leading-relaxed mb-6">
                Unlike traditional recruitment platforms that equate <span className="font-semibold text-blue-600">access with job visibility</span>, RecruiterV is built on the understanding that true access arises from <span className="font-semibold text-orange-600">structured guidance, behavioral support, and performance enablement</span> — not merely posting jobs.
              </p>
              <p className="text-gray-700 leading-relaxed">
                In an era where the gig economy is reshaping workforce dynamics globally and in India, RecruiterV addresses the structural and behavioral gaps that hinder consistent recruiter performance and high-quality hiring outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Market Statistics */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-600 to-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Market Context & Opportunity</h2>
            <p className="text-blue-100 text-lg max-w-3xl mx-auto">
              The global gig economy and HR tech landscape present unprecedented opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
              <Globe size={40} className="text-white mb-4" />
              <div className="text-4xl font-bold text-white mb-2">$582.2B</div>
              <div className="text-blue-100 text-sm">Global Gig Economy Value</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
              <Users size={40} className="text-white mb-4" />
              <div className="text-4xl font-bold text-white mb-2">38%</div>
              <div className="text-blue-100 text-sm">U.S. Freelance Workforce</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
              <TrendingUp size={40} className="text-white mb-4" />
              <div className="text-4xl font-bold text-white mb-2">23.5M</div>
              <div className="text-blue-100 text-sm">India's Gig Workers by 2030</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
              <BarChart3 size={40} className="text-white mb-4" />
              <div className="text-4xl font-bold text-white mb-2">$77.6B</div>
              <div className="text-blue-100 text-sm">HR Tech Market by 2035</div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">17%</div>
              <p className="text-gray-700 text-sm">YoY growth in white-collar gig jobs in India</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-2xl font-bold text-orange-600 mb-2">38%</div>
              <p className="text-gray-700 text-sm">Surge in freelance consulting demand (FY25)</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">9.6%</div>
              <p className="text-gray-700 text-sm">CAGR of global HR tech market (2025-2035)</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Core Problem */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">The Core Problem</h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Traditional freelance recruitment models overlook fundamental behavioral and structural issues
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
              <h3 className="text-xl font-bold text-gray-900 mb-3">❌ Traditional Assumption</h3>
              <p className="text-gray-700 mb-4">Job visibility equals opportunity</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-gray-600 text-sm">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Recruiters interpret job mandates differently without clarity</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600 text-sm">
                  <span className="text-red-500 mt-1">•</span>
                  <span>First rejections erode confidence, causing disengagement</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600 text-sm">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Domain nuances misunderstood without specialist input</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600 text-sm">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Weak or delayed feedback loops suppress improvement</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl p-6 shadow-lg border-l-4 border-green-500">
              <h3 className="text-xl font-bold text-gray-900 mb-3">✅ RecruiterV Reality</h3>
              <p className="text-gray-700 mb-4 font-semibold">True access = Structured enablement</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-gray-700 text-sm">
                  <CheckCircle size={16} className="text-green-600 mt-1 flex-shrink-0" />
                  <span>Enabling recruiters to begin correctly</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 text-sm">
                  <CheckCircle size={16} className="text-green-600 mt-1 flex-shrink-0" />
                  <span>Continue with ongoing support and guidance</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 text-sm">
                  <CheckCircle size={16} className="text-green-600 mt-1 flex-shrink-0" />
                  <span>Recover from setbacks through coaching</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 text-sm">
                  <CheckCircle size={16} className="text-green-600 mt-1 flex-shrink-0" />
                  <span>Form a cycle of sustained performance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-blue-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-orange-100 rounded-full mb-4">
              <Brain size={20} className="text-blue-600" />
              <span className="text-gray-900 font-semibold text-sm">Our Core Philosophy</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Drives Sustainable Access
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Target size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Quality Over Volume</h3>
              <p className="text-gray-600 text-sm">
                Recruitment is fundamentally a quality decision problem. Accurate selection decisions matter more than sourcing volume alone.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                <Zap size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Behavior-Aware Systems</h3>
              <p className="text-gray-600 text-sm">
                Performance emerges from behavior-aware systems. Human workflows must be enabled, not assumed.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Rejection as Growth</h3>
              <p className="text-gray-600 text-sm">
                Rejection is part of growth, not a failure trigger. The system supports recovery and learning.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Users size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Coaching as Infrastructure</h3>
              <p className="text-gray-600 text-sm">
                Coaching is core infrastructure, not an 'add-on' feature — it is critical to driving outcomes.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Shield size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Governed Quality</h3>
              <p className="text-gray-600 text-sm">
                Scalability depends on governed quality. Unlimited user volume without proportional support erodes trust.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl p-6 shadow-lg border-2 border-blue-200">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Sparkles size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Differentiation</h3>
              <p className="text-gray-700 text-sm font-medium">
                This philosophy underpins RecruiterV's differentiated approach to freelance recruitment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The RecruiterV Model */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">The RecruiterV Model</h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Three distinct roles working together in a structured process
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Freelance Recruiters */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                <Briefcase size={40} className="text-white mb-3" />
                <h3 className="text-2xl font-bold text-white">Freelance Recruiters</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">Recruiters focus on:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle size={14} className="text-blue-600" />
                    </div>
                    <span className="text-gray-700">Candidate sourcing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle size={14} className="text-blue-600" />
                    </div>
                    <span className="text-gray-700">Screening with accuracy</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle size={14} className="text-blue-600" />
                    </div>
                    <span className="text-gray-700">Submission quality</span>
                  </li>
                </ul>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-blue-700">RecruiterV frees recruiters</span> from client acquisition and administrative overhead, enabling focus on core strength: matching the right talent to the right opportunity.
                  </p>
                </div>
              </div>
            </div>

            {/* Recruitment Coaches */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-300 overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
                <Award size={40} className="text-white mb-3" />
                <h3 className="text-2xl font-bold text-white">Recruitment Coaches</h3>
                <p className="text-orange-100 text-sm mt-2">Core System Component</p>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4 font-semibold">Critical operational enablers who:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle size={14} className="text-orange-600" />
                    </div>
                    <span className="text-gray-700">Clarify role mandates upfront</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle size={14} className="text-orange-600" />
                    </div>
                    <span className="text-gray-700">Interpret rejection feedback</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle size={14} className="text-orange-600" />
                    </div>
                    <span className="text-gray-700">Elevate screening accuracy</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle size={14} className="text-orange-600" />
                    </div>
                    <span className="text-gray-700">Restore confidence after setbacks</span>
                  </li>
                </ul>
                {/* <div className="mt-6 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                  <p className="text-sm text-gray-900 font-bold">
                    Without coaching, access collapses into noise.
                  </p>
                </div> */}
              </div>
            </div>

            {/* Domain Experts */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
                <Brain size={40} className="text-white mb-3" />
                <h3 className="text-2xl font-bold text-white">Domain Experts</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">Domain Experts complement Coaches by:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle size={14} className="text-green-600" />
                    </div>
                    <span className="text-gray-700">Providing role and industry context</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle size={14} className="text-green-600" />
                    </div>
                    <span className="text-gray-700">Helping understand what roles truly demand</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle size={14} className="text-green-600" />
                    </div>
                    <span className="text-gray-700">Beyond job descriptions</span>
                  </li>
                </ul>
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-green-700">Significantly improves</span> shortlist quality and reduces mismatch rates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
       {/* <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-600 to-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Value Proposition</h2>
            <p className="text-blue-100 text-lg">Benefits for all stakeholders in the ecosystem</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Users size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Recruiters</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <ArrowRight size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Outcome-linked earnings, not activity-based metrics</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Clarity in role ownership and expectations</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Feedback-driven skill development</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Structured support that reduces rejection pressure</span>
                </li>
              </ul>
            </div>

            
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Briefcase size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For HR Leaders</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <ArrowRight size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Higher quality candidate shortlists with contextual accuracy</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Predictable recruiter performance backed by structured process</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Reduced recruitment cycle time</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Access to performance ecosystem vs anonymous marketplaces</span>
                </li>
              </ul>
            </div>

            
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Investors</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <ArrowRight size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Differentiated platform targeting high-growth niche</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">System design built around behavior and performance</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Alignment with global workforce shifts</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Toward flexible talent models</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>  */}

      {/* Corporate Lineage */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-orange-50 p-6 sm:p-8 border-b-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-orange-500 rounded-xl">
                  <Globe size={28} className="text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Corporate Lineage</h2>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Changeleaders Tech LLP</h3>
                    <p className="text-gray-700">
                      RecruiterV is a product of <span className="font-semibold text-blue-600">Changeleaders Tech LLP</span>, a technology-oriented entity focused on building scalable platforms in HR and talent acquisition.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award size={24} className="text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Changeleaders Consulting</h3>
                    <p className="text-gray-700">
                      Changeleaders Tech LLP is an invested company of <span className="font-semibold text-orange-600">Changeleaders Consulting Private Limited</span>, a recruitment and HR services firm with deep enterprise experience across multiple industries.
                    </p>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl border-2 border-blue-200">
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">This combination ensures:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Operational credibility from seasoned recruitment practitioners</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Innovation and scalability driven by platform-first thinking</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-900 to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <Target size={20} className="text-white" />
            <span className="text-white font-semibold text-sm">Vision & Strategic Direction</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight">
            The Most Reliable and Performance-Oriented<br className="hidden sm:block" /> Recruitment Ecosystem
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 max-w-4xl mx-auto leading-relaxed mb-8">
            RecruiterV's objective is not to be the largest recruitment platform, but the most reliable and performance-oriented ecosystem for freelance recruiters and hiring organizations.
          </p>
          <div className="max-w-3xl mx-auto">
            <p className="text-blue-200 leading-relaxed">
              By anchoring its design in <span className="font-semibold text-white">behavioral insights</span>, <span className="font-semibold text-white">outcome-driven workflows</span>, and <span className="font-semibold text-white">structured support</span>, RecruiterV is positioned to become a long-term infrastructure for freelance talent orchestration — especially in HR functions that increasingly value flexibility, precision, and quality.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;
