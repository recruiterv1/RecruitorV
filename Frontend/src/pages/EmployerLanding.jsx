import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Plus } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

// Marketing landing for employers, built to the RecruiterV employer design.
// The site Header and Footer are kept as they already are.
//
// Palette from the design: ink #263238, panel #243746, orange #F28C28,
// muted #687780 on an off-white #F7F9FA.

const INK = '#263238';
const PANEL = '#243746';
const ORANGE = '#F28C28';
const DEEP = '#1A2A36';   // the closing band, the darkest tone on the page

/* ── building blocks ───────────────────────────────────────────────── */

const Eyebrow = ({ children }) => (
  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-500 mb-3">{children}</p>
);

const H2 = ({ children, dark, center }) => (
  <h2 className={`font-bold leading-tight text-[27px] sm:text-[34px] ${center ? 'text-center' : ''} ${dark ? 'text-white' : 'text-slate-900'}`}>
    {children}
  </h2>
);

const Lead = ({ children, dark, center }) => (
  <p className={`mt-4 text-[15px] leading-relaxed max-w-2xl ${center ? 'mx-auto text-center' : ''} ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
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

const Secondary = ({ children, onClick, dark }) => (
  <button onClick={onClick}
    className={`px-7 py-3.5 rounded-xl font-semibold text-sm border transition ${
      dark ? 'border-white/30 text-white hover:bg-white/10'
           : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
    {children}
  </button>
);

// A stacked node in the two network diagrams.
const Node = ({ children, tone = 'panel', small }) => {
  const tones = {
    panel: { background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' },
    white: { background: '#fff', color: INK, border: '1px solid #fff' },
    orange: { background: ORANGE, color: '#fff', border: `1px solid ${ORANGE}` },
    light: { background: '#fff', color: INK, border: '1px solid #E2E8F0' },
    ink: { background: INK, color: '#fff', border: `1px solid ${INK}` },
  }[tone];
  return (
    <div className={`rounded-xl text-center font-semibold ${small ? 'text-[11px] px-2 py-2' : 'text-[13px] px-4 py-3'}`} style={tones}>
      {children}
    </div>
  );
};

const Down = ({ light }) => (
  <div className="flex justify-center py-1.5">
    <span className={light ? 'text-orange-400' : 'text-orange-500'}>↓</span>
  </div>
);

/* ── page data ─────────────────────────────────────────────────────── */

const PILLARS = [
  ['Experienced Recruiters', 'Source, screen and submit candidates for your open positions.'],
  ['Experienced Coaches', 'Guide recruiters on requirements, sourcing and candidate quality.'],
  ['RecruiterV Technology', 'Connect positions, recruiters, candidates and recruitment activity in one platform.'],
];

const STEPS = [
  ['01', 'Post', 'Share your hiring requirement.'],
  ['02', 'Connect', 'Your Client SPOC understands the requirement.'],
  ['03', 'Activate', 'Relevant recruiters start working on the position.'],
  ['04', 'Guide', 'Experienced Coaches support recruiters where required.'],
  ['05', 'Hire', 'Candidates move through your hiring process.'],
];

const FEEDBACK_LOOP = [
  'Employer Requirement', 'Client SPOC', 'Coach Guidance', 'Recruiter Sourcing',
  'Candidate Submission', 'Employer Feedback', 'Refined Search',
];

const PLATFORM = [
  ['📋', 'Position Management', 'Manage your open requirements.'],
  ['📊', 'Candidate Tracking', 'Follow candidates through the hiring process.'],
  ['🤖', 'AI-Driven ATS', 'Organize recruitment activity.'],
  ['🤝', 'Recruiter Network', 'Connect positions with relevant recruiters.'],
  ['🎙️', 'Voice Briefing', 'Share important hiring context.'],
  ['📈', 'Reports', 'Get visibility into recruitment activity.'],
];

const WHY = [
  ['Network', 'Multiple recruiters can work on your positions.'],
  ['Experience', 'Recruiters can work with experienced Coaches.'],
  ['Coordination', 'One Client SPOC manages the RecruiterV relationship.'],
  ['Visibility', 'Track positions, candidates and recruitment activity.'],
];

const FAQS = [
  ['How does RecruiterV help employers?', "RecruiterV connects your positions with a network of experienced recruiters who can work alongside experienced Coaches, with recruitment activity coordinated through your Client SPOC."],
  ['Do I need to coordinate with individual recruiters?', 'No. Your Client SPOC is your primary point of contact and coordinates the RecruiterV recruitment network for you.'],
  ['What does a Coach do?', 'A Coach is an experienced recruitment professional who guides recruiters on understanding positions, sourcing candidates and improving recruitment execution.'],
  ['Can multiple recruiters work on my position?', "Yes, depending on the position and RecruiterV's allocation process, multiple recruiters can work on a hiring requirement."],
  ['Can I track candidates?', 'Yes. RecruiterV provides visibility into candidate progress and recruitment activity.'],
  ['Can I manage multiple positions?', 'Yes. Employers can manage multiple hiring requirements through RecruiterV.'],
  ['How is the recruitment fee determined?', 'The applicable recruitment fee is communicated for each position.'],
];

/* ── FAQ ───────────────────────────────────────────────────────────── */

const Faq = () => {
  const [open, setOpen] = useState(null);
  return (
    <div className="mt-8 divide-y divide-slate-200 border-t border-slate-200">
      {FAQS.map(([q, a], i) => (
        <div key={q}>
          <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}
            className="w-full flex items-center justify-between gap-4 text-left py-4 hover:opacity-80">
            <span className="text-[15px] font-semibold text-slate-900">{q}</span>
            <Plus size={17} className={`flex-shrink-0 text-orange-500 transition-transform ${open === i ? 'rotate-45' : ''}`} />
          </button>
          {open === i && <p className="pb-4 text-[14px] text-slate-600 leading-relaxed max-w-3xl">{a}</p>}
        </div>
      ))}
    </div>
  );
};

/* ── page ──────────────────────────────────────────────────────────── */

export default function EmployerLanding() {
  const navigate = useNavigate();
  const post = () => navigate('/for-employer/post');
  // The site has no contact route, so this goes to the support address the
  // footer already publishes rather than to a dead page.
  const talk = () => { window.location.href = 'mailto:support@recruiterv.in?subject=Hiring%20with%20RecruiterV'; };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section style={{ background: '#F7F9FA' }} className="border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 grid lg:grid-cols-[1fr_320px] gap-12 items-center">
            <div>
              <Eyebrow>For Employers</Eyebrow>
              <h1 className="font-bold leading-[1.12] text-[34px] sm:text-[46px] text-slate-900 max-w-2xl">
                Your Position. An Experienced Recruitment Network Working to Close It.
              </h1>
              <p className="mt-6 text-slate-600 text-[15px] leading-relaxed max-w-xl">
                RecruiterV connects your hiring requirements with experienced recruiters working
                alongside highly experienced Coaches — all coordinated through one Client SPOC.
              </p>
              <p className="mt-7 inline-flex items-center gap-2.5 text-[13px] font-semibold text-slate-700 border border-slate-200 bg-white rounded-full px-4 py-2.5">
                <span style={{ color: ORANGE }}>✦</span>
                Experienced Recruiters + Experienced Coaches + One Client SPOC
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Primary onClick={post}>Post a Position</Primary>
                <Secondary onClick={talk}>Talk to RecruiterV</Secondary>
              </div>
              <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                One Network. One Hiring Objective.
              </p>
            </div>

            {/* The route a position takes, from posting to a hire */}
            <div className="rounded-2xl bg-white p-5 shadow-lg" style={{ border: '1px solid #E5EAED' }}>
              <div className="rounded-xl px-4 py-3 text-center" style={{ background: INK }}>
                <p className="text-[13px] font-semibold text-white">Your Position</p>
                <p className="text-[11px] text-slate-400">Senior Product Manager</p>
              </div>
              <Down />
              <Node tone="light">Client SPOC</Node>
              <Down />
              <Node tone="orange">RecruiterV</Node>
              <Down />
              <div className="rounded-xl px-4 py-3 text-center" style={{ background: '#fff', border: '1px solid #E5EAED' }}>
                <p className="text-[13px] font-semibold" style={{ color: INK }}>Coach</p>
                <p className="text-[11px] text-slate-500">Experienced Recruitment Leader</p>
              </div>
              <Down />
              <div className="grid grid-cols-4 gap-2">
                {['R1', 'R2', 'R3', 'R4'].map(r => <Node key={r} tone="light" small>{r}</Node>)}
              </div>
              <Down />
              <Node tone="light">Candidates</Node>
              <Down />
              <Node tone="orange">Successful Hire</Node>
            </div>
          </div>
        </section>

        {/* The three pillars */}
        <section className="px-4 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <Eyebrow>More Than a Recruiter Network</Eyebrow>
              <H2 center>Recruitment Expertise That Works Together</H2>
            </div>
            <div className="grid sm:grid-cols-3 gap-5 mt-10">
              {PILLARS.map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: ORANGE }}>{title}</h3>
                  <p className="text-[14px] text-slate-600 mt-2.5 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-[15px] font-semibold text-slate-900 text-center">
              You get the network. We manage the coordination.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-16 sm:py-20 border-y border-slate-200" style={{ background: '#F7F9FA' }}>
          <div className="max-w-6xl mx-auto">
            <Eyebrow>From Position to Hiring</Eyebrow>
            <H2>How It Works</H2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-10">
              {STEPS.map(([n, title, body]) => (
                <div key={n} className="rounded-2xl bg-white border border-slate-200 p-5">
                  <span className="text-lg font-bold" style={{ color: ORANGE }}>{n}</span>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-900 mt-1.5">{title}</h3>
                  <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* One position, multiple perspectives */}
        <section className="px-4 py-16 sm:py-20" style={{ background: PANEL }}>
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <H2 dark>One Position. Multiple Recruitment Perspectives.</H2>
              <Lead dark>
                Recruiters bring candidate reach. Coaches bring recruitment experience. RecruiterV
                brings them together.
              </Lead>
            </div>
            <div>
              <Node tone="orange">Your Position — Hiring Requirement</Node>
              <Down light />
              <Node>Client SPOC</Node>
              <Down light />
              <Node>Coach</Node>
              <Down light />
              <div className="grid grid-cols-4 gap-2">
                {['Recruiter 1', 'Recruiter 2', 'Recruiter 3', 'Recruiter 4'].map(r => (
                  <Node key={r} small>{r}</Node>
                ))}
              </div>
              <Down light />
              <Node>Candidates</Node>
              <Down light />
              <Node tone="white">Your Hire</Node>
            </div>
          </div>
        </section>

        {/* One point of contact */}
        <section className="px-4 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <Eyebrow>One Point of Contact</Eyebrow>
              <H2>You Focus on Hiring. Your Client SPOC Coordinates the Network.</H2>
              <Lead>
                You don&apos;t need to separately manage every recruiter or Coach working on your
                positions. Your Client SPOC coordinates communication, recruitment activity and
                candidate updates with you.
              </Lead>
              <div className="mt-6 space-y-2.5">
                {['Position Coordination', 'Candidate Updates', 'Recruitment Follow-Up'].map(x => (
                  <p key={x} className="flex items-center gap-2.5 text-[14px] text-slate-700">
                    <span className="h-5 w-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(242,140,40,0.15)', color: ORANGE }}>
                      <Check size={13} />
                    </span>
                    {x}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-6" style={{ background: '#F7F9FA', border: '1px solid #E2E8F0' }}>
              <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">You</p>
                <p className="text-[14px] font-semibold" style={{ color: INK }}>Employer</p>
              </div>
              <Down />
              <div className="rounded-xl px-4 py-3 text-center" style={{ background: PANEL }}>
                <p className="text-[10px] uppercase tracking-[0.16em] text-orange-400">Client SPOC</p>
                <p className="text-[14px] font-semibold text-white">Your Primary Contact</p>
              </div>
              <Down />
              <div className="grid grid-cols-2 gap-2">
                <Node tone="light">Coaches</Node>
                <Node tone="light">Recruiters</Node>
              </div>
              <Down />
              <Node tone="orange">Candidates → Hiring</Node>
            </div>
          </div>
        </section>

        {/* Feedback loop */}
        <section className="px-4 py-16 sm:py-20 border-y border-slate-200" style={{ background: '#F7F9FA' }}>
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <Eyebrow>Built for Better Alignment</Eyebrow>
              <H2>Your Feedback Can Improve the Search.</H2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {FEEDBACK_LOOP.map((s, i) => {
                const first = i === 0;
                const last = i === FEEDBACK_LOOP.length - 1;
                return (
                  <React.Fragment key={s}>
                    <span className="text-[12px] font-semibold px-3.5 py-2 rounded-lg"
                      style={first ? { background: INK, color: '#fff' }
                        : last ? { background: ORANGE, color: '#fff' }
                        : { background: '#fff', color: '#334155', border: '1px solid #E2E8F0' }}>
                      {s}
                    </span>
                    {!last && <span className="text-orange-500 text-sm">→</span>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </section>

        {/* Platform */}
        <section className="px-4 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto">
            <H2>Everything Connected on One Platform</H2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
              {PLATFORM.map(([icon, title, body]) => (
                <div key={title} className="rounded-2xl p-5" style={{ background: '#F7F9FA', border: '1px solid #E2E8F0' }}>
                  <div className="text-2xl">{icon}</div>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-900 mt-3">{title}</h3>
                  <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why employers choose RecruiterV */}
        <section className="px-4 py-16 sm:py-20" style={{ background: PANEL }}>
          <div className="max-w-6xl mx-auto">
            <H2 dark>Why Employers Choose RecruiterV</H2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
              {WHY.map(([title, body]) => (
                <div key={title} className="rounded-2xl p-5"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: ORANGE }}>{title}</h3>
                  <p className="text-[13px] text-slate-300 mt-2 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto">
            <H2>Frequently Asked Questions</H2>
            <Faq />
          </div>
        </section>

        {/* Closing */}
        <section className="px-4 py-16 sm:py-24" style={{ background: DEEP }}>
          <div className="max-w-3xl mx-auto text-center">
            <H2 dark center>Give Your Position the Power of a Recruitment Network.</H2>
            <p className="mt-4 text-[15px] text-slate-300">
              Experienced recruiters. Experienced Coaches. One Client SPOC.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Primary onClick={post}>Post Your Position</Primary>
              <Secondary dark onClick={talk}>Talk to RecruiterV</Secondary>
            </div>
            <p className="mt-12 text-[11px] font-bold uppercase tracking-[0.28em] text-orange-400">
              Hire Smarter · Earn Together
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
