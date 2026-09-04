import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

// Marketing landing for RecruiterV Coaches — experienced recruitment leaders who
// build and run a team of freelance recruiters. Built to the Coach design; the
// site Header and Footer are kept as they are.
//
// Palette from the design: navy #0D1B2A, orange #F97316, slate greys on #F8FAFC.

const NAVY = '#0D1B2A';
const ORANGE = '#F97316';
const HEAD = "'Manrope', system-ui, sans-serif";

/* ── building blocks ───────────────────────────────────────────────── */

const Eyebrow = ({ children, dark }) => (
  <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-3 ${dark ? 'text-orange-400' : 'text-orange-600'}`}>
    {children}
  </p>
);

const Section = ({ children, className = '', dark, style }) => (
  <section className={`px-4 py-16 sm:py-20 ${className}`} style={{ ...(dark ? { background: NAVY } : null), ...style }}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

const H2 = ({ children, dark, center }) => (
  <h2 className={`font-bold leading-tight text-[26px] sm:text-[34px] ${center ? 'text-center' : ''} ${dark ? 'text-white' : 'text-slate-900'}`}
    style={{ fontFamily: HEAD }}>
    {children}
  </h2>
);

const Lead = ({ children, dark, center }) => (
  <p className={`mt-4 text-[15px] leading-relaxed max-w-3xl ${center ? 'mx-auto text-center' : ''} ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
    {children}
  </p>
);

const Primary = ({ children, onClick }) => (
  <button onClick={onClick}
    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-95 transition"
    style={{ background: ORANGE }}>
    {children} <ArrowRight size={16} />
  </button>
);

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

// Numbered step cards, used by several sections.
const StepGrid = ({ steps, cols = 'lg:grid-cols-3', dark }) => (
  <div className={`grid sm:grid-cols-2 ${cols} gap-4 mt-8`}>
    {steps.map(([n, title, body]) => (
      <div key={n} className={`rounded-2xl p-5 ${dark ? 'border border-white/10 bg-white/[0.04]' : 'border border-slate-200'}`}>
        <span className="text-base font-bold" style={{ color: ORANGE, fontFamily: HEAD }}>{n}</span>
        <h3 className={`font-bold mt-1 text-[15px] ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        {body && <p className={`text-[13px] mt-1.5 leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{body}</p>}
      </div>
    ))}
  </div>
);

/* ── page data ─────────────────────────────────────────────────────── */

const PILLARS = [
  ['🏗️', 'Build', 'Build your own team of freelance recruiters from the RecruiterV network.'],
  ['🧭', 'Guide', "Use your experience to improve your team's sourcing and submission quality."],
  ['📊', 'Manage', 'Manage positions, candidates and team activity from one platform.'],
  ['💰', 'Earn', "Create earning opportunities through your team's placements, your own placements and eligible referrals."],
];

const DISCOVER = [
  ['01', 'Discover Recruiters'], ['02', 'Review Profiles'], ['03', 'Understand Experience'],
  ['04', 'Evaluate Fit'], ['05', 'Select Recruiters'], ['06', 'Build Your Team'],
];

const RECRUITERS = [
  ['P', 'Priya Sharma', '11 Years Experience', 'IT & Tech Recruitment', '32 Positions Worked', '89% Submission Quality'],
  ['R', 'Rahul Mehta', '7 Years Experience', 'BFSI & Finance', '18 Positions Worked', '82% Submission Quality'],
  ['A', 'Anita Roy', '9 Years Experience', 'Healthcare & Pharma', '24 Positions Worked', '91% Submission Quality'],
];

const TEAM_TOOLS = [
  ['Add Recruiters', 'Bring suitable freelance recruiters into your team.'],
  ['Manage Members', 'Manage your team as it evolves.'],
  ['View Activity', 'Understand what your recruiters are working on.'],
  ['Track Submissions', 'Monitor candidate submissions across your team.'],
  ['Track Progress', 'Follow candidates through the recruitment process.'],
  ['Review Performance', 'Identify where your team is performing and where support is needed.'],
];

const BRIEFING_ITEMS = [
  'Client Requirements', 'Must-Have Skills', 'Good-to-Have Skills', 'Ideal Candidate Profile',
  'Sourcing Guidance', 'Screening Guidance', 'Important Position Updates',
];

const VOICE_BENEFITS = [
  ['🎧', 'Faster Understanding', 'Recruiters can listen instead of reading lengthy explanations.'],
  ['🎯', 'Better Sourcing', 'Help recruiters understand exactly what candidates to look for.'],
  ['🧠', 'Consistent Guidance', 'Your entire team receives the same position briefing.'],
  ['⏱️', 'Save Time', 'Explain once instead of repeating the same conversation.'],
];

const QUALITY = [
  ['01', 'Understand', 'Client requirement'], ['02', 'Source', 'Right candidate'],
  ['03', 'Screen', 'Candidate suitability'], ['04', 'Submit', 'Quality candidate'],
  ['05', 'Review', 'Client feedback'], ['06', 'Improve', 'Future submissions'],
];

const EARNINGS = [
  ['01', "Your Team's Success", '10%', 'When a recruiter from your Coach team successfully places a candidate and the candidate joins:', 'You earn 10% of the recruitment revenue received by RecruiterV from the client.'],
  ['02', 'Your Own Success', '35%', 'When you personally work as a Recruiter and successfully place a candidate:', 'You earn 35% of the recruitment revenue received by RecruiterV from the client.'],
  ['03', 'Your Referred Resumes', '2.5%', 'When an eligible resume uploaded by you is successfully used/placed by another recruiter:', 'You can earn 2.5% of the recruitment revenue received by RecruiterV from the client.'],
];

const COACH_CAPS = ['Build Team', 'Review Recruiters', 'Assign Positions', 'Create Briefings', 'Guide Recruiters', 'Track Team Performance', 'Earn From Team Placements'];
const REC_CAPS = ['Work on Positions', 'Source Candidates', 'Submit Candidates', 'Use Resume Bank', 'Use AI ATS', 'Direct Applicant', 'Track Candidates', 'Earn From Own Placements'];

const TECH = [
  ['Live Positions', 'Access hiring opportunities available on RecruiterV.'],
  ['Skill Fit', 'Find relevant positions for your team.'],
  ['Resume Bank', 'Expand your candidate sourcing capabilities.'],
  ['AI-Driven ATS', 'Manage candidate pipelines intelligently.'],
  ['Direct Applicant', 'Receive candidates directly through your link.'],
  ['Voice Briefing', 'Communicate position requirements efficiently.'],
  ['Candidate Tracking', 'Monitor recruitment progress end-to-end.'],
  ['Reports', 'Understand team recruitment activity.'],
  ['Team Management', 'Build and manage your recruiter network.'],
];

const LEADERSHIP = [
  ['01', 'Recruitment Experience', 'You understand the realities of hiring.'],
  ['02', 'Team Management', 'You know how to manage and motivate recruiters.'],
  ['03', 'Client Understanding', 'You know what clients really expect.'],
  ['04', 'Candidate Judgement', 'You can identify quality candidates.'],
  ['05', 'Mentorship', 'You know how to make other recruiters better.'],
  ['06', 'Accountability', 'You take ownership of outcomes.'],
];

const HOW_IT_WORKS = [
  ['01', 'Register', 'Create your RecruiterV account.'],
  ['02', 'Share Your Experience', 'Provide your recruitment and team management experience.'],
  ['03', 'Coach Onboarding', 'Understand the RecruiterV Coach ecosystem and workflow.'],
  ['04', 'Discover Recruiters', 'Review freelance recruiter profiles available on RecruiterV.'],
  ['05', 'Build Your Team', 'Select recruiters who fit your requirements.'],
  ['06', 'Start Leading', 'Assign positions, brief recruiters and guide their recruitment activity.'],
  ['07', 'Drive Success', 'Help your team deliver successful hiring outcomes.'],
  ['08', 'Earn From Your Impact', 'Earn from team placements, own placements and eligible referrals.'],
];

const ROLE_COMPARE = [
  ['Focuses on own recruitment activity', 'Builds and manages a recruiter team'],
  ['Sources candidates', 'Guides recruiters'],
  ['Submits candidates', 'Improves team submissions'],
  ['Tracks own candidates', 'Tracks team activity'],
  ['Works on positions', 'Assigns and manages positions'],
  ['Uses recruitment tools', 'Uses recruitment + team tools'],
  ['Earns 35% on own successful placements', 'Earns 10% on eligible team placements'],
  ['Can earn eligible referral fees', 'Can earn eligible referral fees'],
  ['Min. 2 years recruitment experience', '12+ years recruitment + 5+ years team management'],
];

const FAQS = [
  ['What is RecruiterV?', 'RecruiterV is a recruitment platform that connects clients, recruiters and experienced recruitment leaders through technology, live hiring opportunities and a structured recruitment ecosystem.'],
  ['What is a RecruiterV Coach?', 'A RecruiterV Coach is an experienced recruitment professional who builds and manages a team of freelance recruiters, guides them on positions, improves submission quality and helps drive successful hiring outcomes.'],
  ['Who can become a RecruiterV Coach?', 'To become a Coach, you should have a minimum 12 years of recruitment experience and a minimum 5 years of team management experience.'],
  ['Why does RecruiterV require 12+ years of recruitment experience?', 'The Coach role requires substantial recruitment experience because Coaches are expected to guide recruiters, understand client requirements, assess candidate quality and provide practical recruitment direction.'],
  ['Can I work as a Recruiter as well as a Coach?', 'Yes. The Coach Login includes Recruiter capabilities. You can build and manage your team as a Coach and personally work on recruitment positions as a Recruiter.'],
  ['How can I build my team?', 'RecruiterV helps Coaches discover freelance recruiters on the platform. You can review available recruiter profiles, understand their experience and identify recruiters who may fit your team.'],
  ['How much does a Coach earn from a team placement?', 'When an eligible recruiter from your Coach team successfully places a candidate and the candidate joins, you receive 10% of the recruitment revenue received by RecruiterV from the client.'],
  ['How much can I earn if I personally place a candidate?', 'When you work as a Recruiter and personally make an eligible successful placement, you receive 35% of the recruitment revenue received by RecruiterV from the client.'],
  ['Can I earn from a resume that I upload?', 'Yes. If an eligible resume uploaded by you is subsequently used by another recruiter and results in a successful placement, you can receive 2.5% of the recruitment revenue received by RecruiterV from the client, subject to applicable referral terms.'],
  ['What is My Briefing?', 'My Briefing allows Coaches to create structured guidance for their team around a specific position, including client requirements, must-have skills, ideal candidate profile and sourcing guidance.'],
  ['What is Voice Briefing?', 'Voice Briefing allows Coaches to record an audio explanation of a position so that their team can listen to the requirements and sourcing guidance.'],
  ['Can I assign positions to my team?', 'Yes. Coaches can assign relevant positions to team members and monitor activity associated with those positions.'],
  ['How do I know the recruitment revenue for a position?', 'The applicable recruitment fee/revenue received by RecruiterV from the client is mentioned on each position, allowing you to understand the applicable earning opportunity before working on it.'],
  ['Can I create team groups?', 'Yes. Coaches can create team communication groups for coordination and recruitment discussions.'],
  ['Can I make announcements to my team?', 'Yes. Coaches can use announcements to communicate important updates, position changes, client feedback and sourcing instructions.'],
];

/* ── hero dashboard mock ───────────────────────────────────────────── */

const HeroMock = () => (
  <div className="rounded-2xl bg-white shadow-2xl overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-100">
      <p className="text-[13px] font-bold text-slate-900" style={{ fontFamily: HEAD }}>Coach Dashboard</p>
    </div>
    <div className="p-4">
      <div className="grid grid-cols-5 gap-2">
        {[['18', 'My Team'], ['24', 'Active Positions'], ['86', 'Candidates'], ['6', 'Joinings'], ['₹XX,XXX', 'Team Earnings']].map(([v, l]) => (
          <div key={l} className="rounded-xl bg-slate-50 p-2 text-center">
            <p className="text-[13px] font-bold text-slate-900 truncate">{v}</p>
            <p className="text-[8px] text-slate-500 leading-tight mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-3 mt-3">
        <span className="w-8 h-8 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">NR</span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-slate-900">New Recruiter</p>
          <p className="text-[10px] text-slate-500">8 Years · IT Recruitment</p>
        </div>
        <span className="text-[10px] font-bold" style={{ color: ORANGE }}>View Profile</span>
      </div>

      <div className="rounded-xl p-3 mt-2" style={{ background: NAVY }}>
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0" style={{ background: ORANGE }}>▶</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white truncate">Position Briefing — Senior Java Developer</p>
            <div className="h-1 bg-white/15 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: '40%', background: ORANGE }} />
            </div>
          </div>
          <span className="text-[10px] text-slate-400">02:14</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="rounded-xl border border-slate-100 p-2.5">
          <p className="text-[9px] uppercase tracking-wider text-slate-400">Team Performance</p>
          <p className="text-[10px] text-slate-600 mt-1">Submission Quality</p>
          <p className="text-lg font-bold text-emerald-600">92%</p>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2.5 flex items-center">
          <p className="text-[11px] font-semibold text-emerald-700">✓ Candidate Successfully Joined</p>
        </div>
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
          <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}
            className="w-full flex items-center justify-between gap-3 text-left px-5 py-4 hover:bg-slate-50 transition">
            <span className="text-[14px] font-semibold text-slate-900">{q}</span>
            <ChevronDown size={17} className={`flex-shrink-0 text-slate-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <p className="px-5 pb-4 text-[13px] text-slate-600 leading-relaxed">{a}</p>}
        </div>
      ))}
    </div>
  );
};

/* ── page ──────────────────────────────────────────────────────────── */

export default function MainCoach() {
  const navigate = useNavigate();
  const register = () => navigate('/join');
  const login = () => navigate('/log_rec');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden" style={{ background: NAVY }}>
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
          <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-orange-500/40 text-orange-400 bg-orange-500/10">
                For Experienced Recruitment Leaders
              </span>
              <h1 className="mt-6 text-white font-bold leading-[1.12] text-[32px] sm:text-[44px]" style={{ fontFamily: HEAD }}>
                Your Recruitment Experience Can Build More Than{' '}
                <span className="text-orange-500">Your Own Pipeline.</span>
              </h1>
              <p className="mt-5 text-slate-300 text-[15px] leading-relaxed max-w-xl">
                RecruiterV enables experienced recruitment leaders to build and manage a team of
                freelance recruiters, guide them on live hiring opportunities and earn from
                successful placements — while continuing to recruit independently.
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                {['12+ Years Recruitment Experience', '5+ Years Team Management Experience'].map(x => (
                  <span key={x} className="text-[12px] font-semibold text-slate-200 bg-white/10 px-3 py-1.5 rounded-full">
                    <span className="text-emerald-400">✓</span> {x}
                  </span>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Primary onClick={register}>Become a RecruiterV Coach</Primary>
                <button onClick={login} className="text-sm font-semibold text-slate-300 hover:text-white underline underline-offset-4">
                  Already registered? Login
                </button>
              </div>
              <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.28em] text-orange-400">
                Build. Coach. Recruit. Earn.
              </p>
            </div>
            <HeroMock />
          </div>
        </section>

        {/* Ecosystem */}
        <Section>
          <Eyebrow>Welcome to RecruiterV</Eyebrow>
          <H2>A Recruitment Platform Built Around Recruiters</H2>
          <Lead>
            RecruiterV connects clients, recruitment professionals, Coaches and technology through
            one recruitment ecosystem. Instead of working alone, experienced recruitment leaders can
            build teams of freelance recruiters, give them access to live opportunities, guide their
            work and create a more structured way to deliver hiring outcomes.
          </Lead>
          <div className="mt-8 overflow-x-auto">
            <div className="min-w-max"><Flow items={['Client', 'RecruiterV', 'Coach', 'Recruiter Team', 'Candidates', 'Successful Hiring']} /></div>
          </div>
        </Section>

        {/* Build / Guide / Manage / Earn */}
        <Section dark>
          <Eyebrow dark>For Recruitment Leaders</Eyebrow>
          <H2 dark>Turn Years of Recruitment Experience Into Team Impact</H2>
          <Lead dark>
            After years of recruiting and managing teams, you know that successful hiring is not just
            about finding candidates. RecruiterV gives you the platform to put that experience to
            work at scale.
          </Lead>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {PILLARS.map(([icon, title, body]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="text-2xl">{icon}</div>
                <h3 className="font-bold text-white mt-3 text-lg" style={{ fontFamily: HEAD }}>{title}</h3>
                <p className="text-[13px] text-slate-400 mt-2 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Eligibility */}
        <Section style={{ background: '#F8FAFC' }} className="border-y border-slate-200">
          <Eyebrow>Coach Eligibility</Eyebrow>
          <H2>Built for Recruitment Leaders, Not Beginners.</H2>
          <div className="grid lg:grid-cols-2 gap-8 items-center mt-8">
            <div className="grid grid-cols-2 gap-4">
              {[['12+', 'Years in Recruitment'], ['5+', 'Years in Team Management']].map(([v, l]) => (
                <div key={l} className="rounded-2xl bg-white border border-slate-200 p-6 text-center">
                  <p className="text-5xl font-bold" style={{ color: ORANGE, fontFamily: HEAD }}>{v}</p>
                  <p className="text-[12px] text-slate-600 mt-2">{l}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                RecruiterV Coaches are experienced recruitment professionals who understand both
                sides of hiring — finding the right candidates and building teams that can
                consistently deliver them.
              </p>
              <div className="mt-6"><Primary onClick={register}>Become a Coach</Primary></div>
            </div>
          </div>
        </Section>

        {/* Recruiter vs Coach leverage */}
        <Section>
          <H2 center>One Recruiter Can Make Placements.<br />A Great Coach Can Multiply Them.</H2>
          <Lead center>
            RecruiterV gives experienced recruitment leaders the ability to create leverage from
            their knowledge and team management experience.
          </Lead>
          <div className="grid sm:grid-cols-2 gap-5 mt-10">
            <div className="rounded-2xl border border-slate-200 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Recruiter</p>
              <div className="mt-4 space-y-2">
                {['Own Network', 'Own Candidates', 'Own Submissions', 'Own Placements'].map(x => (
                  <p key={x} className="text-[13px] text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{x}</p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-6" style={{ background: NAVY }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-400">Coach</p>
              <div className="mt-4 space-y-2">
                {['Recruiter Network', 'Build Team', 'Multiple Positions', 'Multiple Candidate Pipelines', 'Team Placements', 'Greater Recruitment Impact'].map(x => (
                  <p key={x} className="text-[13px] text-slate-200 bg-white/5 rounded-lg px-3 py-2">{x}</p>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Build your team */}
        <Section style={{ background: '#F8FAFC' }} className="border-y border-slate-200">
          <Eyebrow>Your Team Starts Here</Eyebrow>
          <H2>Build Your Team From RecruiterV&apos;s Recruiter Network</H2>
          <Lead>
            Finding good recruiters takes time. RecruiterV helps Coaches discover freelance
            recruiters already on the platform so they can review profiles, understand experience
            and identify people who may fit their team.
          </Lead>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
            {DISCOVER.map(([n, t]) => (
              <div key={n} className="rounded-xl bg-white border border-slate-200 p-4 text-center">
                <p className="text-sm font-bold" style={{ color: ORANGE, fontFamily: HEAD }}>{n}</p>
                <p className="text-[12px] font-semibold text-slate-800 mt-1 leading-tight">{t}</p>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-bold text-slate-900 mt-12" style={{ fontFamily: HEAD }}>
            Choose the Recruiters You Want on Your Team
          </h3>
          <p className="text-[14px] text-slate-600 mt-2">
            Build your team based on experience, capability and fit — not simply availability.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            {RECRUITERS.map(([i, name, exp, expertise, positions, perf]) => (
              <div key={name} className="rounded-2xl bg-white border border-slate-200 p-5">
                <div className="flex items-center gap-2.5">
                  <span className="w-10 h-10 rounded-full bg-slate-900 text-white text-sm font-bold flex items-center justify-center">{i}</span>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">{name}</p>
                    <p className="text-[11px] text-slate-500">{exp}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-[12px]">
                  {[['Expertise', expertise], ['Positions', positions], ['Performance', perf]].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">{l}</p>
                      <p className="text-slate-700">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={register} className="flex-1 text-[12px] font-semibold text-slate-700 border border-slate-300 rounded-lg py-2 hover:bg-slate-50">
                    View Profile
                  </button>
                  <button onClick={register} className="flex-1 text-[12px] font-bold text-white rounded-lg py-2" style={{ background: ORANGE }}>
                    Add to Team
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Team management */}
        <Section>
          <H2 center>Your Team. Your Structure. Your Leadership.</H2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {TEAM_TOOLS.map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-6">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: ORANGE }}>{title}</h3>
                <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-bold text-slate-900 mt-14" style={{ fontFamily: HEAD }}>
            Give Your Team the Right Opportunities
          </h3>
          <div className="flex flex-wrap gap-2 mt-5">
            {['View Open Positions', 'Review Job Descriptions', 'Assign Positions', 'Brief Recruiters',
              'Monitor Candidate Submissions', 'Track Candidate Progress', 'Drive Hiring Outcomes'].map(x => (
              <span key={x} className="text-[12px] font-medium text-slate-700 bg-slate-100 px-3 py-2 rounded-xl">{x}</span>
            ))}
          </div>
          <div className="mt-6 overflow-x-auto">
            <div className="min-w-max">
              <Flow items={['Position', 'Coach', 'Recruiter Team', 'Candidate Sourcing', 'Submission', 'Interview', 'Joining']} />
            </div>
          </div>
        </Section>

        {/* My Briefing */}
        <Section dark>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <H2 dark>Brief Your Team Once. Keep Everyone Aligned.</H2>
              <p className="mt-4 text-[15px] text-slate-300 leading-relaxed">
                Great recruiters perform better when they clearly understand what the client
                actually wants.
              </p>
              <p className="mt-3 text-[15px] text-slate-300 leading-relaxed">
                Use My Briefing to capture the important details of a position so your team knows
                exactly what to look for before they start sourcing.
              </p>
              <div className="mt-7"><Primary onClick={register}>Create a Briefing</Primary></div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-[10px] uppercase tracking-[0.18em] text-orange-400">My Briefing</p>
              <p className="font-bold text-white mt-1">Senior Java Developer</p>
              <div className="mt-4 space-y-2">
                {BRIEFING_ITEMS.map(x => (
                  <p key={x} className="text-[13px] text-slate-200 bg-white/5 rounded-lg px-3.5 py-2.5">
                    <span className="text-orange-400 mr-1.5">•</span>{x}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Voice briefing */}
        <Section>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="rounded-2xl p-7 order-2 lg:order-1" style={{ background: NAVY }}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-orange-400">Coach Voice Briefing</p>
              <p className="font-bold text-white mt-1.5">Position Briefing</p>
              <div className="flex items-center gap-4 mt-6">
                <span className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0" style={{ background: ORANGE }}>▶</span>
                <div className="flex-1">
                  <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: '0%', background: ORANGE }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-2"><span>00:00</span><span>02:14</span></div>
                </div>
              </div>
              <div className="flex items-end gap-1 h-12 mt-6">
                {[30, 55, 80, 45, 95, 60, 35, 70, 90, 50, 25, 65, 85, 40, 75, 30, 60, 45, 20, 55].map((h, i) => (
                  <span key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: 'rgba(255,255,255,0.15)' }} />
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <H2>Your Experience. Your Voice. Your Team.</H2>
              <p className="mt-4 text-[15px] text-slate-600 leading-relaxed">
                Some recruitment requirements are easier to explain than to write.
              </p>
              <p className="mt-3 text-[15px] text-slate-600 leading-relaxed">
                Record a Voice Briefing and give your team a clear understanding of the position,
                sourcing priorities and candidate expectations.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                {VOICE_BENEFITS.map(([icon, title, body]) => (
                  <div key={title} className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-xl">{icon}</div>
                    <h3 className="font-bold text-slate-900 mt-2 text-[14px]">{title}</h3>
                    <p className="text-[12px] text-slate-600 mt-1.5 leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Announcements / groups */}
        <Section style={{ background: '#F8FAFC' }} className="border-y border-slate-200">
          <H2 center>Keep Your Team Aligned</H2>
          <div className="grid lg:grid-cols-2 gap-5 mt-10">
            <div className="rounded-2xl bg-white border border-slate-200 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: ORANGE }}>Announcements</p>
              <p className="text-[14px] text-slate-600 mt-2 leading-relaxed">
                Share client updates, position changes, hiring priorities and sourcing instructions
                with your entire team.
              </p>
              <div className="rounded-xl bg-orange-50 border border-orange-100 p-4 mt-4">
                <p className="text-[11px] font-bold text-orange-700">Coach Announcement</p>
                <p className="text-[13px] text-slate-700 mt-1 leading-relaxed">
                  Important update: Client has revised the candidate requirement for the Senior Java
                  Developer position.
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: ORANGE }}>Team Groups</p>
              <p className="text-[14px] text-slate-600 mt-2 leading-relaxed">
                Create team groups for quick communication and position coordination among your
                recruiters.
              </p>
              <div className="flex -space-x-2 mt-5">
                {['P', 'R', 'A', 'S', 'K'].map(i => (
                  <span key={i} className="w-9 h-9 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white">{i}</span>
                ))}
                <span className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center ring-2 ring-white">+13</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Submission quality */}
        <Section>
          <H2 center>Don&apos;t Just Increase Submissions. Improve Them.</H2>
          <Lead center>
            Your role as a Coach is not simply to increase the number of candidates submitted. It is
            to help your team understand what makes a candidate relevant.
          </Lead>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {QUALITY.map(([n, title, body]) => (
              <div key={n} className="rounded-2xl border border-slate-200 p-5">
                <span className="text-base font-bold" style={{ color: ORANGE, fontFamily: HEAD }}>{n}</span>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-900 mt-1">{title}</h3>
                <p className="text-[13px] text-slate-600 mt-1.5">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Earnings */}
        <Section dark>
          <Eyebrow dark>Earnings</Eyebrow>
          <H2 dark>Three Ways to Create Earning Opportunities</H2>
          <div className="grid lg:grid-cols-3 gap-5 mt-10">
            {EARNINGS.map(([n, title, pct, when, what]) => (
              <div key={n} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <p className="text-[11px] font-bold" style={{ color: ORANGE }}>{n}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 mt-1">{title}</p>
                <p className="text-5xl font-bold text-white mt-3" style={{ fontFamily: HEAD }}>{pct}</p>
                <p className="text-[13px] text-slate-400 mt-4 leading-relaxed">{when}</p>
                <p className="text-[13px] text-slate-200 mt-2 leading-relaxed">{what}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-4">Subject to applicable RecruiterV referral terms.</p>

          <h3 className="text-xl font-bold text-white mt-14 text-center" style={{ fontFamily: HEAD }}>
            When Your Team Succeeds, You Earn.
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            {[['Client', 'Recruitment Revenue', '₹1,00,000'], ['RecruiterV', 'Receives', '₹1,00,000'],
              ['Coach — Team Placement Share', '10%', '₹10,000']].map(([a, b, c], i) => (
              <div key={a} className={`rounded-2xl p-5 text-center ${i === 2 ? 'border border-orange-500/40 bg-orange-500/10' : 'border border-white/10 bg-white/[0.04]'}`}>
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{a}</p>
                <p className="text-[12px] text-slate-400 mt-1">{b}</p>
                <p className={`text-2xl font-bold mt-1 ${i === 2 ? 'text-orange-400' : 'text-white'}`} style={{ fontFamily: HEAD }}>{c}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-4 text-center">
            Subject to applicable terms. Recruitment fee is mentioned on each position.
          </p>
        </Section>

        {/* Coach by role, recruiter by choice */}
        <Section>
          <H2 center>Coach by Role. Recruiter by Choice.</H2>
          <Lead center>
            Your Coach account does not stop you from recruiting. When you personally place a
            candidate, you receive the full Recruiter revenue share.
          </Lead>
          <div className="flex justify-center mt-8 overflow-x-auto">
            <div className="min-w-max">
              <Flow items={['Coach', 'Self-Assign Position', 'Source Candidate', 'Submit', 'Candidate Joins', '35% Recruiter Share']} />
            </div>
          </div>
          <p className="text-[12px] text-slate-500 mt-5 text-center">
            The applicable recruitment fee/revenue received by RecruiterV from the client is
            mentioned on each position.
          </p>

          <h3 className="text-xl font-bold text-slate-900 mt-14 text-center" style={{ fontFamily: HEAD }}>
            Coach + Recruiter in One Platform
          </h3>
          <p className="text-center text-[14px] text-slate-600 mt-1">One Login. Multiple Opportunities.</p>
          <div className="grid sm:grid-cols-2 gap-5 mt-8">
            {[['Coach', COACH_CAPS], ['Recruiter', REC_CAPS]].map(([title, caps]) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: ORANGE }}>{title}</p>
                <div className="mt-3 space-y-1.5">
                  {caps.map(c => <p key={c} className="text-[13px] text-slate-600"><span className="text-emerald-600">✓</span> {c}</p>)}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center font-semibold text-slate-900 mt-8">
            Lead Your Team When You Want. Recruit Yourself When You Want.
          </p>
        </Section>

        {/* Technology */}
        <Section style={{ background: '#F8FAFC' }} className="border-y border-slate-200">
          <Eyebrow>RecruiterV Technology</Eyebrow>
          <H2>Your Team Gets More Than Positions</H2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {TECH.map(([title, body]) => (
              <div key={title} className="rounded-2xl bg-white border border-slate-200 p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: ORANGE }}>{title}</h3>
                <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Leadership qualities */}
        <Section>
          <H2 center>Experience Gets You Here. Leadership Takes You Further.</H2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {LEADERSHIP.map(([n, title, body]) => (
              <div key={n} className="rounded-2xl border border-slate-200 p-5">
                <span className="text-base font-bold" style={{ color: ORANGE, fontFamily: HEAD }}>{n}</span>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-900 mt-1">{title}</h3>
                <p className="text-[13px] text-slate-600 mt-1.5">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Eligibility check */}
        <Section dark>
          <H2 dark center>Is RecruiterV Coach Right for You?</H2>
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-orange-400 mt-6">
            Minimum Requirements
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center min-w-[180px]">
              <p className="text-4xl font-bold text-white" style={{ fontFamily: HEAD }}>12+ <span className="text-lg">Years</span></p>
              <p className="text-[12px] text-slate-400 mt-1">Recruitment Experience</p>
            </div>
            <span className="text-[12px] font-bold text-orange-400">AND</span>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center min-w-[180px]">
              <p className="text-4xl font-bold text-white" style={{ fontFamily: HEAD }}>5+ <span className="text-lg">Years</span></p>
              <p className="text-[12px] text-slate-400 mt-1">Team Management</p>
            </div>
          </div>
          <Lead dark center>
            RecruiterV Coach is designed for experienced recruitment professionals who have
            demonstrated both deep recruitment experience and meaningful team management experience.
          </Lead>
          <div className="flex justify-center mt-8">
            <Primary onClick={register}>I Meet the Criteria — Become a Coach</Primary>
          </div>
        </Section>

        {/* How it works */}
        <Section>
          <Eyebrow>How It Works</Eyebrow>
          <H2>From Recruitment Leader to RecruiterV Coach</H2>
          <StepGrid steps={HOW_IT_WORKS} cols="lg:grid-cols-4" />
        </Section>

        {/* Role comparison */}
        <Section style={{ background: '#F8FAFC' }} className="border-y border-slate-200">
          <H2 center>Which RecruiterV Role Is Right for You?</H2>
          <div className="rounded-2xl border border-slate-200 overflow-hidden mt-10 bg-white">
            <div className="grid grid-cols-2 text-[11px] font-bold uppercase tracking-[0.14em]">
              <div className="px-5 py-3 bg-slate-100 text-slate-500">Recruiter</div>
              <div className="px-5 py-3 text-white" style={{ background: NAVY }}>Coach</div>
            </div>
            {ROLE_COMPARE.map(([a, b], i) => (
              <div key={a + b} className={`grid grid-cols-2 ${i % 2 ? 'bg-slate-50/60' : 'bg-white'}`}>
                <div className="px-5 py-3 text-[13px] text-slate-600 border-r border-slate-100">{a}</div>
                <div className="px-5 py-3 text-[13px] font-medium text-slate-800">{b}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-[14px] text-slate-600 mt-6">
            <span className="font-semibold text-slate-900">Already an experienced recruiter?</span>{' '}
            Coach Login lets you continue recruiting while building your team.
          </p>
        </Section>

        {/* FAQ */}
        <Section>
          <Eyebrow>FAQs</Eyebrow>
          <H2 center>Frequently Asked Questions</H2>
          <div className="max-w-3xl mx-auto"><Faq /></div>
        </Section>

        {/* Closing */}
        <section className="px-4 py-16 sm:py-20" style={{ background: NAVY }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-white font-bold text-[26px] sm:text-[36px] leading-tight" style={{ fontFamily: HEAD }}>
              Your Experience Has Already Built Teams.
            </h2>
            <p className="text-orange-500 font-bold text-[22px] sm:text-[28px] mt-2" style={{ fontFamily: HEAD }}>
              Now Build Your Next Recruitment Network With RecruiterV.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {['Build a team of freelance recruiters.', 'Give them access to opportunities.',
                'Guide them with your experience.', 'Continue recruiting yourself.',
                'Earn from successful hiring.'].map(x => (
                <span key={x} className="text-[12px] font-medium text-slate-200 bg-white/10 px-3 py-1.5 rounded-full">
                  <span className="text-emerald-400">✓</span> {x}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['12+ Years Recruitment Experience', '5+ Years Team Management'].map(x => (
                <span key={x} className="text-[12px] font-semibold text-orange-300 border border-orange-500/30 px-3 py-1.5 rounded-full">{x}</span>
              ))}
            </div>
            <div className="flex flex-wrap justify-center items-center gap-3 mt-8">
              <Primary onClick={register}>Become a RecruiterV Coach</Primary>
              <button onClick={login} className="text-sm font-semibold text-slate-300 hover:text-white underline underline-offset-4">
                Already registered? Login →
              </button>
            </div>
            <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.28em] text-orange-400">
              Build. Coach. Recruit. Earn.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
