import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

// Marketing landing for recruitment vendors, built to the RecruiterV ATS design.
// The site Header and Footer are kept as they already are; everything between
// them is this page.
//
// Palette taken from the design: navy #0F1D3C, orange #F47B20, emerald #10B981,
// sky #0EA5E9 on an off-white #F4F6FA ground.

const NAVY = '#0F1D3C';
const ORANGE = '#F47B20';

/* ── small building blocks ─────────────────────────────────────────── */

const Eyebrow = ({ children, dark }) => (
  <p className={`text-[11px] font-bold uppercase tracking-[0.22em] mb-3 ${dark ? 'text-orange-400' : 'text-orange-600'}`}>
    {children}
  </p>
);

const Section = ({ children, className = '', dark, id, style }) => (
  <section id={id} className={`px-4 py-16 sm:py-20 ${className}`} style={{ ...(dark ? { background: NAVY } : null), ...style }}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

const H2 = ({ children, dark, center }) => (
  <h2
    className={`font-bold leading-tight text-[26px] sm:text-[34px] ${center ? 'text-center' : ''} ${dark ? 'text-white' : 'text-slate-900'}`}
    style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
  >
    {children}
  </h2>
);

const Lead = ({ children, dark, center }) => (
  <p className={`mt-4 text-[15px] sm:text-base leading-relaxed max-w-2xl ${center ? 'mx-auto text-center' : ''} ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
    {children}
  </p>
);

// The two calls to action, used in the hero and again at the foot of the page.
const Cta = ({ center, onPrimary, onSecondary }) => (
  <div className={`flex flex-wrap gap-3 ${center ? 'justify-center' : ''}`}>
    <button
      onClick={onPrimary}
      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-95 transition"
      style={{ background: ORANGE }}
    >
      Get Started Free <ArrowRight size={16} />
    </button>
    <button
      onClick={onSecondary}
      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm border border-white/30 text-white hover:bg-white/10 transition"
    >
      Vendor Sign In
    </button>
  </div>
);

const Pill = ({ children, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    orange: 'bg-orange-100 text-orange-700',
    sky: 'bg-sky-100 text-sky-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  };
  return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${tones[tone]}`}>{children}</span>;
};

/* ── hero product mock ─────────────────────────────────────────────── */

const HERO_CANDIDATES = [
  { i: 'PS', n: 'Priya Sharma', r: 'Sr. Product Designer · 7 yrs', m: 92, s: 'Shortlisted', c: 'emerald' },
  { i: 'AM', n: 'Arjun Mehta', r: 'Product Designer · 5 yrs', m: 78, s: 'Screening', c: 'orange' },
  { i: 'KN', n: 'Kavya Nair', r: 'UX Lead · 8 yrs', m: 85, s: 'Submitted', c: 'sky' },
  { i: 'RD', n: 'Rohan Das', r: 'UI/UX Designer · 6 yrs', m: 71, s: 'Sourced', c: 'slate' },
];

const HeroMock = () => (
  <div className="rounded-2xl bg-white shadow-2xl overflow-hidden border border-white/10">
    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border-b border-slate-200">
      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
      <span className="ml-3 text-[11px] text-slate-500">app.recruiterv.com</span>
    </div>
    <div className="grid sm:grid-cols-[150px_1fr]">
      <div className="hidden sm:block border-r border-slate-100 p-3">
        <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-2">Workspace</p>
        {['Dashboard', 'Open Positions', 'Resume Bank', 'Candidates', 'Submissions', 'Intelligence'].map((m, i) => (
          <p key={m} className={`text-[12px] px-2 py-1.5 rounded-lg ${i === 0 ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-slate-500'}`}>
            {m}
          </p>
        ))}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="font-bold text-slate-900 text-sm">Candidate Pipeline</p>
            <p className="text-[11px] text-slate-500">Senior Product Designer · TechCorp Global</p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Live Match: 92%</span>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3">
          {[['148', 'Candidates'], ['23', 'Submitted'], ['8', 'Interviews'], ['3', 'Selected']].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-slate-50 p-2 text-center">
              <p className="text-base font-bold text-slate-900">{v}</p>
              <p className="text-[9px] text-slate-500">{l}</p>
            </div>
          ))}
        </div>

        <p className="text-[9px] uppercase tracking-widest text-slate-400 mt-4 mb-1.5">Recent Candidates</p>
        <div className="space-y-1.5">
          {HERO_CANDIDATES.map(c => (
            <div key={c.i} className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2">
              <span className="w-7 h-7 flex-shrink-0 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">{c.i}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-slate-900 truncate">{c.n}</p>
                <p className="text-[10px] text-slate-500 truncate">{c.r}</p>
              </div>
              <span className="text-[11px] font-bold text-slate-900">{c.m}%</span>
              <Pill tone={c.c}>{c.s}</Pill>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl p-3" style={{ background: NAVY }}>
          <p className="text-[9px] uppercase tracking-widest text-orange-400">AI Analysis</p>
          <div className="flex items-center gap-3 mt-1.5">
            <div>
              <p className="text-xl font-bold text-white leading-none">92%</p>
              <p className="text-[9px] text-slate-400">Match</p>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] flex-1">
              {[['Skills Match', true], ['Experience', true], ['Location', true], ['Req. Gap', false]].map(([l, ok]) => (
                <p key={l} className={ok ? 'text-emerald-400' : 'text-amber-400'}>{ok ? '✓' : '⚠'} <span className="text-slate-300">{l}</span></p>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-300 mt-2 border-t border-white/10 pt-2">
            <span className="text-orange-400 font-semibold">AI Insight </span>
            Strong fit. Minor cloud gap. Recommend for submission.
          </p>
        </div>
      </div>
    </div>
  </div>
);

/* ── page data ─────────────────────────────────────────────────────── */

const STATS = [
  ['10,000+', 'Candidates Processed'],
  ['500+', 'Recruitment Vendors'],
  ['3×', 'Faster Candidate Matching'],
  ['40%', 'Better Submission Quality'],
];

const PROBLEMS = [
  ['🔍', 'Too Much Manual Screening', 'Hours spent reviewing resumes and comparing candidates without any intelligence layer to help.'],
  ['🗂️', 'Scattered Candidate Data', 'Relevant candidates buried across different databases, portals and sources — never in one place.'],
  ['❓', 'Unclear Candidate Fit', "Recruiters don't always know how closely a candidate matches the position before submitting."],
  ['🔁', 'Repeated Submission Mistakes', 'Previous rejection reasons are forgotten or unavailable, leading to the same errors again.'],
];

const WORKFLOW = [
  ['01', 'FIND', 'Search Your Resume Bank', 'Discover relevant candidates from your existing database before spending time sourcing again.'],
  ['02', 'MATCH', 'AI-Powered Matching', "RecruiterV automatically identifies which candidates best fit each position's requirements."],
  ['03', 'EVALUATE', 'Live Match Score', "See the candidate's matching percentage in real time as you build their profile."],
  ['04', 'LEARN', 'Submission Signal', "Understand why previous candidates were rejected so you don't repeat the same mistakes."],
  ['05', 'SUBMIT', 'Better Submissions', 'Make higher-quality candidate submissions informed by AI insights and historical data.'],
  ['06', 'TRACK', 'Real-Time Pipeline', 'Follow every candidate from sourcing to joining with complete pipeline visibility.'],
];

const PIPELINE = [
  ['Sourced', 48, 4], ['Screening', 31, 3], ['Shortlisted', 18, 2],
  ['Submitted', 12, 1], ['Interview', 7, 1], ['Selected', 4, 1], ['Joined', 2, 1],
];
const PIPELINE_NAMES = [['PS', 'Priya S.'], ['AM', 'Arjun M.'], ['KN', 'Kavya N.'], ['RD', 'Rohan D.']];

const DIRECT_STEPS = [
  ['01', 'Share Job', 'Share position across LinkedIn, WhatsApp, Google and social networks with one link.'],
  ['02', 'Candidate Applies', 'Candidates click your shared link and submit a simple, recruiter-designed application form.'],
  ['03', 'Candidate Captured', 'Application data lands instantly in your RecruiterV resume bank and pipeline.'],
  ['04', 'Track in ATS', 'Manage and track the candidate through your full recruitment pipeline in real time.'],
];

const GETTING_STARTED = [
  ['01', 'Add Company', 'Create and manage your client companies with their hiring preferences and history.'],
  ['02', 'Create Position', 'Add the job description and hiring requirements for each open position.'],
  ['03', 'Find Candidates', 'Search, match and evaluate candidates from your resume bank with AI assistance.'],
  ['04', 'Submit & Track', 'Submit relevant candidates and track their progress through the hiring pipeline.'],
];

const OPEN_POSITIONS = [
  ['Senior Product Manager', 'Active', 'FinFlow Technologies · Mumbai · Remote OK · 8–12 yrs', ['Product Strategy', 'Fintech', 'Agile']],
  ['ML Engineering Lead', 'Urgent', 'DataSight Analytics · Bangalore · 6–10 yrs', ['Python', 'ML', 'TensorFlow']],
  ['VP of Sales', 'Active', 'GrowthBridge SaaS · Delhi · Hybrid · 10–15 yrs', ['B2B Sales', 'SaaS', 'Leadership']],
];

const INTELLIGENCE = [
  ['47', 'Positions Worked', '+12%'], ['1,284', 'Candidates Sourced', '+23%'],
  ['312', 'Submitted', '+18%'], ['94', 'Interviews', '+31%'],
  ['42', 'Selections', '+15%'], ['38', 'Joins', '+9%'],
];

const ADVANTAGE = [
  ['⚡', 'Faster', 'Reduce manual screening and candidate search time with AI-powered automation and matching.'],
  ['🧠', 'Smarter', 'Use AI to match and evaluate candidates — making data-driven decisions on every submission.'],
  ['📈', 'Better', 'Learn from previous submissions and continuously improve candidate quality over time.'],
  ['➕', 'More', 'Access additional recruitment opportunities through the RecruiterV platform and grow your business.'],
];

const RESUME_BANK = [
  ['AR', 'Anjali Rao', 'Data Scientist', '6 yrs · Bangalore · Active 2 days ago', ['Python', 'ML', 'TensorFlow'], 88],
  ['RS', 'Rahul Singh', 'DevOps Engineer', '5 yrs · Pune · Active 1 week ago', ['Docker', 'Kubernetes', 'AWS'], 76],
  ['MJ', 'Meera Joshi', 'ML Engineer', '4 yrs · Hyderabad · Active 3 days ago', ['PyTorch', 'Python', 'NLP'], 82],
];

// A small arrow-separated flow strip, used in several sections.
const Flow = ({ items, dark }) => (
  <div className="flex flex-wrap items-center gap-2 mt-6">
    {items.map((s, i) => (
      <React.Fragment key={s}>
        <span className={`text-[12px] font-semibold px-3.5 py-2 rounded-xl ${dark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>{s}</span>
        {i < items.length - 1 && <span className="text-orange-500 text-sm">→</span>}
      </React.Fragment>
    ))}
  </div>
);

/* ── page ──────────────────────────────────────────────────────────── */

export default function VendorLanding() {
  const navigate = useNavigate();
  const toRegister = () => navigate('/vendor-register');
  const toLogin = () => navigate('/vendor');

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden" style={{ background: NAVY }}>
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
          <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.22em] px-4 py-2 rounded-full border border-orange-500/40 text-orange-400 bg-orange-500/10">
                RecruiterV ATS
              </span>
              <h1
                className="mt-6 text-white font-bold leading-[1.08] text-[38px] sm:text-[52px]"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                Recruit Smarter.<br />Submit Faster.<br />
                <span className="text-orange-500">Close More.</span>
              </h1>
              <p className="mt-5 text-slate-300 text-[15px] sm:text-base leading-relaxed max-w-xl">
                The AI-powered recruitment workspace built for modern recruitment vendors. Find the
                right candidates, evaluate their fit, make better submissions and track every
                candidate — all from one powerful platform.
              </p>
              <div className="mt-8"><Cta onPrimary={toRegister} onSecondary={toLogin} /></div>
              <div className="mt-8 flex flex-wrap gap-2">
                {['AI Matching', 'Live Match Score', 'Submission Signal', 'Resume Bank', 'Real-Time Tracking'].map(f => (
                  <span key={f} className="text-[11px] font-semibold text-slate-300 bg-white/10 px-3 py-1.5 rounded-full">{f}</span>
                ))}
              </div>
            </div>
            <HeroMock />
          </div>
        </section>

        {/* Stats band */}
        <section className="border-b border-slate-200" style={{ background: '#F4F6FA' }}>
          <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold" style={{ color: ORANGE, fontFamily: "'Outfit', system-ui, sans-serif" }}>{v}</p>
                <p className="text-[12px] text-slate-600 mt-1">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The problem */}
        <Section>
          <Eyebrow>The Problem</Eyebrow>
          <H2>Recruitment Shouldn&apos;t Mean Managing Multiple Tools</H2>
          <Lead>
            Recruiters spend too much time switching between resumes, spreadsheets, job portals and
            internal trackers. RecruiterV brings the entire workflow together in one place.
          </Lead>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {PROBLEMS.map(([icon, title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition">
                <div className="text-2xl">{icon}</div>
                <h3 className="font-bold text-slate-900 mt-3">{title}</h3>
                <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* One workspace */}
        <Section dark>
          <Eyebrow dark>One Workspace</Eyebrow>
          <H2 dark>Your Entire Recruitment Workflow, End to End</H2>
          <Lead dark>
            RecruiterV helps your team move from candidate discovery to successful hiring with
            greater speed, visibility and confidence.
          </Lead>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {WORKFLOW.map(([n, tag, title, body]) => (
              <div key={n} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-white/20" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>{n}</span>
                  <span className="text-[10px] font-bold tracking-[0.18em] px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400">{tag}</span>
                </div>
                <h3 className="font-bold text-white mt-3">{title}</h3>
                <p className="text-[13px] text-slate-400 mt-2 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* AI features */}
        <Section>
          <Eyebrow>AI-Powered</Eyebrow>
          <H2>AI That Works With Your Recruiters</H2>
          <Lead>
            RecruiterV doesn&apos;t replace the recruiter. It helps recruiters make better decisions, faster.
          </Lead>

          {/* Feature 01 */}
          <div className="grid lg:grid-cols-2 gap-8 items-center mt-12">
            <div>
              <Pill tone="orange">Feature 01</Pill>
              <h3 className="text-2xl font-bold text-slate-900 mt-3" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                AI-Powered Resume Screening
              </h3>
              <p className="text-[15px] text-slate-600 mt-3 leading-relaxed">
                Let AI do the first level of resume screening. RecruiterV analyzes candidate resumes
                against position requirements and instantly surfaces the most relevant candidates.
              </p>
              <p className="mt-4 font-semibold text-slate-900">Spend less time screening. More time recruiting.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900 text-sm">Screening Results</p>
                <Pill>214 Analyzed</Pill>
              </div>
              {[['Highly Relevant', 23, 'bg-emerald-500', 11], ['Partially Relevant', 67, 'bg-amber-500', 31], ['Not Relevant', 124, 'bg-slate-300', 58]].map(([l, v, c, w]) => (
                <div key={l} className="mt-4">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-slate-600">{l}</span>
                    <span className="font-bold text-slate-900">{v}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${c}`} style={{ width: `${w}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature 02 */}
          <div className="grid lg:grid-cols-2 gap-8 items-center mt-16">
            <div className="rounded-2xl p-6 order-2 lg:order-1" style={{ background: '#F4F6FA' }}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">AI Matching Engine</p>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 rounded-xl bg-white border border-slate-200 p-3">
                  <p className="text-[11px] font-bold text-slate-900">Job Requirements</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">8+ yrs · Fintech</p>
                  <p className="text-[11px] text-slate-500">Strategy · Agile</p>
                </div>
                <span className="w-9 h-9 flex-shrink-0 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: ORANGE }}>AI</span>
                <div className="flex-1 rounded-xl bg-white border border-slate-200 p-3">
                  <p className="text-[11px] font-bold text-emerald-600">Matched</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">12 highly</p>
                  <p className="text-[11px] text-slate-500">34 partial</p>
                </div>
              </div>
              <div className="space-y-1.5 mt-4">
                {[['P', 'Priya Sharma', 92], ['A', 'Arjun Mehta', 87], ['K', 'Kavya Nair', 81]].map(([i, n, m]) => (
                  <div key={n} className="flex items-center gap-2.5 bg-white rounded-xl border border-slate-200 p-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">{i}</span>
                    <span className="text-[12px] text-slate-800 flex-1">{n}</span>
                    <span className="text-[12px] font-bold text-emerald-600">{m}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Pill tone="orange">Feature 02</Pill>
              <h3 className="text-2xl font-bold text-slate-900 mt-3" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                AI Job-to-Candidate Matching
              </h3>
              <p className="text-[15px] text-slate-600 mt-3 leading-relaxed">
                When a position is posted, RecruiterV identifies the most relevant candidates from
                your Resume Bank automatically. No manual searching required.
              </p>
              <Flow items={['Job Requirements', 'AI Matching', 'Relevant Candidates']} />
            </div>
          </div>

          {/* Feature 03 */}
          <div className="grid lg:grid-cols-2 gap-8 items-center mt-16">
            <div>
              <Pill tone="orange">Feature 03</Pill>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mt-3">Live Match Score</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                Know the Match Before You Submit
              </h3>
              <p className="text-[15px] text-slate-600 mt-3 leading-relaxed">
                As recruiters enter candidate information, RecruiterV continuously evaluates the
                candidate against position requirements. See the matching percentage in real time.
              </p>
              <Flow items={['Enter candidate', 'See live match', 'Identify gaps', 'Submit with confidence']} />
            </div>
            <div className="rounded-2xl border border-slate-200 p-8 text-center bg-white shadow-sm">
              <p className="text-6xl font-bold text-emerald-600" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>92%</p>
              <p className="text-[12px] text-slate-500 mt-1">Match Score</p>
              <div className="grid grid-cols-2 gap-2 mt-6 text-left">
                {[['Skills Match', true], ['Experience Match', true], ['Location Match', true], ['Requirement Gap', false]].map(([l, ok]) => (
                  <div key={l} className={`rounded-xl p-2.5 text-[12px] font-medium ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {ok ? '✓' : '⚠'} {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Submission Signal */}
        <Section dark>
          <Eyebrow dark>Submission Signal</Eyebrow>
          <H2 dark>Learn From Every Submission</H2>
          <Lead dark>
            RecruiterV&apos;s Submission Signal helps recruiters understand exactly why candidates were
            previously rejected — so you never repeat the same mistakes.
          </Lead>
          <div className="grid lg:grid-cols-2 gap-8 items-center mt-10">
            <div>
              <p className="text-xl font-bold text-white" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                Don&apos;t Repeat the Same Submission Mistakes.
              </p>
              <p className="text-[15px] text-slate-400 mt-3 leading-relaxed">
                Turn past recruitment outcomes into actionable insights for better candidate
                selection today.
              </p>
              <Flow dark items={['Past Submissions', 'Rejection Insights', 'Better Decisions', 'Better Submissions']} />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-sm font-bold text-white">💡 Submission Signal</p>
              <p className="text-[12px] text-slate-400 mt-0.5">Ravi Kumar · Senior Java Developer</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mt-5 mb-2">Candidate rejected previously because:</p>
              <div className="space-y-1.5">
                {['Experience below client expectation', 'Notice period too long', 'Industry mismatch', 'Compensation mismatch', 'Frequent job changes'].map(r => (
                  <p key={r} className="text-[12px] text-slate-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <span className="text-red-400">✕</span> {r}
                  </p>
                ))}
              </div>
              <p className="text-[12px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 mt-3 leading-relaxed">
                ⚠ 3 prior rejection signals for this client. Review candidate fit carefully before submitting.
              </p>
            </div>
          </div>
        </Section>

        {/* Resume Bank */}
        <Section>
          <Eyebrow>Resume Bank</Eyebrow>
          <H2>Your Resume Bank Is Your Recruitment Asset</H2>
          <Lead>Search your existing candidate database before spending time sourcing again.</Lead>
          <div className="rounded-2xl border border-slate-200 p-5 mt-10 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[200px] text-[13px] text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                Search by skills, experience, designation, industry or location…
              </div>
              <Pill tone="sky">Python</Pill>
              <Pill tone="sky">Machine Learning</Pill>
              <span className="text-[12px] font-bold text-white px-4 py-2.5 rounded-xl" style={{ background: ORANGE }}>Search</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-4">Showing 3 of 148 results</p>
            <div className="space-y-2 mt-2">
              {RESUME_BANK.map(([i, n, role, meta, skills, m]) => (
                <div key={n} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 flex-wrap">
                  <span className="w-9 h-9 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">{i}</span>
                  <div className="min-w-[150px] flex-1">
                    <p className="text-[13px] font-semibold text-slate-900">{n} <span className="text-slate-400 font-normal">· {role}</span></p>
                    <p className="text-[11px] text-slate-500">{meta}</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">{skills.map(s => <Pill key={s}>{s}</Pill>)}</div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">{m}%</p>
                    <p className="text-[10px] text-slate-400">Match</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-center font-semibold text-slate-900 mt-8">Find candidates you already have. Recruit faster.</p>
        </Section>

        {/* Direct applicants */}
        <Section className="border-y border-slate-200" >
          <div style={{ background: '#F4F6FA' }} className="rounded-3xl p-8 sm:p-10">
            <Eyebrow>Direct Applicants</Eyebrow>
            <H2>Turn Your Network Into Your Candidate Pipeline</H2>
            <Lead>
              Bring candidates directly into RecruiterV from the platforms and networks where
              recruiters already find talent.
            </Lead>
            <div className="flex flex-wrap gap-3 mt-8">
              {[['in', 'LinkedIn', '#0A66C2'], ['W', 'WhatsApp', '#25D366'], ['G', 'Google', '#EA4335'], ['f', 'Facebook', '#1877F2']].map(([i, n, c]) => (
                <div key={n} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
                  <span className="w-6 h-6 rounded-md text-white text-[11px] font-bold flex items-center justify-center" style={{ background: c }}>{i}</span>
                  <span className="text-[13px] font-semibold text-slate-700">{n}</span>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-slate-500 mt-4">Every application becomes part of your recruitment pipeline.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {DIRECT_STEPS.map(([n, title, body]) => (
                <div key={n} className="rounded-2xl bg-white border border-slate-200 p-5">
                  <span className="text-lg font-bold" style={{ color: ORANGE, fontFamily: "'Outfit', system-ui, sans-serif" }}>{n}</span>
                  <h3 className="font-bold text-slate-900 mt-1.5">{title}</h3>
                  <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Real-time tracking */}
        <Section dark>
          <Eyebrow dark>Real-Time Tracking</Eyebrow>
          <H2 dark>Know Where Every Candidate Stands</H2>
          <Lead dark>Track the complete candidate journey from sourcing to joining.</Lead>
          <div className="mt-10 overflow-x-auto">
            <div className="flex gap-3 min-w-[860px]">
              {PIPELINE.map(([stage, count, cards]) => (
                <div key={stage} className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-white">{stage}</p>
                    <span className="text-[11px] font-bold text-orange-400">{count}</span>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    {PIPELINE_NAMES.slice(0, cards).map(([i, n], k) => (
                      <div key={i} className="rounded-lg bg-white/5 p-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-white/10 text-white text-[8px] font-bold flex items-center justify-center">{i}</span>
                          <span className="text-[11px] text-slate-200 truncate">{n}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-0.5">TechCorp · {k + 2}d</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-slate-400 text-[14px] mt-8">
            No spreadsheets. No guesswork. One clear view of your recruitment pipeline.
          </p>
        </Section>

        {/* Voice briefings */}
        <Section>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <Eyebrow>Voice Briefings</Eyebrow>
              <H2>Hear What the JD Doesn&apos;t Tell You</H2>
              <p className="mt-4 text-[15px] text-slate-600 leading-relaxed">
                Important hiring information doesn&apos;t always fit into a job description. Recruiters
                can listen to voice briefings covering:
              </p>
              <div className="grid sm:grid-cols-2 gap-2 mt-5">
                {['Employer hiring preferences', 'Position-specific instructions', 'Candidate expectations', 'Screening guidance', "Do's & Don'ts"].map(x => (
                  <p key={x} className="text-[13px] text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
                    <span className="text-emerald-600">✓</span> {x}
                  </p>
                ))}
              </div>
              <p className="mt-6 font-semibold text-slate-900">Less Ambiguity. Better Submissions.</p>
            </div>
            <div className="rounded-2xl p-7" style={{ background: NAVY }}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-orange-400">Position Briefing</p>
              <p className="font-bold text-white mt-1.5">Senior Backend Engineer · FinFlow Inc.</p>
              <div className="flex items-center gap-4 mt-7">
                <span className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl" style={{ background: ORANGE }}>▶</span>
                <div className="flex-1">
                  <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: '37%', background: ORANGE }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                    <span className="text-orange-400 font-semibold">PLAYING</span>
                    <span>1:24 / 3:45</span>
                  </div>
                </div>
              </div>
              <div className="flex items-end gap-1 h-12 mt-6">
                {[30, 55, 80, 45, 95, 60, 35, 70, 90, 50, 25, 65, 85, 40, 75, 30, 60, 45, 20, 55].map((h, i) => (
                  <span key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i < 7 ? ORANGE : 'rgba(255,255,255,0.15)' }} />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Team alignment */}
        <Section className="border-y border-slate-200" style={{ background: '#F4F6FA' }}>
          <Eyebrow>Team Alignment</Eyebrow>
          <H2>One Briefing. An Entire Team Aligned.</H2>
          <Lead>
            Managers can brief their recruitment team once instead of repeatedly explaining the same
            position to individual recruiters.
          </Lead>
          <div className="grid lg:grid-cols-2 gap-8 items-start mt-8">
            <div>
              <Flow items={['Manager Briefing', 'Recruiter Understanding', 'Better Candidate Selection', 'Better Submission']} />
              <p className="mt-6 font-semibold text-slate-900">
                Keep every recruiter aligned with the same hiring expectations.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Team Briefing</p>
              <p className="font-bold text-slate-900 mt-1">Node.js Backend Engineer · Fintech Client</p>
              <div className="flex items-center gap-2.5 mt-5">
                <span className="w-9 h-9 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">MK</span>
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">Manager Briefing</p>
                  <p className="text-[11px] text-slate-500">Mohit Kumar · 10 minutes ago</p>
                </div>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4 mt-3">
                Client prefers candidates from product companies. Must have hands-on Node.js
                experience. Avoid candidates with more than 3 job changes in 5 years. Notice period
                must be under 30 days.
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mt-5 mb-2">Team Status</p>
              {[['SK', 'Samira Kapoor', 'Read'], ['RV', 'Raj Verma', 'Read'], ['DP', 'Divya Pillai', 'Pending']].map(([i, n, s]) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5">
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">{i}</span>
                  <span className="text-[13px] text-slate-700 flex-1">{n}</span>
                  <Pill tone={s === 'Read' ? 'emerald' : 'orange'}>{s}</Pill>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Getting started */}
        <Section>
          <Eyebrow>Getting Started</Eyebrow>
          <H2>Create Companies. Post Positions. Start Recruiting.</H2>
          <Lead>Manage all your clients and recruitment requirements from one place.</Lead>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {GETTING_STARTED.map(([n, title, body]) => (
              <div key={n} className="rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition">
                <span className="text-lg font-bold" style={{ color: ORANGE, fontFamily: "'Outfit', system-ui, sans-serif" }}>{n}</span>
                <h3 className="font-bold text-slate-900 mt-1.5">{title}</h3>
                <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Open positions */}
        <Section dark>
          <Eyebrow dark>Open Positions</Eyebrow>
          <H2 dark>More Than an ATS. More Opportunities to Recruit.</H2>
          <Lead dark>
            RecruiterV users can also access positions posted on the RecruiterV platform — and choose
            which opportunities they want to work on.
          </Lead>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {OPEN_POSITIONS.map(([title, state, meta, tags]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white">{title}</h3>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${state === 'Urgent' ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                    {state}
                  </span>
                </div>
                <p className="text-[12px] text-slate-400 mt-2">{meta}</p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {tags.map(t => <span key={t} className="text-[11px] text-slate-300 bg-white/10 px-2.5 py-1 rounded-full">{t}</span>)}
                </div>
                <button onClick={toRegister} className="text-[12px] font-bold text-orange-400 mt-5 hover:text-orange-300">
                  Work on Position →
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-white font-semibold mt-10">
            More Positions. More Opportunities. More Revenue Potential.
          </p>
          <p className="text-center text-slate-400 text-[13px] mt-1.5">
            Expand your recruitment business with positions from the RecruiterV platform.
          </p>
        </Section>

        {/* Intelligence */}
        <Section>
          <Eyebrow>Recruitment Intelligence</Eyebrow>
          <H2>Know What&apos;s Happening Across Your Recruitment Team</H2>
          <Lead>Get visibility into positions, recruiters, candidates and recruitment outcomes.</Lead>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {INTELLIGENCE.map(([v, l, d]) => (
              <div key={l} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>{v}</p>
                  <span className="text-[11px] font-bold text-emerald-600">{d}</span>
                </div>
                <p className="text-[12px] text-slate-500 mt-1">{l}</p>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {[['Submission → Interview Ratio', '30.1%'], ['Interview → Selection Ratio', '44.7%']].map(([l, v]) => (
              <div key={l} className="rounded-2xl border border-slate-200 p-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{l}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-xl font-bold text-slate-900">{v}</p>
                  <span className="text-[11px] font-semibold text-emerald-600">↑ improving</span>
                </div>
                <div className="flex items-end gap-1 h-14 mt-4">
                  {[35, 42, 38, 55, 48, 62, 58, 70, 66, 78, 74, 88].map((h, i) => (
                    <span key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: ORANGE, opacity: 0.35 + i * 0.05 }} />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1.5"><span>Jan</span><span>Dec</span></div>
              </div>
            ))}
          </div>
          <p className="text-center font-semibold text-slate-900 mt-8">
            Turn recruitment activity into actionable intelligence.
          </p>
        </Section>

        {/* Why RecruiterV */}
        <Section className="border-y border-slate-200" style={{ background: '#F4F6FA' }}>
          <Eyebrow>Why RecruiterV</Eyebrow>
          <H2>The RecruiterV Advantage</H2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {ADVANTAGE.map(([icon, title, body]) => (
              <div key={title} className="rounded-2xl bg-white border border-slate-200 p-6">
                <div className="text-2xl">{icon}</div>
                <h3 className="font-bold text-slate-900 mt-3 text-lg" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>{title}</h3>
                <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* The difference + closing CTA */}
        <section style={{ background: NAVY }} className="px-4 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto">
            <Eyebrow dark>The RecruiterV Difference</Eyebrow>
            <H2 dark>A Platform That Gets Smarter With Every Submission</H2>
            <Lead dark>
              RecruiterV combines AI, recruitment data and recruiter expertise to help teams
              continuously improve the way they recruit.
            </Lead>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-10">
              {[['Job', 'AI Matching'], ['Candidate', 'Live Match Score'], ['Submission', 'Submission Signal'], ['Learning', 'Better Submissions']].map(([a, b]) => (
                <div key={a} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{a}</p>
                  <p className="text-[13px] font-bold text-orange-400 mt-1.5">{b}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-400">Get Started Today</p>
              <h2
                className="text-white font-bold text-[28px] sm:text-[40px] mt-3"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                Ready to Recruit Smarter?
              </h2>
              <p className="text-slate-300 mt-4 max-w-2xl mx-auto leading-relaxed">
                Give your recruitment team the technology to find better candidates, make better
                submissions and work more efficiently.
              </p>
              <div className="mt-8"><Cta center onPrimary={toRegister} onSecondary={toLogin} /></div>
              <p className="text-[12px] text-slate-500 mt-8">
                RecruiterV ATS — Your AI-Powered Recruitment Workspace
              </p>
              <p className="text-[12px] text-slate-500">Unlocking Value for Every Recruiter</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
