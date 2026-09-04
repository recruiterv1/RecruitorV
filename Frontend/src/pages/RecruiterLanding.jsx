import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

// Marketing landing for freelance / experienced recruiters, built to the
// RecruiterV recruiter design. Site Header and Footer are kept as they are.
//
// Palette from the design: deep teal-navy #172B3A, orange #F28C28,
// off-white #F7F9FA, cream #FFF7ED, emerald #10B981.

const INK = '#172B3A';
const ORANGE = '#F28C28';

/* ── building blocks ───────────────────────────────────────────────── */

const Eyebrow = ({ children, dark }) => (
  <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-3 ${dark ? 'text-orange-400' : 'text-orange-600'}`}>
    {children}
  </p>
);

const Section = ({ children, className = '', dark, style }) => (
  <section className={`px-4 py-16 sm:py-20 ${className}`} style={{ ...(dark ? { background: INK } : null), ...style }}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

const H2 = ({ children, dark, center }) => (
  <h2 className={`font-bold leading-tight text-[26px] sm:text-[34px] ${center ? 'text-center' : ''} ${dark ? 'text-white' : 'text-slate-900'}`}>
    {children}
  </h2>
);

const Lead = ({ children, dark, center }) => (
  <p className={`mt-4 text-[15px] leading-relaxed max-w-3xl ${center ? 'mx-auto text-center' : ''} ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
    {children}
  </p>
);

const Primary = ({ children, onClick, className = '' }) => (
  <button onClick={onClick}
    className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-95 transition ${className}`}
    style={{ background: ORANGE }}>
    {children} <ArrowRight size={16} />
  </button>
);

// Arrow-separated flow strip, reused across several sections.
const Flow = ({ items, dark }) => (
  <div className="flex flex-wrap items-center gap-2">
    {items.map((s, i) => (
      <React.Fragment key={s}>
        <span className={`text-[12px] font-semibold px-3.5 py-2 rounded-xl ${dark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>{s}</span>
        {i < items.length - 1 && <span className="text-orange-500 text-sm">→</span>}
      </React.Fragment>
    ))}
  </div>
);

/* ── page data ─────────────────────────────────────────────────────── */

const HERO_PILLS = [
  ['📋', 'Live Positions', 'Access real hiring opportunities'],
  ['🎯', 'Skill Fit', 'Find positions relevant to your expertise'],
  ['👥', 'Free Resume Bank', 'Expand your candidate sourcing'],
  ['🤖', 'Free AI-Driven ATS', 'Manage your recruitment pipeline'],
  ['🔗', 'Refer & Earn', 'Your candidate can continue creating value'],
];

const FEATURES = [
  ['📋', '01', 'Live Hiring Opportunities', 'Access positions where recruiters are actively needed. Choose opportunities that match your recruitment expertise, experience and candidate network.'],
  ['🎯', '02', 'Skill Fit', "Don't waste time searching through every position. Use Skill Fit to discover roles relevant to your recruitment expertise and sourcing capabilities."],
  ['👥', '03', 'Free Resume Bank', 'Your own candidate network is powerful. RecruiterV gives you more. Get free access to the Resume Bank and discover additional candidates for positions you are working on.'],
  ['🤖', '04', 'Free AI-Driven ATS', "Recruit smarter and stay organized. Use RecruiterV's AI-driven ATS to manage candidates and organize your recruitment pipeline in one place."],
  ['🔗', '05', 'Direct Applicant', 'Let candidates come directly to you. Generate your Direct Applicant link and share it on LinkedIn, WhatsApp, Facebook or your professional network.'],
  ['🎧', '06', 'Voice Notes', 'Understand requirements faster. Listen to position briefings, sourcing guidance, hiring priorities and important updates through Voice Notes.', 'NEW'],
  ['💰', '07', 'Refer & Earn', 'A candidate who is not right for one position may be perfect for another. Earn 2.5% referral fee when an eligible referred candidate is placed by another recruiter within 90 days.'],
  ['📊', '08', 'Candidate Tracking', 'Keep your recruitment activity organized. Submit candidates, monitor their progress and manage your recruitment workflow from one platform.'],
];

const STEPS = [
  ['01', 'Register', 'Create your RecruiterV profile and tell us about your recruitment experience.'],
  ['02', 'Explore Positions', 'Browse live positions available for recruiters.'],
  ['03', 'Find Your Fit', 'Use All Positions, Skill Fit and Assigned Positions to identify roles you can work on.'],
  ['04', 'Source Candidates', 'Use your network, Resume Bank and Direct Applicant to build your candidate pipeline.'],
  ['05', 'Submit & Track', 'Submit candidates and track their progress through the platform.'],
  ['06', 'Earn', 'Earn from successful placements or eligible referrals according to the applicable RecruiterV terms.'],
];

const SKILL_FIT = [
  ['Senior Java Developer', 'Engineering · 12% client fee', 92],
  ['Backend Engineer (Python)', 'Technology · 10% client fee', 88],
  ['Cloud Architect', 'Infrastructure · 14% client fee', 74],
  ['DevOps Engineer', 'Operations · 11% client fee', 71],
];

const BANK = [
  ['Aditya Mehta', 'Java Developer · 6 yrs · Mumbai', ['Java', 'Spring', 'AWS']],
  ['Sneha Patel', 'Product Manager · 4 yrs · Bangalore', ['Agile', 'Jira', 'SQL']],
  ['Rahul Kumar', 'UX Designer · 5 yrs · Delhi', ['Figma', 'Research', 'CSS']],
];

const ATS_PIPELINE = [
  ['Sourced', ['Aditya M.', 'Neha R.']],
  ['Screening', ['Priya K.']],
  ['Submitted', ['Raj T.', 'Anita S.']],
  ['Interview', ['Vikram P.']],
  ['Selected', ['Divya C.']],
  ['Joined', []],
];

const VOICE_BENEFITS = [
  ['🎧', 'Understand Faster', 'Listen to important requirements instead of going through lengthy written explanations.'],
  ['🎯', 'Source Better', 'Understand what kind of candidate you should look for before starting your search.'],
  ['🧠', 'Capture Hiring Priorities', 'Hear important sourcing tips, candidate expectations and position-specific guidance.'],
  ['🔁', 'Reduce Repeated Explanations', 'A Coach can record a position briefing once so recruiters can listen whenever they need it.'],
];

const REFER_STEPS = [
  ['01', 'Upload / Refer', 'Upload or refer a candidate while working on a position.'],
  ['02', 'Not Selected', 'The candidate is not selected for the original position.'],
  ['03', 'Candidate Becomes Available', 'Where eligible, the candidate becomes visible to other recruiters for relevant opportunities.'],
  ['04', 'Another Recruiter Finds the Match', 'Another RecruiterV recruiter identifies the candidate for a suitable position.'],
  ['05', 'Successful Placement', 'The candidate is successfully hired.'],
  ['06', 'You Earn', 'You become eligible for the 2.5% referral fee.'],
];

const ACTIVE_POSITIONS = [
  ['Senior Java Developer', 'Engineering', 4, 'Active'],
  ['Product Manager', 'Product', 2, 'Active'],
  ['Data Analyst', 'Analytics', 6, 'Sourcing'],
  ['Cloud Architect', 'Infrastructure', 1, 'Active'],
  ['UX Designer', 'Design', 3, 'Sourcing'],
  ['DevOps Engineer', 'Operations', 2, 'Active'],
];

const SOURCES = [
  ['01', '🤝', 'Your Network', 'Use your existing candidate relationships and professional network.'],
  ['02', '📂', 'Resume Bank', "Access RecruiterV's Resume Bank and expand your candidate search."],
  ['03', '🔗', 'Direct Applicant', 'Share your applicant link and receive candidates directly from your network and social media.'],
];

const COMPARE = [
  ['Find requirements yourself', 'Access live positions'],
  ['Search multiple databases', 'Free Resume Bank'],
  ['Manage candidates manually', 'AI-driven ATS'],
  ['Email / WhatsApp submissions', 'Structured candidate submission'],
  ['Chase candidate updates', 'Track candidate status'],
  ['Repeated position explanations', 'Coach + Voice Notes'],
  ['Only your personal network', 'Network + Resume Bank + Direct Applicant'],
  ['One position at a time', 'Work on multiple positions'],
  ['Rejected candidates become inactive', 'Refer & Earn opportunity'],
  ['Manual reporting', 'Platform-based reporting'],
];

const TESTIMONIALS = [
  ['Voice Notes & Platform Usability', 'The Voice Note briefings make a real difference — I can understand exactly what the client is looking for before I start sourcing. The platform is well-designed and easy to navigate.', 'Recruiter Placeholder A', '6 years recruitment experience'],
  ['Resume Bank & Refer & Earn', "The Resume Bank has significantly expanded my sourcing options. And the Refer & Earn feature means even rejected candidates can still create value. I didn't expect that when I joined.", 'Recruiter Placeholder B', '4 years recruitment experience'],
  ['Candidate Tracking & Multiple Positions', 'The candidate tracking and submission workflow is far more organized than managing everything through email. Working on multiple positions from one dashboard is a major improvement.', 'Recruiter Placeholder C', '8 years recruitment experience'],
];

const FAQS = [
  ['Who can register as a RecruiterV recruiter?', 'RecruiterV is designed for experienced recruiters with a minimum of 2 years of recruitment experience. Recruiters should have experience in candidate sourcing, screening and evaluating candidates against job requirements.'],
  ['Do I need to find my own clients?', 'No. RecruiterV provides hiring opportunities on the platform, allowing recruiters to focus primarily on candidate sourcing and recruitment. Relevant hiring coordination is supported through the RecruiterV ecosystem and Client SPOC.'],
  ['Can I work on multiple positions?', 'Yes. You can work on multiple positions simultaneously. You can choose opportunities based on your recruitment expertise, candidate network and sourcing capabilities.'],
  ['What is Skill Fit?', 'Skill Fit helps you discover positions that are relevant to your recruitment expertise. It allows you to focus your sourcing efforts on positions where your experience and network are most relevant.'],
  ['Is the Resume Bank free?', 'Yes. Registered recruiters get free access to the RecruiterV Resume Bank, subject to applicable RecruiterV terms and usage policies.'],
  ['Is the AI-driven ATS free?', "Yes. Registered recruiters can access RecruiterV's AI-driven ATS as part of the platform to help organize candidates and manage their recruitment pipeline."],
  ['What is Direct Applicant?', 'Direct Applicant allows you to generate and share an applicant link for a position. You can share this link through LinkedIn, WhatsApp, Facebook or your professional network. Candidates can apply directly through the link.'],
  ['What is Refer & Earn?', 'Refer & Earn allows you to earn from an eligible candidate you originally upload or refer even if you do not make the final placement yourself. If the candidate is not selected for the original position and is subsequently placed by another recruiter within 90 days, you can earn 2.5% of the recruitment revenue received by RecruiterV from the client, subject to the applicable referral terms.'],
  ['How long does Refer & Earn eligibility remain valid?', "Refer & Earn eligibility remains valid for 90 days from the applicable candidate upload/referral date. If the eligible candidate is successfully placed by another recruiter within this 90-day period, you may qualify for the 2.5% referral fee, subject to RecruiterV's referral terms."],
  ['Can candidates from my social media posts qualify for Refer & Earn?', 'Yes, subject to the applicable referral conditions. If a candidate applies through your eligible Direct Applicant link and is subsequently associated with your recruitment activity, that candidate may qualify for Refer & Earn. If the candidate is not selected for the original position but is successfully placed by another recruiter within the applicable 90-day referral period, you may be eligible for the 2.5% referral fee.'],
  ['How much do I earn when I successfully place a candidate?', 'Recruiters receive a 35% revenue share of the recruitment revenue received by RecruiterV from the client for an eligible successful placement. The applicable recruitment fee/revenue percentage received by RecruiterV from the client is mentioned on each position, so you can understand the earning opportunity before working on the position.'],
  ['Can you give an example of the 35% revenue share?', 'Yes. If RecruiterV receives ₹1,00,000 in recruitment revenue from the client for an eligible successful placement: RecruiterV revenue = ₹1,00,000, Recruiter share (35%) = ₹35,000. The actual payment remains subject to the applicable placement and payment terms.'],
  ['How much do I earn through Refer & Earn?', 'The referral fee is 2.5% of the recruitment revenue received by RecruiterV from the client. For example, if RecruiterV receives ₹1,00,000, the 2.5% referral fee = ₹2,500. Payment remains subject to the applicable referral terms.'],
  ['If another recruiter places my candidate, do I still earn?', 'Yes, if the candidate qualifies under the Refer & Earn conditions. If you are the eligible recruiter who originally uploaded or referred the candidate and another recruiter successfully places that candidate within the 90-day referral period, you can earn the applicable 2.5% referral fee.'],
  ['What happens when my candidate is rejected?', 'A candidate rejected for one position may still be suitable for another opportunity. Where eligible, the candidate can become visible to other recruiters for relevant positions. If another recruiter successfully places the candidate within the 90-day referral period, you may qualify for the Refer & Earn benefit.'],
  ['How do I know the recruitment fee for a position?', 'The applicable recruitment fee/revenue percentage received by RecruiterV from the client is displayed on the individual position. This allows recruiters to understand the applicable revenue opportunity before working on the position.'],
  ['How does the Voice Note feature help?', 'Voice Notes allow Coaches or authorized users to communicate important position information quickly. Recruiters can listen to position briefings, hiring priorities, candidate expectations, sourcing guidance and important updates. This helps recruiters understand requirements faster and reduces repeated explanations.'],
  ['Can I track my candidates?', 'Yes. RecruiterV allows you to submit candidates and track their progress through the recruitment workflow.'],
  ['When will I receive my placement or referral payment?', "Payments are made according to the applicable RecruiterV payment terms and successful placement/payment milestones. The specific conditions applicable to a position or referral will be governed by RecruiterV's commercial and referral terms."],
];

/* ── hero dashboard mock ───────────────────────────────────────────── */

const HeroMock = () => (
  <div className="rounded-2xl bg-white shadow-2xl overflow-hidden">
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
      <span className="text-[13px] font-bold text-slate-900">RecruiterV</span>
      <span className="text-[11px] text-slate-400">Positions</span>
      <span className="text-[11px] text-slate-400">Resume Bank</span>
      <span className="text-[11px] text-slate-400">AI ATS</span>
    </div>
    <div className="p-4">
      <div className="grid grid-cols-4 gap-2">
        {[['48', 'Live Positions', '+6 today'], ['12', 'Skill Fit', '92% avg'], ['7', 'My Pipeline', '4 active'], ['35%', 'My Earnings', 'Revenue share']].map(([v, l, s]) => (
          <div key={l} className="rounded-xl bg-slate-50 p-2.5">
            <p className="text-base font-bold text-slate-900">{v}</p>
            <p className="text-[9px] text-slate-500">{l}</p>
            <p className="text-[9px] text-emerald-600 font-semibold">{s}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 mb-1.5">
        <p className="text-[10px] uppercase tracking-widest text-slate-400">Open Positions</p>
        <span className="text-[10px] font-semibold" style={{ color: ORANGE }}>View All →</span>
      </div>
      <div className="space-y-1.5">
        {[['Senior Java Developer', 'Engineering · Fee: 12%', '92% Match', 'emerald'],
          ['Product Manager', 'Product · Fee: 10%', 'Assigned', 'slate'],
          ['Data Analyst', 'Analytics · Fee: 14%', '94% Match', 'emerald'],
          ['UX Designer', 'Design · Fee: 11%', 'Open', 'orange']].map(([t, m, tag, tone]) => (
          <div key={t} className="flex items-center gap-2 rounded-xl border border-slate-100 p-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-slate-900 truncate">{t}</p>
              <p className="text-[10px] text-slate-500">{m}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${
              tone === 'emerald' ? 'bg-emerald-100 text-emerald-700'
              : tone === 'orange' ? 'bg-orange-100 text-orange-700'
              : 'bg-slate-100 text-slate-600'}`}>{tag}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-4 mb-1.5">Candidate Pipeline</p>
      <div className="grid grid-cols-5 gap-1.5">
        {[['Sourced', 12], ['Screening', 7], ['Submitted', 4], ['Interview', 2], ['Selected', 1]].map(([l, v]) => (
          <div key={l} className="rounded-lg bg-slate-50 p-1.5 text-center">
            <p className="text-[13px] font-bold text-slate-900">{v}</p>
            <p className="text-[8px] text-slate-500">{l}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5 mt-3">
        {[['⚡ NEW SKILL FIT', 'Senior Java Developer', '92% Match'],
          ['✓ CANDIDATE SUBMITTED', 'Priya Sharma', 'Product Manager'],
          ['DIRECT APPLICANT', '3 New Applicants', 'UX Designer'],
          ['🔗 REFERRAL OPPORTUNITY', 'Aditya Mehta', 'Available · 2.5% Referral']].map(([tag, a, b]) => (
          <div key={tag} className="rounded-lg bg-orange-50 border border-orange-100 p-2">
            <p className="text-[8px] font-bold text-orange-700">{tag}</p>
            <p className="text-[11px] font-semibold text-slate-900 truncate">{a}</p>
            <p className="text-[9px] text-slate-500 truncate">{b}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── FAQ ───────────────────────────────────────────────────────────── */

const Faq = () => {
  const [open, setOpen] = useState(null);
  return (
    <div className="mt-8 space-y-2">
      {FAQS.map(([q, a], i) => (
        <div key={q} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="w-full flex items-center justify-between gap-3 text-left px-5 py-4 hover:bg-slate-50 transition"
          >
            <span className="text-[14px] font-semibold text-slate-900">{q}</span>
            <ChevronDown size={17}
              className={`flex-shrink-0 text-slate-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && (
            <p className="px-5 pb-4 text-[13px] text-slate-600 leading-relaxed">{a}</p>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── page ──────────────────────────────────────────────────────────── */

export default function RecruiterLanding() {
  const navigate = useNavigate();
  const register = () => navigate('/join');
  const login = () => navigate('/log_rec');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden" style={{ background: INK }}>
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
          <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-orange-500/40 text-orange-400 bg-orange-500/10">
                For Experienced Recruiters
              </span>
              <h1 className="mt-6 text-white font-bold leading-[1.1] text-[34px] sm:text-[46px]">
                Turn Your Recruitment Skills Into <span className="text-orange-500">Income</span>
              </h1>
              <p className="mt-5 text-slate-300 text-[15px] leading-relaxed max-w-xl">
                Access live hiring opportunities, source candidates, use powerful recruitment tools,
                and earn from successful placements and eligible referrals — all from one platform.
              </p>
              <p className="mt-3 text-[13px] text-slate-400">
                Built for recruiters with 2+ years of recruitment experience.
              </p>
              <p className="mt-5 font-semibold text-white">
                Find Opportunities. Source Candidates. Earn More.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Primary onClick={register}>Register as a Recruiter</Primary>
                <button onClick={login} className="text-sm font-semibold text-slate-300 hover:text-white underline underline-offset-4">
                  Already registered? Login
                </button>
              </div>
            </div>
            <HeroMock />
          </div>

          {/* Feature pills */}
          <div className="relative max-w-6xl mx-auto px-4 pb-14">
            <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {HERO_PILLS.map(([icon, title, body]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="text-xl">{icon}</div>
                  <p className="text-[13px] font-bold text-white mt-2">{title}</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <Section>
          <Eyebrow>More Than Just Recruitment Opportunities</Eyebrow>
          <H2>Everything You Need to Recruit. One Platform.</H2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {FEATURES.map(([icon, n, title, body, badge]) => (
              <div key={n} className="rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition relative">
                {badge && (
                  <span className="absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {badge}
                  </span>
                )}
                <div className="text-2xl">{icon}</div>
                <p className="text-[11px] font-bold mt-3" style={{ color: ORANGE }}>{n}</p>
                <h3 className="font-bold text-slate-900 mt-0.5">{title}</h3>
                <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Problem / replaced by */}
        <Section dark>
          <Eyebrow dark>Recruiting Shouldn&apos;t Be This Complicated</Eyebrow>
          <H2 dark>Spend More Time Recruiting. Less Time Chasing Opportunities.</H2>
          <Lead dark>
            Freelance recruitment often means finding requirements, searching multiple databases,
            managing candidates across different tools, chasing updates and repeatedly trying to
            understand changing hiring requirements. RecruiterV brings the recruitment workflow
            together in one platform so you can focus on what you do best — finding the right
            candidates.
          </Lead>
          <div className="grid lg:grid-cols-2 gap-6 mt-10">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex flex-wrap gap-2">
                {['Client Hunting', 'Emails', 'WhatsApp', 'Spreadsheets', 'Multiple Databases', 'Manual Follow-ups'].map(x => (
                  <span key={x} className="text-[12px] text-slate-400 line-through bg-white/5 px-3 py-1.5 rounded-lg">{x}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border p-6" style={{ borderColor: `${ORANGE}55`, background: 'rgba(242,140,40,0.08)' }}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-orange-400">Replaced by RecruiterV</p>
              <div className="mt-3"><Flow dark items={['Find', 'Understand', 'Source', 'Submit', 'Track', 'Earn']} /></div>
              <div className="flex flex-wrap gap-2 mt-4">
                {['Live Positions', 'Resume Bank', 'AI ATS', 'Voice Notes', 'Refer & Earn'].map(x => (
                  <span key={x} className="text-[11px] font-semibold text-white bg-white/10 px-3 py-1.5 rounded-full">{x}</span>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* How it works */}
        <Section style={{ background: '#F7F9FA' }} className="border-y border-slate-200">
          <H2 center>From Opportunity to Earning — In One Workflow</H2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {STEPS.map(([n, title, body]) => (
              <div key={n} className="rounded-2xl bg-white border border-slate-200 p-6">
                <span className="text-lg font-bold" style={{ color: ORANGE }}>{n}</span>
                <h3 className="font-bold text-slate-900 mt-1.5">{title}</h3>
                <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-9"><Primary onClick={register}>Start Recruiting</Primary></div>
        </Section>

        {/* Skill Fit */}
        <Section>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm order-2 lg:order-1">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: ORANGE }}>Skill Fit</p>
                <span className="text-[11px] text-slate-500">Matched for You</span>
              </div>
              <div className="space-y-2 mt-4">
                {SKILL_FIT.map(([t, m, pct]) => (
                  <div key={t} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 truncate">{t}</p>
                        <p className="text-[11px] text-slate-500">{m}</p>
                      </div>
                      <span className={`text-sm font-bold ${pct >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Eyebrow>Skill Fit</Eyebrow>
              <H2>Don&apos;t Search Every Position. Find the Ones That Fit You.</H2>
              <Lead>
                RecruiterV&apos;s Skill Fit helps you identify positions relevant to your recruitment
                expertise. Focus your time and sourcing efforts on opportunities where your
                experience and candidate network can make the biggest difference.
              </Lead>
              <div className="mt-7"><Primary onClick={register}>Explore Skill Fit</Primary></div>
            </div>
          </div>
        </Section>

        {/* Resume Bank */}
        <Section style={{ background: '#F7F9FA' }} className="border-y border-slate-200">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <Eyebrow>Free Resume Bank</Eyebrow>
              <H2>Your Network Is Powerful. Our Resume Bank Makes It Bigger.</H2>
              <Lead>
                Don&apos;t depend only on candidates already in your personal database. Access
                RecruiterV&apos;s Resume Bank at no additional access fee and discover potential
                candidates for the positions you are working on.
              </Lead>
              <div className="flex flex-wrap gap-2 mt-6">
                {['Expand Your Candidate Pipeline', 'Find Candidates for New Positions', 'Reduce Sourcing Time'].map(x => (
                  <span key={x} className="text-[12px] font-medium text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-xl">
                    <span className="text-emerald-600">✓</span> {x}
                  </span>
                ))}
              </div>
              <div className="mt-7"><Primary onClick={register}>Explore Resume Bank</Primary></div>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
              <div className="text-[13px] text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                🔍 Search candidates by skill, role, location…
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['Java', '5+ yrs', 'Mumbai', 'Full-time'].map(x => (
                  <span key={x} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700">{x} ×</span>
                ))}
              </div>
              <div className="space-y-2 mt-4">
                {BANK.map(([n, meta, skills]) => (
                  <div key={n} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900">{n}</p>
                        <p className="text-[11px] text-slate-500">{meta}</p>
                      </div>
                      <span className="text-[11px] font-bold" style={{ color: ORANGE }}>View</span>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {skills.map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{s}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* AI ATS */}
        <Section>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="rounded-2xl p-6 order-2 lg:order-1" style={{ background: INK }}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-orange-400">AI-Driven ATS — Candidate Pipeline</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
                {ATS_PIPELINE.map(([stage, people]) => (
                  <div key={stage} className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
                    <p className="text-[10px] font-bold text-white mb-1.5">{stage}</p>
                    {people.length ? people.map(p => (
                      <p key={p} className="text-[9px] text-slate-300 bg-white/5 rounded px-1.5 py-1 mb-1 truncate">{p}</p>
                    )) : <p className="text-[9px] text-slate-600 italic">Empty</p>}
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Eyebrow>Free AI-Driven ATS</Eyebrow>
              <p className="text-[13px] font-semibold text-slate-500">Recruit Smarter With AI</p>
              <H2>Your Recruitment Workflow. Organized in One Place.</H2>
              <Lead>
                RecruiterV provides registered recruiters with access to an AI-driven ATS to help
                manage their recruitment activity. Keep candidate information organized, manage your
                pipeline and reduce the need for scattered spreadsheets and manual tracking.
              </Lead>
              <div className="mt-7"><Primary onClick={register}>Start Recruiting Smarter</Primary></div>
            </div>
          </div>
        </Section>

        {/* Direct Applicant */}
        <Section style={{ background: '#FFF7ED' }} className="border-y border-orange-100">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <Eyebrow>Direct Applicant</Eyebrow>
              <H2>Let Candidates Come Directly to You</H2>
              <Lead>
                Your recruitment network extends beyond your existing candidate database. Share your
                Direct Applicant link and let candidates apply directly through it.
              </Lead>
              <div className="flex flex-wrap gap-2 mt-6">
                {[['LinkedIn', '#0A66C2'], ['WhatsApp', '#25D366'], ['Facebook', '#1877F2'], ['Your Network', '#64748B']].map(([n, c]) => (
                  <span key={n} className="text-[12px] font-semibold text-white px-3.5 py-2 rounded-xl" style={{ background: c }}>{n}</span>
                ))}
              </div>
              <p className="text-[13px] text-slate-600 mt-4 leading-relaxed">
                Turn your professional network and social media reach into an additional candidate
                sourcing channel.
              </p>
              <div className="mt-7"><Primary onClick={register}>Get Your Applicant Link</Primary></div>
            </div>
            <div className="rounded-2xl bg-white border border-orange-200 p-6 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Your Direct Applicant Link</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="flex-1 text-[12px] text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 truncate">
                  recruiterv.com/apply/your-link
                </span>
                <span className="text-[12px] font-bold text-white px-4 py-2.5 rounded-xl" style={{ background: ORANGE }}>Copy</span>
              </div>
              <div className="mt-5"><Flow items={['Share Position', 'Candidate Applies', 'Review Candidate', 'Submit', 'Track']} /></div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mt-6 mb-2">Recent Applicants (3 New)</p>
              {[['Kiran Shah', '2 hrs ago'], ['Anjali Verma', '5 hrs ago']].map(([n, t]) => (
                <div key={n} className="flex items-center justify-between py-1.5">
                  <span className="text-[13px] text-slate-700">{n}</span>
                  <span className="text-[11px] text-slate-400">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Voice Notes */}
        <Section dark>
          <Eyebrow dark>Voice Notes</Eyebrow>
          <H2 dark>Listen. Understand. Source Better.</H2>
          <Lead dark>
            Recruitment requirements can involve many details — must-have skills, candidate
            expectations, location, compensation, hiring priorities and sourcing guidance.
            RecruiterV&apos;s Voice Note feature allows Coaches and authorized users to communicate
            important information quickly and clearly.
          </Lead>
          <div className="grid lg:grid-cols-2 gap-8 items-start mt-10">
            <div className="grid sm:grid-cols-2 gap-3">
              {VOICE_BENEFITS.map(([icon, title, body]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-xl">{icon}</div>
                  <h3 className="font-bold text-white mt-2 text-[14px]">{title}</h3>
                  <p className="text-[12px] text-slate-400 mt-1.5 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-[10px] uppercase tracking-[0.18em] text-orange-400">Coach Briefing</p>
              <p className="font-bold text-white mt-1">Position Briefing</p>
              <p className="text-[12px] text-slate-400">Senior Java Developer · 02:14</p>
              <div className="h-1.5 bg-white/15 rounded-full mt-5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '35%', background: ORANGE }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                <span>00:47</span><span>02:14</span>
              </div>
              <div className="flex items-center justify-center gap-5 mt-4">
                <span className="text-slate-400">⏮</span>
                <span className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg" style={{ background: ORANGE }}>▶</span>
                <span className="text-slate-400">⏭</span>
              </div>
              <div className="mt-6 space-y-2">
                {[['Sourcing Guidance', '01:42'], ['Candidate Quality Brief', '00:58']].map(([t, d]) => (
                  <div key={t} className="flex items-center gap-3 rounded-xl bg-white/5 px-3.5 py-2.5">
                    <span className="text-orange-400 text-sm">▶</span>
                    <span className="text-[12px] text-slate-200 flex-1">{t}</span>
                    <span className="text-[11px] text-slate-500">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Refer & Earn */}
        <Section>
          <Eyebrow>Your Candidate Network Can Keep Working for You</Eyebrow>
          <H2>Don&apos;t Lose Value From Rejected Candidates</H2>
          <Lead>
            A candidate may not be right for the position you are currently working on — but they
            could be perfect for another opportunity.
          </Lead>

          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mt-10 mb-4">How it works</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REFER_STEPS.map(([n, title, body]) => (
              <div key={n} className="rounded-2xl border border-slate-200 p-5">
                <span className="text-base font-bold" style={{ color: ORANGE }}>{n}</span>
                <h3 className="font-bold text-slate-900 mt-1 text-[15px]">{title}</h3>
                <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="rounded-2xl p-6 text-center" style={{ background: '#FFF7ED', border: '1px solid #FDE4C8' }}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Referral Fee</p>
              <p className="text-5xl font-bold mt-1" style={{ color: ORANGE }}>2.5%</p>
              <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">
                of the recruitment revenue received by RecruiterV from the client
              </p>
            </div>
            <div className="rounded-2xl p-6 text-center" style={{ background: '#F7F9FA', border: '1px solid #E2E8F0' }}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Referral Validity</p>
              <p className="text-5xl font-bold text-slate-900 mt-1">90 <span className="text-2xl">Days</span></p>
              <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">
                Eligibility valid for 90 days from the applicable candidate upload/referral date,
                subject to RecruiterV&apos;s referral terms.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 mt-6">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Direct Applicant + Refer &amp; Earn</p>
            <h3 className="font-bold text-slate-900 mt-1 text-lg">Even Your Social Media Candidates Can Create Value</h3>
            <div className="mt-4">
              <Flow items={['You Post a RecruiterV Position', 'Candidate Applies Through Your Link', 'Candidate Enters RecruiterV',
                'Not Selected for Your Position', 'Another Recruiter Finds a Fit', 'Candidate Gets Hired', 'You Earn 2.5%']} />
            </div>
            <p className="text-[13px] text-slate-600 mt-4 leading-relaxed">
              Candidates who come through your eligible Direct Applicant link can also qualify for
              Refer &amp; Earn, subject to RecruiterV&apos;s applicable referral conditions.
            </p>
          </div>
        </Section>

        {/* Earnings */}
        <Section dark>
          <H2 dark center>Earn When You Place. Earn When You Refer.</H2>
          <div className="grid lg:grid-cols-2 gap-5 mt-10">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
              <p className="text-[10px] uppercase tracking-[0.18em] text-orange-400">Recruit &amp; Earn</p>
              <p className="text-5xl font-bold text-white mt-2">35%</p>
              <p className="text-[13px] text-slate-400">Revenue Share</p>
              <p className="text-[14px] text-slate-300 mt-4 leading-relaxed">
                Successfully place a candidate on an eligible position and receive 35% of the
                recruitment revenue received by RecruiterV from the client.
              </p>
              <div className="rounded-xl bg-white/5 p-4 mt-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Example</p>
                <p className="text-[13px] text-slate-300 mt-1.5">RecruiterV receives ₹1,00,000 from client</p>
                <p className="text-[15px] font-bold text-emerald-400 mt-1">Recruiter share (35%) = ₹35,000</p>
              </div>
              <p className="text-[11px] text-slate-500 mt-3">ⓘ Recruitment fee visible on each position</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
              <p className="text-[10px] uppercase tracking-[0.18em] text-orange-400">Refer &amp; Earn</p>
              <p className="text-5xl font-bold text-white mt-2">2.5%</p>
              <p className="text-[13px] text-slate-400">Referral Fee</p>
              <p className="text-[14px] text-slate-300 mt-4 leading-relaxed">
                If an eligible candidate originally uploaded/referred by you is successfully placed
                by another recruiter within the 90-day referral period, you can earn 2.5% of the
                recruitment revenue received by RecruiterV from the client.
              </p>
              <div className="rounded-xl bg-white/5 p-4 mt-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Example</p>
                <p className="text-[13px] text-slate-300 mt-1.5">RecruiterV receives ₹1,00,000 from client</p>
                <p className="text-[15px] font-bold text-emerald-400 mt-1">Referral fee (2.5%) = ₹2,500</p>
              </div>
            </div>
          </div>
          <p className="text-center text-white font-semibold mt-9">
            Your Candidates. Your Network. More Ways to Earn.
          </p>
        </Section>

        {/* Multiple positions */}
        <Section>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <H2>Work on Multiple Positions at the Same Time</H2>
              <Lead>
                RecruiterV gives you the flexibility to work on multiple positions simultaneously.
                Choose positions based on your recruitment expertise, candidate availability and
                sourcing capabilities.
              </Lead>
              <div className="flex flex-wrap gap-2 mt-6">
                {['Your recruitment expertise', 'Candidate availability', 'Your professional network', 'Skill Fit', 'Your sourcing capabilities'].map(x => (
                  <span key={x} className="text-[12px] font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">{x}</span>
                ))}
              </div>
              <div className="mt-6"><Flow items={['Open Positions', 'Assigned', 'Candidates', 'Submissions', 'Status']} /></div>
              <div className="mt-7"><Primary onClick={register}>Explore Open Positions</Primary></div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-slate-900">My Active Positions</p>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">6 Active</span>
              </div>
              <div className="space-y-2 mt-4">
                {ACTIVE_POSITIONS.map(([t, fn, n, st]) => (
                  <div key={t} className="flex items-center gap-2 rounded-xl border border-slate-100 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">{t}</p>
                      <p className="text-[11px] text-slate-500">{fn} · {n} candidates</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      st === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Ecosystem */}
        <Section style={{ background: '#F7F9FA' }} className="border-y border-slate-200">
          <H2 center>You Recruit. RecruiterV Supports You.</H2>
          <div className="grid sm:grid-cols-3 gap-4 mt-10">
            {[['RecruiterV Platform', ['Positions', 'Skill Fit', 'Resume Bank', 'AI ATS', 'Direct Applicant', 'Candidate Tracking', 'Reports']],
              ['Recruitment Coach', ['Position Briefings', 'Sourcing Guidance', 'Candidate Expectations', 'Voice Notes']],
              ['Client SPOC', ['Position Coordination', 'Hiring Updates', 'Recruitment Communication']]].map(([title, items]) => (
              <div key={title} className="rounded-2xl bg-white border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900">{title}</h3>
                <div className="mt-3 space-y-1.5">
                  {items.map(i => (
                    <p key={i} className="text-[13px] text-slate-600"><span className="text-emerald-600">✓</span> {i}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-6 mt-4 text-center" style={{ background: INK }}>
            <p className="text-[10px] uppercase tracking-[0.18em] text-orange-400">👤 Recruiter</p>
            <div className="flex justify-center mt-3"><Flow dark items={['Source', 'Screen', 'Submit', 'Track']} /></div>
          </div>
          <p className="text-center text-slate-600 italic mt-6 text-[15px]">
            &ldquo;The right information, tools and support to help you make better submissions.&rdquo;
          </p>
        </Section>

        {/* Sourcing channels */}
        <Section>
          <H2 center>More Ways to Find the Right Candidate</H2>
          <div className="grid sm:grid-cols-3 gap-5 mt-10">
            {SOURCES.map(([n, icon, title, body]) => (
              <div key={n} className="rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <span className="text-[11px] font-bold" style={{ color: ORANGE }}>{n}</span>
                </div>
                <h3 className="font-bold text-slate-900 mt-3">{title}</h3>
                <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-6 mt-5 flex flex-wrap items-center justify-between gap-4"
            style={{ background: '#FFF7ED', border: '1px solid #FDE4C8' }}>
            <div>
              <p className="font-bold text-slate-900">And if a candidate doesn&apos;t fit…</p>
              <p className="text-[13px] text-slate-600 mt-1">Refer them through RecruiterV and keep the opportunity alive.</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold" style={{ color: ORANGE }}>2.5%</p>
              <p className="text-[11px] text-slate-500">Refer &amp; Earn eligibility for 90 days</p>
            </div>
          </div>
        </Section>

        {/* Built for experienced recruiters */}
        <Section dark>
          <Eyebrow dark>Built for Experienced Recruiters</Eyebrow>
          <H2 dark>RecruiterV Is Built for Recruiters Who Know Recruiting.</H2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 mt-8">
            <p className="text-lg font-bold text-white">✓ Minimum 2 Years of Recruitment Experience</p>
            <p className="text-[13px] text-slate-400 mt-1">The core requirement for joining the RecruiterV platform</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {['Candidate sourcing', 'Candidate screening', 'Understanding job requirements', 'Recruitment processes', 'Evaluating candidates against job requirements'].map(x => (
                <span key={x} className="text-[12px] font-medium text-slate-200 bg-white/10 px-3 py-1.5 rounded-full">{x}</span>
              ))}
            </div>
          </div>
          <Lead dark>
            Whether you are an independent recruiter or an experienced recruiter looking for
            additional recruitment opportunities, RecruiterV gives you the platform, tools and
            ecosystem to put your recruitment skills to work.
          </Lead>
          <div className="mt-7"><Primary onClick={register}>Register as a Recruiter</Primary></div>
        </Section>

        {/* Comparison */}
        <Section>
          <H2 center>Leave Recruitment Chaos Behind</H2>
          <div className="rounded-2xl border border-slate-200 overflow-hidden mt-10">
            <div className="grid grid-cols-2 text-[11px] font-bold uppercase tracking-[0.14em]">
              <div className="px-5 py-3 bg-slate-100 text-slate-500">Traditional Recruitment</div>
              <div className="px-5 py-3 text-white" style={{ background: INK }}>With RecruiterV ✓</div>
            </div>
            {COMPARE.map(([a, b], i) => (
              <div key={a} className={`grid grid-cols-2 ${i % 2 ? 'bg-slate-50/60' : 'bg-white'}`}>
                <div className="px-5 py-3 text-[13px] text-slate-500 border-r border-slate-100">
                  <span className="text-red-400 mr-1.5">✗</span>{a}
                </div>
                <div className="px-5 py-3 text-[13px] font-medium text-slate-800">
                  <span className="text-emerald-600 mr-1.5">✓</span>{b}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Testimonials */}
        <Section style={{ background: '#F7F9FA' }} className="border-y border-slate-200">
          <H2 center>Built for Recruiters Who Want to Do More</H2>
          <p className="text-center text-[12px] text-slate-400 mt-2">
            Placeholders — to be replaced with genuine recruiter feedback
          </p>
          <div className="grid sm:grid-cols-3 gap-5 mt-10">
            {TESTIMONIALS.map(([topic, quote, name, meta]) => (
              <div key={name} className="rounded-2xl bg-white border border-slate-200 p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: ORANGE }}>{topic}</p>
                <p className="text-[14px] text-slate-700 leading-relaxed mt-3">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-2.5 mt-5 pt-4 border-t border-slate-100">
                  <span className="w-9 h-9 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">RP</span>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-900">{name}</p>
                    <p className="text-[11px] text-slate-500">{meta}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* FAQ */}
        <Section>
          <H2 center>Frequently Asked Questions</H2>
          <div className="max-w-3xl mx-auto"><Faq /></div>
        </Section>

        {/* Closing CTA */}
        <section className="px-4 py-16 sm:py-20" style={{ background: INK }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-white font-bold text-[28px] sm:text-[38px] leading-tight">
              You&apos;re Already a Recruiter. Now Recruit Smarter.
            </h2>
            <div className="flex flex-wrap justify-center gap-2 mt-7">
              {['Access live opportunities', 'Find more candidates', 'Use powerful recruitment tools',
                'Work with Coaches and Client SPOCs', 'Earn from successful placements',
                'Keep earning potential from eligible referrals'].map(x => (
                <span key={x} className="text-[12px] font-medium text-slate-200 bg-white/10 px-3 py-1.5 rounded-full">
                  <span className="text-emerald-400">✓</span> {x}
                </span>
              ))}
            </div>
            <div className="flex justify-center mt-8"><Primary onClick={register}>Register as a Recruiter</Primary></div>
            <p className="text-[12px] text-slate-500 mt-5">
              Minimum 2 years of recruitment experience required.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
