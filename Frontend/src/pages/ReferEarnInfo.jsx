import React from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import {
  Gift, Share2, FileUp, Wallet, BadgeCheck, ShieldCheck, ArrowRight,
  UserPlus, Send, Trophy, IndianRupee, Clock, Users, Sparkles
} from "lucide-react";

/* ───────── HOW IT WORKS ───────── */
const STEPS = [
  { icon: UserPlus, title: "Sign Up Free", text: "Create your Recruiterv account in minutes — no charges, no commitments." },
  { icon: Send, title: "Refer a Candidate", text: "Upload a CV or share your unique referral link with people in your network." },
  { icon: BadgeCheck, title: "We Match & Place", text: "Our recruiters and experts take it forward and present the candidate to hiring companies." },
  { icon: Trophy, title: "Earn Your Reward", text: "When your referral is hired, you earn 5% of the candidate's CTC — paid transparently." },
];

const BENEFITS = [
  { icon: IndianRupee, title: "5% of CTC", text: "Earn a generous 5% of the hired candidate's annual CTC for every successful referral." },
  { icon: ShieldCheck, title: "Transparent Tracking", text: "Follow every referral's status in real time — from submission to placement to payout." },
  { icon: Clock, title: "No Effort Required", text: "Just refer. Our recruiters, coaches and experts handle screening, interviews and closing." },
  { icon: Users, title: "Unlimited Referrals", text: "There's no cap. Refer as many people as you like and stack up your rewards." },
];

const FAQS = [
  { q: "Who can refer candidates?", a: "Anyone. You don't need to be a recruiter — friends, ex-colleagues, students and professionals can all refer and earn." },
  { q: "How much can I earn?", a: "You earn 5% of the candidate's annual CTC for every successful hire. There is no limit on the number of referrals." },
  { q: "When do I get paid?", a: "Rewards are released after the referred candidate is successfully placed and joins, as per the agreed payout terms." },
  { q: "Is there any cost to refer?", a: "No. Referring is completely free — you only stand to earn." },
];

export default function ReferEarnInfo() {
  return (
    <div className="font-sans text-slate-900 bg-white overflow-x-hidden">
      <Header />

      {/* HERO */}
      <section className="relative pt-12 lg:pt-16 pb-16 bg-gradient-to-b from-violet-50 via-white to-white overflow-hidden">
        <div className="absolute -top-32 -right-24 w-[480px] h-[480px] bg-violet-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-violet-100 text-violet-700 px-4 py-1.5 text-sm font-semibold shadow-sm">
              <Sparkles size={14} className="text-amber-500" /> Refer &amp; Earn Program
            </span>
            <h1 className="mt-6 text-5xl sm:text-6xl font-black leading-[1.05] text-slate-900">
              Refer Talent.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Earn Rewards.</span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl leading-relaxed">
              Know someone looking for a job? Refer them to Recruiterv and earn <b className="text-slate-900">5% of their CTC</b> when they get hired. No effort, no cost — just share and earn.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/reg" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-7 py-3.5 font-bold shadow-xl shadow-violet-500/30 transition-all">
                Start Referring <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/log_rec" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 text-slate-800 px-7 py-3.5 font-bold hover:border-violet-400 hover:text-violet-600 transition-all">
                Login
              </Link>
            </div>
          </div>

          {/* Reward card */}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 text-white p-8 relative overflow-hidden">
            <Gift size={140} className="absolute -right-6 -bottom-6 text-white/10" />
            <div className="relative">
              <div className="text-sm text-violet-200 font-semibold">You could earn</div>
              <div className="mt-2 text-5xl font-black">₹60,000</div>
              <div className="text-sm text-violet-200">on a single ₹12L CTC placement</div>
              <div className="mt-6 space-y-3">
                {["5% of CTC on every hire", "Unlimited referrals", "Transparent, on-time payouts"].map(t => (
                  <div key={t} className="flex items-center gap-2 text-sm">
                    <BadgeCheck size={16} className="text-emerald-300" /> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-violet-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-xs font-bold tracking-[0.2em] text-violet-500 uppercase">Simple Steps</span>
          <h2 className="mt-3 text-4xl font-black text-slate-900">How Refer &amp; Earn Works</h2>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="flex flex-col items-center">
                <div className="relative grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
                  <Icon size={26} />
                  <span className="absolute -top-2 -right-2 grid place-items-center w-6 h-6 rounded-full bg-white ring-1 ring-slate-200 text-xs font-black text-slate-700">{i + 1}</span>
                </div>
                <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold tracking-[0.2em] text-violet-500 uppercase">Why Refer</span>
            <h2 className="mt-3 text-4xl font-black text-slate-900">Rewards That Add Up</h2>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-violet-50/60 ring-1 ring-violet-100 p-7">
                <div className="grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WAYS TO REFER */}
      <section className="py-20 bg-violet-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold tracking-[0.2em] text-violet-500 uppercase">Two Easy Ways</span>
            <h2 className="mt-3 text-4xl font-black text-slate-900">Refer in Seconds</h2>
          </div>
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white ring-1 ring-slate-100 shadow-sm p-8">
              <div className="grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg"><FileUp size={26} /></div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">Upload a CV</h3>
              <p className="mt-2 text-slate-500 leading-relaxed">Have a candidate's resume? Upload it directly and we'll take it from there.</p>
            </div>
            <div className="rounded-3xl bg-white ring-1 ring-slate-100 shadow-sm p-8">
              <div className="grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"><Share2 size={26} /></div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">Share Your Link</h3>
              <p className="mt-2 text-slate-500 leading-relaxed">Get a unique referral link and share it with your network on WhatsApp, LinkedIn or email.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold tracking-[0.2em] text-violet-500 uppercase">FAQ</span>
            <h2 className="mt-3 text-4xl font-black text-slate-900">Common Questions</h2>
          </div>
          <div className="mt-10 space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="rounded-2xl ring-1 ring-slate-100 bg-violet-50/40 p-6">
                <h3 className="font-bold text-slate-900">{q}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 px-8 py-14 text-white">
            <Wallet size={160} className="absolute -right-6 bottom-0 text-white/10 rotate-12" />
            <div className="relative max-w-2xl">
              <h2 className="text-4xl sm:text-5xl font-black leading-tight">Start Earning From Your Network Today</h2>
              <p className="mt-4 text-violet-100 text-lg">Sign up free, refer a candidate, and earn when they get hired. It's that simple.</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/reg" className="inline-flex items-center gap-2 rounded-xl bg-white text-violet-700 px-7 py-3.5 font-bold shadow-lg hover:bg-violet-50 transition-all">
                  Get Started Free <ArrowRight size={18} />
                </Link>
                <Link to="/log_rec" className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 px-7 py-3.5 font-bold transition-all">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
