import React, { useState } from "react";
import { ChevronDown, HelpCircle, Search } from "lucide-react";

const Faqs = () => {
  const [openIndex, setOpenIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      category: "Freelance Recruiter",
      questions: [
        {
          question: "What will I do as a Freelance Recruiter?",
          answer: "As a Freelance Recruiter, you will manage the complete candidate lifecycle for the positions you choose to work on. Your responsibilities include: selecting positions, understanding job descriptions thoroughly, taking guidance from a Recruitment Coach when needed, sourcing relevant candidates, conducting proper candidate assessments, checking candidate duplicacy, maintaining client-wise and recruiter-wise trackers, updating the SaaS platform regularly, coordinating interviews, documentation, and joining, keeping candidates informed, and ensuring a smooth and professional candidate experience. Your focus is quality execution, not client acquisition."
        },
        {
          question: "Do I need to bring my own clients?",
          answer: "No. All clients and live mandates are provided by Changeleaders."
        },
        {
          question: "How do I earn as a Freelance Recruiter?",
          answer: "You earn 30%–50% of the revenue received by Changeleaders for each successful joining. The exact share depends on performance-based slabs. Payouts are made 30–90 days after the candidate joins, aligned with the client payment cycle."
        },
        {
          question: "Is this suitable for beginners?",
          answer: "Yes. This opportunity is open to: freshers starting in recruitment, experienced recruiters, professionals restarting their careers, individuals seeking a side hustle, and tenured freelance recruiters looking for structure. Performance determines growth and earnings."
        },
        {
          question: "Will I interact with clients directly?",
          answer: "No. All client communication and coordination are handled by Changeleaders."
        },
        {
          question: "Is there an access fee for recruiters?",
          answer: "Yes. Recruiters pay a subscription-based access fee to use the platform, tools, dashboards, and job portals. This fee is non-refundable."
        },
        {
          question: "What happens to my candidates if I do not renew my access?",
          answer: "Candidates submitted by you remain mapped to you for 3 months from the date of submission. If any of your submitted or pipeline candidates join during this period, you will receive your payout, even if your access is not renewed."
        },
        {
          question: "Will I be able to view my candidate status if I do not renew my access?",
          answer: "No. Without an active subscription, you will not be able to view candidate status or tracking details on the platform."
        },
        {
          question: "What if my candidate is submitted by another recruiter for a different position?",
          answer: "If a candidate originally sourced by you is submitted by another recruiter for any other position and joins, you will receive 5% of the revenue received by Changeleaders for that joining."
        }
      ]
    },
    {
      category: "Freelance Recruitment Coach",
      questions: [
        {
          question: "What is my role as a Recruitment Coach?",
          answer: "As a Recruitment Coach, you support recruiters in improving hiring outcomes. You do not source candidates. Your responsibilities include: helping recruiters understand job requirements and expectations, defining sourcing and screening strategies, analyzing CV rejections and interview feedback, and guiding recruiters to improve closures and candidate handling."
        },
        {
          question: "How do I earn as a Recruitment Coach?",
          answer: "You earn 10% of the revenue received by Changeleaders for every successful joining you enable. Access fee: ₹2,999 per month. The access fee is refundable if 5 out of 10 positions are closed in a month. Payout is made after the candidate completes 90 days with the client."
        },
        {
          question: "How much time should I spend each week?",
          answer: "Around 5–6 hours per week is recommended. This is not mandatory, but higher involvement usually results in: better conversions, higher recruiter preference, and increased earning potential."
        },
        {
          question: "Will I interact with clients?",
          answer: "No. All client communication is handled by Changeleaders."
        },
        {
          question: "If I guide a recruiter, will I still get paid if my access is not renewed?",
          answer: "Yes. If a candidate joins from a position where you have guided the recruiter, you will receive your 10% revenue share, even if your access is not renewed at the time of joining."
        }
      ]
    },
    {
      category: "Freelance Domain Expert",
      questions: [
        {
          question: "What is my role as a Domain Expert?",
          answer: "As a Domain Expert, you bring industry or functional expertise to improve hiring accuracy. Your role includes: interpreting role expectations beyond the JD, validating candidate fit from a functional or industry perspective, guiding recruiters on interviewer expectations, and helping analyze interview rejections and skill gaps. You do not source candidates and do not manage clients."
        },
        {
          question: "How do I earn as a Domain Expert?",
          answer: "You earn 10% of the revenue received by Changeleaders for every successful joining you support. Access fee: ₹2,999 per month. The access fee is refundable if 5 out of 10 positions are closed in a month. Payout is made after the candidate completes 90 days with the client."
        },
        {
          question: "How much time should I spend each week?",
          answer: "Around 5–6 hours per week is recommended. This is not mandatory, but greater involvement improves: conversion rates, recruiter trust, and long-term earning opportunities."
        },
        {
          question: "If I guide a recruiter, will I still get paid if my access is not renewed?",
          answer: "Yes. If a candidate joins from a position where you have guided the recruiter, you will receive your 10% revenue share, even if your access is not renewed."
        }
      ]
    },
    {
      category: "Onboarding & General",
      questions: [
        {
          question: "How does onboarding work?",
          answer: "For Freelance Recruiters: Pay the access fee to receive immediate access to live mandates, Recruitment Coaches, and Domain Experts. Portal access is activated immediately. For Recruitment Coaches & Domain Experts: After paying the access fee, Changeleaders conducts an evaluation via Google Meet. If you are not approved, the access fee is refunded within 96 hours. If approved, onboarding includes: platform and dashboard access, introduction to the Operations team, profile visibility to recruiters, and creation of WhatsApp groups for collaboration."
        },
        {
          question: "Is this full-time or part-time?",
          answer: "All roles are freelance and flexible. You choose your level of involvement."
        },
        {
          question: "What makes RecruiterV different?",
          answer: "RecruiterV is skill-first and outcome-driven. You are rewarded for quality, accountability, and results — not volume, hustle, or client chasing."
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const toggleAccordion = (categoryIndex, questionIndex) => {
    const globalIndex = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === globalIndex ? null : globalIndex);
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <HelpCircle size={16} />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-gray-600 text-lg">
            Everything you need to know about RecruiterV
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-700"
            />
          </div>
        </div>

        {/* FAQs by Category */}
        {filteredFaqs.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-8">
            {/* Category Header */}
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
              {category.category}
            </h3>

            {/* Questions */}
            <div className="space-y-3">
              {category.questions.map((faq, questionIndex) => {
                const globalIndex = `${categoryIndex}-${questionIndex}`;
                const isOpen = openIndex === globalIndex;

                return (
                  <div
                    key={questionIndex}
                    className="bg-white rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 overflow-hidden"
                  >
                    {/* Question Button */}
                    <button
                      onClick={() => toggleAccordion(categoryIndex, questionIndex)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 pr-4">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`flex-shrink-0 text-blue-600 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        size={24}
                      />
                    </button>

                    {/* Answer */}
                    <div
                      className={`transition-all duration-300 ease-in-out ${
                        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      } overflow-hidden`}
                    >
                      <div className="px-6 pb-5 pt-2">
                        <div className="pl-4 border-l-4 border-blue-500">
                          <p className="text-gray-600 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* No Results */}
        {searchQuery && filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No results found
            </h3>
            <p className="text-gray-500 mb-4">
              Try searching with different keywords
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-blue-600 hover:text-orange-500 font-semibold transition-colors"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Still Have Questions CTA */}
        {/* <div className="mt-12 bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">
            Still have questions?
          </h3>
          <p className="text-blue-50 mb-6">
            Our support team is here to help you 24/7
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:admin@recruiterv.com"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg"
            >
              <span>Email Support</span>
            </a>
            <a
              href="tel:+917827983008"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300"
            >
              <span>Call Us</span>
            </a>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Faqs;