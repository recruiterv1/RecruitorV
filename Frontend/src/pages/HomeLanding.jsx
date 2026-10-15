import useFeatures from '../hooks/useFeatures';
import React from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import {
  Sparkles, ShieldCheck, BadgeCheck, Wallet, ArrowRight,
  LayoutDashboard, Briefcase, Users, GitBranch, Handshake, BarChart3,
  MessageSquare, Settings, Gift, Star, CheckCircle2,
  Search, Heart, Zap, Clock, Bookmark, Rocket, FileUp, Share2, Trophy,
  Lock, Quote, UserSearch, GraduationCap, Lightbulb, Building2, ClipboardCheck
} from "lucide-react";

/* ─────────────────────────  DASHBOARD MOCKUP  ───────────────────────── */
function DashboardMockup() {
  const sidebar = [
    [LayoutDashboard, "Dashboard", true],
    [Briefcase, "Positions"],
    [Users, "Candidates"],
    [GitBranch, "Pipeline"],
    [Handshake, "Collaborations"],
    [Wallet, "Wallet & Earnings"],
    [Gift, "Referrals"],
    [BarChart3, "Analytics"],
    [MessageSquare, "Messages"],
    [Settings, "Settings"],
  ];
  const stats = [
    { label: "Active Positions", value: "1,250", grad: "from-violet-500 to-indigo-600", up: "18%" },
    { label: "Total Candidates", value: "58,340", grad: "from-emerald-400 to-teal-500", up: "36%" },
    { label: "Positions Closed", value: "320", grad: "from-amber-400 to-orange-500", up: "24%" },
    { label: "Rewards Earned", value: "₹18.2 L", grad: "from-rose-400 to-pink-500", up: "28%" },
  ];
  const pipeline = [
    ["Applied", "3,240"], ["Interview", "1,120"], ["Offered", "230"], ["Closed", "120"],
  ];
  return (
    <div className="rounded-2xl bg-[#0b0f1e] ring-1 ring-white/10 shadow-2xl shadow-violet-900/40 p-3 text-[11px]">
      <div className="flex gap-3">
        {/* sidebar */}
        <div className="hidden sm:flex w-40 shrink-0 flex-col gap-0.5 rounded-xl bg-white/[0.03] p-2">
          <div className="flex items-center gap-1.5 px-2 py-2 mb-1">
            <span className="grid place-items-center w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-black text-[10px]">R</span>
            <span className="text-white font-bold text-xs">Recruiterv</span>
          </div>
          {sidebar.map(([Icon, label, active]) => (
            <div key={label} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${active ? "bg-violet-600 text-white" : "text-slate-400"}`}>
              <Icon size={13} /><span className="font-medium truncate">{label}</span>
            </div>
          ))}
        </div>
        {/* main */}
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-bold text-sm">Welcome back, Priya 👋</div>
              <div className="text-slate-400">Here's what's happening with your hiring today.</div>
            </div>
            <div className="hidden sm:block rounded-lg bg-white/5 text-slate-300 px-2.5 py-1.5">This Month ▾</div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {stats.map(s => (
              <div key={s.label} className="rounded-xl bg-white/[0.04] ring-1 ring-white/5 p-2.5">
                <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${s.grad} mb-2`} />
                <div className="text-slate-400 truncate">{s.label}</div>
                <div className="text-white font-bold text-sm">{s.value}</div>
                <div className="text-emerald-400 text-[10px]">↑ {s.up} vs last month</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-white/[0.04] ring-1 ring-white/5 p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">Your Hiring Pipeline</span>
              <span className="text-violet-400">View all</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {pipeline.map(([l, v]) => (
                <div key={l} className="rounded-lg bg-white/[0.03] p-2">
                  <div className="text-slate-400">{l}</div>
                  <div className="text-white font-bold text-sm">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/[0.04] ring-1 ring-white/5 p-2.5">
              <div className="text-white font-semibold mb-1.5">Recent Activity</div>
              {["Product Designer closed", "₹74,000 closing reward", "Rohan applied · UI Dev"].map(t => (
                <div key={t} className="flex items-center gap-1.5 py-1 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />{t}
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-white/[0.04] ring-1 ring-white/5 p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-semibold">Earnings Overview</span>
                <span className="text-emerald-400">+26%</span>
              </div>
              <div className="text-white font-bold text-sm mb-1">₹8,20,000</div>
              <svg viewBox="0 0 200 56" className="w-full h-12">
                <defs>
                  <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,46 L30,40 L60,42 L90,30 L120,33 L150,18 L200,8" fill="none" stroke="#a78bfa" strokeWidth="2" />
                <path d="M0,46 L30,40 L60,42 L90,30 L120,33 L150,18 L200,8 L200,56 L0,56 Z" fill="url(#eg)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-400 border-t border-white/5 pt-2">
        <span className="flex items-center gap-1"><Lock size={10} className="text-emerald-400" /> Secure Payments</span>
        <span className="flex items-center gap-1"><BadgeCheck size={10} className="text-emerald-400" /> Verified Profiles</span>
        <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-emerald-400" /> Transparent Distribution</span>
      </div>
    </div>
  );
}

/* ─────────────────────────  HERO  ───────────────────────── */
function Hero() {
  const f = useFeatures();
  const coachExpertOpen = f.ready && f.coachExpert;
  const features = [
    [ShieldCheck, "Transparent Commission"],
    [BadgeCheck, "Verified Candidates"],
    [Wallet, "Fair Payout Guaranteed"],
  ];
  return (
    <section className="relative pt-12 lg:pt-16 pb-16 bg-gradient-to-b from-violet-50 via-white to-white overflow-hidden">
      <div className="absolute -top-32 -right-24 w-[480px] h-[480px] bg-violet-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-24 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-violet-100 text-violet-700 px-4 py-1.5 text-sm font-semibold shadow-sm">
            <Sparkles size={14} className="text-amber-500" /> All-in-One Hiring &amp; Earning Platform
          </span>
          <h1 className="mt-6 text-5xl sm:text-6xl font-black leading-[1.05] text-slate-900">
            Hire Smarter.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Earn Together.</span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-xl leading-relaxed">
            {coachExpertOpen ? "Recruiters, coaches, experts and referrers" : "Recruiters and referrers"} collaborate to find the right talent, close positions faster and earn fair rewards transparently.
          </p>
          <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
            {features.map(([Icon, label]) => (
              <div key={label} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Icon size={18} className="text-violet-500" /> {label}
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/join" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-7 py-3.5 font-bold shadow-xl shadow-violet-500/30 transition-all">
              Post a Position <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/smart-apply" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 text-slate-800 px-7 py-3.5 font-bold hover:border-violet-400 hover:text-violet-600 transition-all">
              Explore Jobs <ArrowRight size={18} />
            </Link>
          </div>
          <div className="mt-9 flex items-center gap-4">
            <div className="flex -space-x-3">
              {["from-violet-400 to-indigo-500", "from-emerald-400 to-teal-500", "from-amber-400 to-orange-500", "from-rose-400 to-pink-500"].map((g, i) => (
                <span key={i} className={`w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br ${g}`} />
              ))}
            </div>
            <p className="text-sm text-slate-600"><b className="text-slate-900">4,000+ recruiters</b> and <b className="text-slate-900">58K+ candidates</b><br />are already growing with Recruiterv</p>
          </div>
        </div>
        <div className="lg:pl-4">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  SHARED REWARDS  ───────────────────────── */
// A four-column grid leaves two cards hugging the left edge once a role is
// withdrawn. The track count follows the number of cards, and the row is capped
// and centred so a short row reads as deliberate rather than as something
// missing.
const rowClass = (n) =>
  n >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4'
  : n === 3 ? 'sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto'
  : 'sm:grid-cols-2 max-w-3xl mx-auto';

function SharedRewards() {
  const f = useFeatures();
  const coachExpertOpen = f.ready && f.coachExpert;
  // Roles that are not open to join should not be advertised on the way in.
  const roles = [
    { icon: UserSearch, label: "Recruiter", color: "#10b981", note: "Owns the position and drives it to a successful closure." },
    ...(coachExpertOpen ? [
      { icon: Lightbulb, label: "Expert", color: "#8b5cf6", note: "Validates fit and shortlists the right candidates." },
      { icon: GraduationCap, label: "Coach", color: "#f59e0b", note: "Guides and supports the team to close faster." },
    ] : []),
    { icon: Gift, label: "Referrer", color: "#f43f5e", note: "Brings in a candidate who gets selected." },
  ];
  return (
    <section className="py-20 bg-gradient-to-b from-white to-violet-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <span className="text-xs font-bold tracking-[0.2em] text-violet-500 uppercase">Fair, Transparent, Together</span>
            <h2 className="mt-3 text-4xl font-black text-slate-900">Everyone Shares in the Success</h2>
            <p className="mt-4 text-slate-600 max-w-lg leading-relaxed">
              When a position is closed, every contributor earns a fair, pre-agreed reward — {coachExpertOpen ? "recruiters, experts, coaches and referrers" : "recruiters and referrers"} all win together. Your exact share is shown transparently inside your dashboard.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/join" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 font-bold shadow-lg shadow-violet-500/25 transition-all">
                Start Earning Together <ArrowRight size={16} />
              </Link>
              <Link to="/join" className="inline-flex items-center gap-2 rounded-xl border-2 border-violet-200 text-violet-700 hover:bg-violet-50 px-6 py-3 font-bold transition-all">
                <ClipboardCheck size={16} /> Check Eligibility
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-100 to-emerald-100" />
              <div className="absolute inset-6 rounded-full bg-white shadow-inner flex flex-col items-center justify-center text-center px-6">
                <Handshake size={40} className="text-violet-500" />
                <div className="mt-2 text-lg font-black text-slate-900">Rewards Shared</div>
                <div className="text-xs text-slate-400">Fairly · Transparently</div>
              </div>
              {/* orbiting role dots */}
              {roles.map((r, i) => {
                const angle = (i / roles.length) * 2 * Math.PI - Math.PI / 2;
                const x = 50 + 46 * Math.cos(angle);
                const y = 50 + 46 * Math.sin(angle);
                const Icon = r.icon;
                return (
                  <div key={r.label} className="absolute w-12 h-12 -ml-6 -mt-6 rounded-2xl bg-white shadow-lg ring-1 ring-slate-100 grid place-items-center"
                    style={{ left: `${x}%`, top: `${y}%` }}>
                    <Icon size={20} style={{ color: r.color }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className={`mt-12 grid gap-5 ${rowClass(roles.length)}`}>
          {roles.map(({ icon: Icon, label, color, note }) => (
            <div key={label} className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
              <div className="grid place-items-center w-11 h-11 rounded-xl" style={{ backgroundColor: `${color}1a` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <div className="mt-3 font-bold text-slate-900">{label}</div>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  HOW IT WORKS  ───────────────────────── */
function HowItWorks() {
  const f = useFeatures();
  const coachExpertOpen = f.ready && f.coachExpert;
  const steps = [
    [Briefcase, "Post a Position", "Share job details and requirements", "bg-violet-100 text-violet-600"],
    [Search, "Find Candidates", "Search our DB or get applications", "bg-emerald-100 text-emerald-600"],
    [Handshake, "Collaborate", coachExpertOpen ? "Work with coaches, experts & referrers" : "Work with referrers and your team", "bg-amber-100 text-amber-600"],
    [CheckCircle2, "Candidate Hired", "Close the position successfully", "bg-blue-100 text-blue-600"],
    [Trophy, "Earn Commission", "Rewards are distributed transparently", "bg-rose-100 text-rose-600"],
  ];
  return (
    <section className="py-20 bg-violet-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <span className="text-xs font-bold tracking-[0.2em] text-violet-500 uppercase">Simple Steps, Big Impact</span>
        <h2 className="mt-3 text-4xl font-black text-slate-900">How <span className="text-violet-600">Recruiterv</span> Works</h2>
        <div className="mt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {steps.map(([Icon, title, desc, cls], i) => (
            <div key={title} className="relative flex flex-col items-center">
              <div className={`grid place-items-center w-16 h-16 rounded-2xl ${cls}`}>
                <Icon size={26} />
              </div>
              <span className="mt-3 grid place-items-center w-6 h-6 rounded-full bg-white ring-1 ring-slate-200 text-xs font-black text-slate-700">{i + 1}</span>
              <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  CANDIDATE DATABASE  ───────────────────────── */
function CandidateDatabase() {
  const feats = [
    [Zap, "Smart Matching", "AI-powered matching for better results", "text-violet-600"],
    [BadgeCheck, "Verified Profiles", "100% profile verification for trust", "text-emerald-600"],
    [Clock, "Real-time Availability", "Know when candidates are available", "text-blue-600"],
    [Bookmark, "Save & Shortlist", "Build your talent pipeline", "text-rose-600"],
  ];
  return (
    <section id="candidates" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-3 gap-10 items-center">
        <div>
          <h2 className="text-4xl font-black text-slate-900 leading-tight">
            Access <span className="text-violet-600">58K+ Verified</span> <span className="text-emerald-500">Candidates</span>
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Search from our smart candidate database and find the right match faster.
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 p-1.5">
            <input placeholder="Search skills, role or keyword…" className="flex-1 px-3 py-2 text-sm outline-none bg-transparent" />
            <button className="rounded-lg bg-violet-600 text-white px-5 py-2 text-sm font-bold">Search</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["React.js", "Node.js", "UI/UX", "Product Manager", "Java", "Remote", "+20"].map(t => (
              <span key={t} className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-full px-3 py-1">{t}</span>
            ))}
          </div>
        </div>

        {/* candidate card */}
        <div className="rounded-3xl bg-gradient-to-br from-violet-50 to-white ring-1 ring-violet-100 shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-1"><BadgeCheck size={12} /> 92% Match</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-black text-lg">AS</span>
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1">Amit Sharma <span className="w-2 h-2 rounded-full bg-emerald-400" /></div>
              <div className="text-sm text-slate-500">Senior Frontend Developer</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500">
            <div>6 Yrs Exp.</div><div>Bengaluru</div><div>Available in 15 days</div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-400 mb-1">Skills</div>
            <div className="flex flex-wrap gap-1.5">
              {["React.js", "Next.js", "TypeScript"].map(t => (
                <span key={t} className="text-xs font-semibold text-violet-700 bg-violet-100 rounded-full px-2.5 py-1">{t}</span>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-500">Match Score</span><span className="font-bold text-emerald-600">92%</span></div>
            <div className="h-1.5 rounded-full bg-slate-100"><div className="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" /></div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="flex-1 rounded-xl border border-violet-200 text-violet-700 py-2 text-sm font-bold">View Profile</button>
            <button className="grid place-items-center w-10 rounded-xl border border-slate-200 text-rose-500"><Heart size={16} /></button>
          </div>
        </div>

        {/* features */}
        <div className="space-y-5">
          {feats.map(([Icon, title, desc, color]) => (
            <div key={title} className="flex gap-3">
              <div className={`shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-slate-50 ${color}`}><Icon size={18} /></div>
              <div>
                <div className="font-bold text-slate-900">{title}</div>
                <div className="text-sm text-slate-500">{desc}</div>
              </div>
            </div>
          ))}
          <Link to="/log_rec" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 font-bold shadow-lg shadow-violet-500/25 transition-all">
            Explore Candidate Database <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  WHO WE SERVE  ───────────────────────── */
function WhoWeServe() {
  const f = useFeatures();
  const coachExpertOpen = f.ready && f.coachExpert;
  const roles = [
    {
      icon: UserSearch, title: "Recruiter", to: "/recruiter",
      text: "Work on verified positions, submit candidates and earn fair commissions on every closure.",
      grad: "from-violet-500 to-indigo-600", soft: "bg-violet-50 text-violet-600",
    },
    // Coach and Expert tiles are dropped while those roles are closed — each
    // one linked to a sign-up path that now refuses the role.
    ...(coachExpertOpen ? [{
      icon: GraduationCap, title: "Coach", to: "/coach",
      text: "Guide recruiters, sharpen submissions and earn for the closures you help drive.",
      grad: "from-emerald-500 to-teal-600", soft: "bg-emerald-50 text-emerald-600",
    }, {
      icon: Lightbulb, title: "Expert", to: "/expert",
      text: "Validate the right fit with your domain knowledge and get rewarded for quality shortlists.",
      grad: "from-amber-500 to-orange-600", soft: "bg-amber-50 text-amber-600",
    }] : []),
    {
      icon: Building2, title: "Company", to: "/corporate",
      text: "Post positions and access a vetted network of recruiters to hire faster.",
      grad: "from-rose-500 to-pink-600", soft: "bg-rose-50 text-rose-600",
    },
  ];
  return (
    <section className="py-20 bg-violet-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          <span className="text-xs font-bold tracking-[0.2em] text-violet-500 uppercase">Built for Everyone</span>
          <h2 className="mt-3 text-4xl font-black text-slate-900">Who We Serve</h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            Whatever your role in hiring, Recruiterv gives you a fair, transparent way to collaborate and earn.
          </p>
        </div>
        <div className={`mt-12 grid gap-6 ${rowClass(roles.length)}`}>
          {roles.map(({ icon: Icon, title, text, to, grad, soft }) => (
            <Link
              key={title}
              to={to}
              className="group flex flex-col rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-7"
            >
              <div className={`grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} text-white shadow-lg`}>
                <Icon size={26} />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed flex-1">{text}</p>
              <span className={`mt-5 inline-flex items-center gap-1.5 text-sm font-bold rounded-lg px-3 py-1.5 w-fit ${soft} group-hover:gap-2.5 transition-all`}>
                Learn more <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  REFER & EARN  ───────────────────────── */
function ReferEarn() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-violet-50 ring-1 ring-violet-100 p-8">
          <span className="text-xs font-bold tracking-[0.2em] text-violet-500 uppercase">Refer, Support, Earn More</span>
          <h3 className="mt-3 text-3xl font-black text-slate-900">Refer &amp; Earn Extra Rewards</h3>
          <p className="mt-3 text-slate-600 leading-relaxed">
            Refer a candidate and earn an attractive reward when the candidate is hired.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/refer-earn" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 font-bold shadow-lg shadow-violet-500/25">
              <FileUp size={16} /> Upload CV
            </Link>
            <Link to="/refer-earn" className="inline-flex items-center gap-2 rounded-xl border border-violet-300 text-violet-700 px-6 py-3 font-bold">
              <Share2 size={16} /> Share Link
            </Link>
          </div>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 text-white p-8 relative overflow-hidden">
          <Trophy size={120} className="absolute -right-4 -bottom-4 text-white/10" />
          <div className="relative">
            <div className="text-sm text-violet-200 font-semibold">Your Referral Earnings</div>
            <div className="mt-2 text-4xl font-black">₹1,25,000</div>
            <div className="text-sm text-violet-200">Total Earnings</div>
            <Link to="/refer-earn" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 px-5 py-2.5 text-sm font-bold transition-all">
              Learn How It Works
            </Link>
            <div className="mt-6 flex gap-8">
              <div><div className="text-2xl font-black">24</div><div className="text-xs text-violet-200">Successful Referrals</div></div>
              <div><div className="text-2xl font-black">11</div><div className="text-xs text-violet-200">In Progress</div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  STATS BAR  ───────────────────────── */
function StatsBar() {
  const stats = [
    [Users, "58K+", "Verified Candidates"],
    [Briefcase, "4,000+", "Active Recruiters"],
    [ShieldCheck, "52L+", "Rewards Distributed"],
    [Trophy, "320+", "Positions Closed"],
    [BadgeCheck, "92%", "Placement Success"],
  ];
  return (
    <section className="py-6 bg-gradient-to-r from-[#0b0f1e] via-[#15162b] to-[#1b1033]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-5 gap-6 divide-slate-700">
        {stats.map(([Icon, value, label]) => (
          <div key={label} className="flex items-center gap-3 justify-center">
            <Icon size={22} className="text-violet-400" />
            <div>
              <div className="text-xl font-black text-white">{value}</div>
              <div className="text-xs text-slate-400">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────  TESTIMONIALS  ───────────────────────── */
function Testimonials() {
  // Placeholder copy, not real customers — see the note where this is rendered.
  const items = [
    { text: "Recruiterv has completely changed how we hire. We close positions faster and the reward distribution is always transparent.", name: "Neha Singh", role: "Talent Acquisition Lead, Deloitte", g: "from-violet-400 to-indigo-500" },
    { text: "The candidate database quality is outstanding. We always find the right fit in less time.", name: "Ravi Kumar", role: "HR Manager, Tata Consultancy Services", g: "from-emerald-400 to-teal-500" },
    { text: "Positions reach me the same day they open, and I always know what the client actually wants before I start sourcing.", name: "Priya Nair", role: "Independent Recruiter", g: "from-amber-400 to-orange-500" },
    { text: "What I value most is knowing my commission before I submit anyone. No negotiation after the fact, no surprises.", name: "Arun Sharma", role: "Freelance Technical Recruiter", g: "from-rose-400 to-pink-500" },
    { text: "We filled three specialist roles in a month that had been open since the previous quarter.", name: "Meera Iyer", role: "Head of Talent, SaaS Company", g: "from-sky-400 to-blue-500" },
    { text: "The referral side pays for itself. I send people I know are good and get rewarded when they are placed.", name: "Vikram Desai", role: "Referrer", g: "from-teal-400 to-cyan-500" },
  ];
  return (
    <section className="py-20 bg-violet-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          <span className="text-xs font-bold tracking-[0.2em] text-violet-500 uppercase">Trusted by Professionals</span>
          <h2 className="mt-3 text-4xl font-black text-slate-900">Loved by Recruiters &amp; Partners</h2>
        </div>
        {/* A scroller rather than a grid, so more can be added without the row
            reflowing. Snap points mean a phone lands on one card at a time
            instead of stopping halfway between two. */}
        <div className="mt-12 flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4
                        -mx-4 px-4 sm:mx-0 sm:px-0
                        [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {items.map(t => (
            <div key={t.name}
              className="snap-center shrink-0 w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]
                         rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-7">
              <Quote size={28} className="text-violet-200" />
              <p className="mt-4 text-slate-700 leading-relaxed">{t.text}</p>
              <div className="mt-6 flex items-center gap-3">
                <span className={`grid place-items-center w-11 h-11 rounded-full bg-gradient-to-br ${t.g} text-white font-bold`}>{t.name.split(" ").map(n => n[0]).join("")}</span>
                <div>
                  <div className="font-bold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-0.5">{Array(5).fill(0).map((_, i) => <Star key={i} size={13} className="fill-amber-400 text-amber-400" />)}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-slate-400 sm:hidden">Swipe for more</p>
      </div>
    </section>
  );
}

/* ─────────────────────────  FINAL CTA  ───────────────────────── */
function FinalCTA() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 px-8 py-14 text-white">
          <Rocket size={160} className="absolute -right-6 bottom-0 text-white/10 rotate-12" />
          <div className="relative max-w-2xl">
            <h2 className="text-4xl sm:text-5xl font-black leading-tight">Ready to Close Your Next Position?</h2>
            <p className="mt-4 text-violet-100 text-lg">
              Join thousands of recruiters and candidates who are already growing with Recruiterv.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/join" className="inline-flex items-center gap-2 rounded-xl bg-white text-violet-700 px-7 py-3.5 font-bold shadow-lg hover:bg-violet-50 transition-all">
                Start Recruiting <ArrowRight size={18} />
              </Link>
              <Link to="/smart-apply" className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 px-7 py-3.5 font-bold transition-all">
                Apply as Candidate
              </Link>
              <Link to="/join" className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 px-7 py-3.5 font-bold transition-all">
                <ClipboardCheck size={18} /> Check Eligibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  ELIGIBILITY CHECK  ───────────────────────── */
function EligibilityCheck() {
  const points = [
    ["Required before you register", "Every recruiter clears the check first — it takes a few minutes."],
    ["Know straight away", "Your result appears the moment you submit — no waiting to hear back."],
    ["Pass, then register", "Clear it and you go straight on to registration with the same email."],
  ];
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-[#0b0f1e] via-[#15162b] to-[#1b1033] px-6 sm:px-12 py-12 sm:py-14">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-200">
                <ClipboardCheck size={13} /> Eligibility Check
              </span>
              <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold text-white leading-tight">
Start with the<br />eligibility check.
              </h2>
              <p className="mt-4 text-slate-300 leading-relaxed max-w-lg">
                The eligibility check is the first step to joining as a Recruiter.
                Answer a few multiple-choice questions, see your
                result immediately, and go straight on to registration once you pass.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/join"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-7 py-3.5 font-bold shadow-lg shadow-violet-500/25 transition-all">
                  Start Your Eligibility Check <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              {points.map(([title, text]) => (
                <div key={title} className="rounded-2xl bg-white/[0.06] border border-white/10 p-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 h-7 w-7 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center">
                      <CheckCircle2 size={15} />
                    </span>
                    <div>
                      <p className="font-bold text-white text-[15px]">{title}</p>
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed">{text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  PAGE  ───────────────────────── */
export default function HomeLanding() {
  return (
    <div className="font-sans text-slate-900 bg-white overflow-x-hidden">
      <Header />
      <Hero />
      <SharedRewards />
      <HowItWorks />
      <CandidateDatabase />
      <WhoWeServe />
      <EligibilityCheck />
      <ReferEarn />
      <StatsBar />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
}
