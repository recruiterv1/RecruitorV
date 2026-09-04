import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, CheckCircle2, Award, RefreshCw } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

// The page someone lands on before taking the eligibility assessment. It sets
// out what the assessment is, the two tracks, and — importantly — that every
// score has a path, so nobody is simply told no.
//
// Rendered in the site's light theme rather than the dark comp, to sit with the
// other public pages.

const INK = '#0F1D3C';
const ORANGE = '#F47B20';

const Eyebrow = ({ children, dark }) => (
  <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-3 ${dark ? 'text-orange-400' : 'text-orange-600'}`}>
    {children}
  </p>
);

const H2 = ({ children, dark }) => (
  <h2 className={`font-bold leading-tight text-[27px] sm:text-[34px] ${dark ? 'text-white' : 'text-slate-900'}`}>
    {children}
  </h2>
);

const Section = ({ children, className = '', style, dark, id }) => (
  <section id={id} className={`px-4 py-16 sm:py-20 ${className}`} style={{ ...(dark ? { background: INK } : null), ...style }}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

const TRACKS = [
  ['Recruiter', 'Recruiter Track', '2+ years recruiting experience',
   ['Sourcing under time pressure', 'Client requirement interpretation', 'Pipeline judgment']],
  ['Coach', 'Coach Track', '12–25 yrs experience · 5–15 yrs managing teams',
   ['Team management & mentoring', 'Escalation & client judgment', 'Coaching scenario walkthroughs']],
];

const STEPS = [
  ['01', 'Apply & pick a track', 'Choose Recruiter or Coach and submit your details.', '5 min'],
  ['02', 'Take the assessment', '20 scenario-based questions, real-world calls, one sitting.', '10 min'],
  ['03', 'Get your scorecard', 'Your result, tier placement and breakdown land immediately.', 'Instant'],
  ['04', 'Start working', 'Certified recruiters receive their first requisition the same week.', 'Same week'],
];

// The three outcomes, in the platform's own words.
const TIERS = [
  {
    band: '80–100', name: 'Certified', tone: 'green', icon: Award,
    body: 'Full access. Requisitions assigned immediately, standard revenue share applies from day one.',
  },
  {
    band: '50–79', name: 'Conditional', tone: 'amber', icon: Clock,
    body: "You're live on a probationary pipeline, capped at 4 active positions. A retake window opens after 1 month to move up.",
  },
  {
    band: 'Below 50', name: 'Not Yet Qualified', tone: 'slate', icon: RefreshCw,
    body: 'Not a rejection — a retake window opens after 90 days. Your scorecard lands by email with exactly what to work on first.',
  },
];

const REWARDS = [
  ['35%', 'Base revenue share of client billing'],
  ['+5%', 'Seasonal incentive on top of base'],
  ['2.5%', 'Referral share when your sourced resume gets placed'],
  ['1', 'Community: dedicated group from day one'],
];

export default function JoinAssessment() {
  const navigate = useNavigate();
  const start = () => navigate('/check-eligibility');
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 py-16 sm:py-24 border-b border-slate-200" style={{ background: '#F7F9FA' }}>
          <div className="max-w-6xl mx-auto">
            <Eyebrow>RecruiterV · Join as a Recruiter or Coach</Eyebrow>
            <h1 className="font-bold leading-[1.1] text-[34px] sm:text-[50px] text-slate-900 max-w-3xl">
              Recruiting is a skill.<br />
              <span className="text-slate-400">Prove yours before you place anyone&apos;s.</span>
            </h1>
            <p className="mt-6 text-[15px] sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              A 10-minute, 20-question scored assessment built from real sourcing, screening and
              client scenarios. Clear it and you&apos;re live on the platform within days.
            </p>

            <div className="grid sm:grid-cols-3 gap-0 mt-10 rounded-2xl border border-slate-200 bg-white overflow-hidden max-w-3xl">
              {[['35%', 'Base revenue share'], ['10', 'Minutes · 20 questions'], ['3', 'Outcome tiers, no dead ends']]
                .map(([v, l], i) => (
                <div key={l} className={`p-6 ${i ? 'border-t sm:border-t-0 sm:border-l border-slate-200' : ''}`}>
                  <p className="text-3xl font-bold" style={{ color: ORANGE }}>{v}</p>
                  <p className="text-[12px] text-slate-500 mt-1">{l}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-9">
              <button onClick={start}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-95 transition"
                style={{ background: ORANGE }}>
                Start the assessment <ArrowRight size={16} />
              </button>
              <button onClick={() => jump('tracks')}
                className="px-7 py-3.5 rounded-xl font-semibold text-sm border border-slate-300 text-slate-700 hover:bg-white transition">
                See both tracks
              </button>
            </div>
          </div>
        </section>

        {/* Two tracks */}
        <Section id="tracks">
          <H2>Two tracks. One bar.</H2>
          <p className="mt-3 text-[15px] text-slate-600">Choose your path — the standard is the same.</p>
          <div className="grid md:grid-cols-2 gap-5 mt-10">
            {TRACKS.map(([tag, title, req, points], i) => (
              <div key={tag}
                className="rounded-2xl border p-7 hover:shadow-lg transition"
                style={{ borderColor: i === 0 ? ORANGE : '#E2E8F0' }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: ORANGE }}>{tag}</p>
                <h3 className="text-xl font-bold text-slate-900 mt-2">{title}</h3>
                <p className="text-[13px] mt-1.5" style={{ color: ORANGE }}>{req}</p>
                <div className="mt-5 space-y-2.5">
                  {points.map(p => (
                    <p key={p} className="text-[14px] text-slate-600 flex gap-3">
                      <span className="text-slate-300">—</span>{p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* How you get in */}
        <Section style={{ background: '#F7F9FA' }} className="border-y border-slate-200">
          <H2>How you get in</H2>
          <p className="mt-3 text-[15px] text-slate-600">Four steps from application to your first placement.</p>
          <div className="mt-10 space-y-3">
            {STEPS.map(([n, title, body, time]) => (
              <div key={n} className="rounded-2xl bg-white border border-slate-200 p-5 flex items-center gap-5 flex-wrap">
                <span className="text-xl font-bold text-slate-300 w-8 flex-shrink-0">{n}</span>
                <div className="flex-1 min-w-[220px]">
                  <p className="font-bold text-slate-900">{title}</p>
                  <p className="text-[13px] text-slate-600 mt-0.5">{body}</p>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(244,123,32,0.12)', color: ORANGE }}>
                  {time}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* The assessment */}
        <Section>
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <Eyebrow>The assessment</Eyebrow>
              <H2>One sitting. No textbook theory.</H2>
              <p className="mt-5 text-[15px] text-slate-600 leading-relaxed">
                20 questions, 10 minutes, one sitting. Every question is a real-world call — a
                sourcing decision, a shortlist judgment, an escalation — not textbook theory. The
                clock keeps it honest.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[['20', 'Scenario questions'], ['10', 'Minutes on the clock'], ['1', 'Sitting, no pausing']]
                .map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-slate-200 p-5 text-center">
                  <p className="text-3xl font-bold text-slate-900">{v}</p>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Where you can land */}
        <Section dark>
          <Eyebrow dark>Where you can land</Eyebrow>
          <H2 dark>Every score gets a path. Nobody is just told no.</H2>
          <div className="grid md:grid-cols-3 gap-5 mt-10">
            {TIERS.map(t => {
              const tone = {
                green: { bg: 'rgba(16,185,129,0.12)', br: 'rgba(16,185,129,0.35)', fg: '#6EE7B7' },
                amber: { bg: 'rgba(244,123,32,0.12)', br: 'rgba(244,123,32,0.35)', fg: '#FBBF77' },
                slate: { bg: 'rgba(255,255,255,0.06)', br: 'rgba(255,255,255,0.14)', fg: '#CBD5E1' },
              }[t.tone];
              return (
                <div key={t.name} className="rounded-2xl p-6"
                  style={{ background: tone.bg, border: `1px solid ${tone.br}` }}>
                  <div className="flex items-center gap-2.5">
                    <t.icon size={17} style={{ color: tone.fg }} />
                    <span className="text-[13px] font-bold" style={{ color: tone.fg }}>{t.band}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-3">{t.name}</h3>
                  <p className="text-[13.5px] text-slate-300 mt-2.5 leading-relaxed">{t.body}</p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* What clearing it gets you */}
        <Section style={{ background: '#F7F9FA' }} className="border-y border-slate-200">
          <H2>What clearing it gets you</H2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {REWARDS.map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-white border border-slate-200 p-6">
                <p className="text-3xl font-bold" style={{ color: ORANGE }}>{v}</p>
                <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">{l}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Closing */}
        <Section>
          <div className="max-w-3xl mx-auto text-center">
            <H2>Your scorecard is 10 minutes away.</H2>
            <p className="mt-4 text-[15px] text-slate-600 leading-relaxed">
              Pick your track, take the 20-question assessment, see exactly where you stand. If you
              clear it, you&apos;re placing candidates this week.
            </p>
            <button onClick={start}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-95 transition mt-8"
              style={{ background: ORANGE }}>
              Start the assessment <ArrowRight size={16} />
            </button>
            <p className="flex items-center justify-center gap-1.5 text-[12px] text-slate-400 mt-4">
              <CheckCircle2 size={13} className="text-green-500" /> No cost to take the assessment.
            </p>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
