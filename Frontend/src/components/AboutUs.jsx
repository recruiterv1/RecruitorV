import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Header from '../pages/Header';
import Footer from '../pages/Footer';

// About RecruiterV, built to the About design. The site Header and Footer are
// kept as they already are.
//
// Palette from the design: ink #263238, panel #243746, orange #F28C28,
// off-white #F7F9FA, hairline #E5EAED. DM Serif Display for the display
// headings, Outfit for everything else.

const INK = '#263238';
const PANEL = '#243746';
const ORANGE = '#F28C28';
const SERIF = "'DM Serif Display', Georgia, serif";
const SANS = "'Outfit', system-ui, sans-serif";

const FOUNDER_IMG = '/founder-roshan-kumar-rawat.jpg';
const HERO_IMG = '/about-hero.jpg';

// The design's own in-page nav. It sits under the site header and jumps
// between sections — it does not replace the site navigation.
const SECTION_NAV = [
  ['why', 'Why RecruiterV'],
  ['story', 'Our Story'],
  ['founder', 'The Founder'],
  ['believe', 'What We Believe'],
  ['ecosystem', 'The Ecosystem'],
];

/* ── building blocks ───────────────────────────────────────────────── */

const Eyebrow = ({ children, dark }) => (
  <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 ${dark ? 'text-orange-400' : 'text-orange-500'}`}>
    {children}
  </p>
);

// The design sets the second line of every display heading in serif italic.
const Ital = ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>;

const Display = ({ children, dark, center, size = 'md' }) => (
  <h2
    className={`leading-[1.15] ${center ? 'text-center' : ''} ${dark ? 'text-white' : 'text-slate-900'} ${
      size === 'lg' ? 'text-[32px] sm:text-[46px]' : 'text-[27px] sm:text-[36px]'}`}
    style={{ fontFamily: SERIF }}
  >
    {children}
  </h2>
);

const Lead = ({ children, dark, center }) => (
  <p className={`mt-5 text-[15px] sm:text-base leading-relaxed max-w-2xl ${center ? 'mx-auto text-center' : ''} ${
    dark ? 'text-slate-300' : 'text-slate-600'}`}>
    {children}
  </p>
);

const Section = ({ children, className = '', style, dark, id }) => (
  <section id={id} className={`px-4 py-16 sm:py-24 ${className}`} style={{ ...(dark ? { background: INK } : null), ...style }}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

/* ── page data ─────────────────────────────────────────────────────── */

const SHIFT = [
  ['The Old Way', 'Recruitment has traditionally depended on fixed teams, manual processes, and individual networks. Silos limited how much value experienced professionals could create.'],
  ['The Shift', 'The future of recruitment is more flexible. Technology can connect employers, experienced recruiters, and Coaches in ways that fixed teams never could.'],
  ['Our Answer', 'RecruiterV brings everyone together through technology — creating a network where people contribute their experience, work flexibly, and create value without traditional constraints.'],
];

const STRENGTHS = [
  ['Recruitment', 'Technology & Leadership Hiring'],
  ['Network', 'Talent & Professional Communities'],
  ['Experience', 'Client & Candidate Understanding'],
  ['Innovation', 'Technology-led HR Solutions'],
];

const BELIEFS = [
  ['01', 'Experience Matters', 'Years spent understanding people, requirements, and hiring cannot be replaced by technology alone. Human judgment is irreplaceable.'],
  ['02', 'Freedom Matters', 'Recruitment professionals should have greater freedom to decide how, when, and where they work. Flexibility unlocks performance.'],
  ['03', 'Collaboration Matters', 'The right combination of recruiters, Coaches, and technology can create better recruitment outcomes than any one of them alone.'],
];

const GIG = [
  ['01', 'Work with freedom.'],
  ['02', 'Work with flexibility.'],
  ['03', 'Work on your terms.'],
];

const HUMAN_WORK = [
  'Understanding People.', 'Building Relationships.',
  'Making Better Decisions.', 'Closing Opportunities.',
];

const ECOSYSTEM = [
  ['Employers', 'Access a broader recruitment network with verified, experienced professionals.'],
  ['Coaches', 'Multiply their experience by guiding recruiter teams on live opportunities.'],
  ['Recruiters', 'Work on live opportunities with greater flexibility and Coach support.'],
  ['RecruiterV', 'Provides the technology and ecosystem connecting every role.'],
];

/* ── page ──────────────────────────────────────────────────────────── */

export default function AboutUs() {
  const navigate = useNavigate();

  const CTAS = [
    ['For Recruiters', 'Unlock Your Recruitment Experience', '/recruiter'],
    ['For Coaches', 'Multiply Your Recruitment Impact', '/coach'],
    ['For Employers', 'Build Your Recruitment Network', '/for-employer'],
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: SANS }}>
      <Header />

      <main className="flex-1">
        {/* In-page section nav */}
        <nav className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded"
              style={{ background: 'rgba(242,140,40,0.14)', color: ORANGE }}>About Us</span>
            <div className="flex items-center gap-5 ml-3">
              {SECTION_NAV.map(([id, label]) => (
                <button key={id}
                  onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="text-[13px] font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">
                  {label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section id="why" className="px-4 py-16 sm:py-24 bg-white">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Eyebrow>About RecruiterV</Eyebrow>
              <h1 className="leading-[1.1] text-[38px] sm:text-[52px] text-slate-900" style={{ fontFamily: SERIF }}>
                Reimagining How<br /><Ital>Recruitment Works</Ital>
              </h1>
              <p className="mt-6 text-slate-600 text-[15px] leading-relaxed max-w-lg">
                RecruiterV is a product of{' '}
                <span className="font-semibold text-slate-900">Changeleaders Consulting Private Limited</span>,
                built on years of real recruitment experience and a belief that technology can make
                hiring more flexible, collaborative, and rewarding.
              </p>
              <p className="mt-8 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
                <span className="h-px w-8" style={{ background: ORANGE }} />
                Experience · Technology · Freedom
              </p>
            </div>

            {/* Image with the Founded On card overlapping its lower-left corner */}
            <div className="relative">
              <img src={HERO_IMG} alt="Recruitment professionals collaborating in an office"
                className="w-full rounded-2xl object-cover" style={{ aspectRatio: '4 / 3' }} />
              <div className="sm:absolute sm:-bottom-8 sm:-left-6 mt-4 sm:mt-0 rounded-2xl p-5 max-w-[240px] shadow-xl"
                style={{ background: ORANGE }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">Founded on</p>
                <p className="text-[19px] text-white mt-1 leading-snug" style={{ fontFamily: SERIF }}>
                  Real Recruitment Experience
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The idea */}
        <Section id="story" style={{ background: '#F7F9FA' }} className="border-y border-slate-200">
          <div className="text-center">
            <Eyebrow>The Idea Behind RecruiterV</Eyebrow>
            <Display center>Recruitment Is Changing.<br /><Ital>The Way We Work Should Too.</Ital></Display>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mt-12">
            {SHIFT.map(([title, body], i) => {
              // The middle card — The Shift — is the highlighted one.
              const hi = i === 1;
              return (
                <div key={title} className="rounded-2xl p-7"
                  style={hi ? { background: INK, color: '#fff' } : { background: '#fff', border: '1px solid #E5EAED' }}>
                  <span className="block h-px w-8 mb-4" style={{ background: ORANGE }} />
                  <h3 className="text-[19px]" style={{ fontFamily: SERIF, color: hi ? '#fff' : INK }}>{title}</h3>
                  <p className={`text-[14px] mt-3 leading-relaxed ${hi ? 'text-slate-300' : 'text-slate-600'}`}>{body}</p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* The experience behind */}
        <Section>
          <Eyebrow>The Experience Behind RecruiterV</Eyebrow>
          <Display>Built on Real<br /><Ital>Recruitment Experience</Ital></Display>
          <div className="grid lg:grid-cols-2 gap-10 mt-10">
            <div>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                RecruiterV comes from Changeleaders Consulting Private Limited, a recruitment and HR
                solutions company with experience across technology hiring, banking, leadership
                hiring, niche skills, sales, and startup recruitment.
              </p>
              <p className="text-[15px] text-slate-600 leading-relaxed mt-4">
                Over the years, ChangeLeaders has worked with organisations across different stages
                and industries, building practical understanding of what makes recruitment work —
                from understanding client requirements to managing recruitment teams and closing
                positions.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {STRENGTHS.map(([tag, body]) => (
                <div key={tag} className="rounded-2xl p-5" style={{ background: '#F7F9FA', border: '1px solid #E5EAED' }}>
                  <span className="block h-px w-7 mb-3" style={{ background: ORANGE }} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: ORANGE }}>{tag}</p>
                  <p className="text-[14px] font-semibold text-slate-800 mt-2 leading-snug">{body}</p>
                </div>
              ))}
            </div>
          </div>

        </Section>

        {/* The founder */}
        <Section id="founder" style={{ background: '#F7F9FA' }} className="border-y border-slate-200">
          <div className="grid lg:grid-cols-[minmax(0,400px)_1fr] gap-12 items-start">
            {/* Photo, with the founder's quote overlapping its lower-right */}
            <div className="relative">
              <img
                src={FOUNDER_IMG}
                alt="Roshan Kumar Rawat, Founder of ChangeLeaders and RecruiterV"
                className="w-full rounded-2xl object-cover"
                style={{ aspectRatio: '3 / 4' }}
                loading="lazy"
              />
              <div className="lg:absolute lg:-right-10 lg:bottom-10 mt-4 lg:mt-0 rounded-2xl bg-white shadow-xl p-5 max-w-[300px]"
                style={{ border: '1px solid #E5EAED' }}>
                <p className="text-[13px] leading-relaxed text-slate-700 italic" style={{ fontFamily: SERIF }}>
                  &ldquo;Technology should not replace recruitment experience. It should help
                  experienced people create more impact.&rdquo;
                </p>
                <span className="block h-px w-7 my-3" style={{ background: ORANGE }} />
                <p className="text-[12px] font-semibold text-slate-900">Roshan Kumar Rawat</p>
                <p className="text-[11px] text-slate-500">Founder, RecruiterV</p>
              </div>
            </div>

            <div>
              <Eyebrow>The Founder&apos;s Perspective</Eyebrow>
              <Display>Built by Someone Who Has<br /><Ital>Lived Recruitment</Ital></Display>
              <p className="text-[16px] font-semibold text-slate-900 mt-7">Roshan Kumar Rawat</p>
              <p className="text-[13px] mb-5" style={{ color: ORANGE }}>Founder, ChangeLeaders &amp; RecruiterV</p>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                Roshan is an HR and recruitment professional with experience spanning corporate HR,
                talent acquisition, and entrepreneurship. He holds an MBA in HR and a Master&apos;s in
                Social Work, and has worked with organisations including Genpact, Pentair, and
                Quatrro.
              </p>
              <p className="text-[15px] text-slate-600 leading-relaxed mt-4">
                He has led Talent Acquisition for a 12,000-employee organisation. His experience
                across recruitment, technology, and people development led to the creation of
                ChangeLeaders — and ultimately to the idea behind RecruiterV.
              </p>
              <p className="text-[15px] text-slate-600 leading-relaxed mt-4">
                His vision: <span className="font-semibold text-slate-900">use technology to unlock
                the value of recruitment experience and make the way recruiters work more
                flexible.</span>
              </p>
            </div>
          </div>
        </Section>

        {/* What we believe */}
        <Section id="believe" dark>
          <Eyebrow dark>What We Believe</Eyebrow>
          <Display dark>Experience Should<br /><Ital>Create More Impact.</Ital></Display>
          <div className="grid md:grid-cols-3 gap-5 mt-12">
            {BELIEFS.map(([n, title, body]) => (
              <div key={n} className="rounded-2xl p-7"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <p className="text-[34px] leading-none" style={{ fontFamily: SERIF, color: 'rgba(242,140,40,0.55)' }}>{n}</p>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white mt-4">{title}</h3>
                <p className="text-[14px] text-slate-400 mt-3 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Gig economy */}
        <Section style={{ background: '#F7F9FA' }} className="border-y border-slate-200">
          <Eyebrow>Our View of the Gig Economy</Eyebrow>
          <Display>Work Should Fit Into Life —<br /><Ital>Not the Other Way Around.</Ital></Display>
          <Lead>
            The gig economy is changing how professionals think about work. RecruiterV is built
            around the idea that experienced recruitment professionals should be able to participate
            in hiring opportunities without being tied to a traditional full-time structure.
          </Lead>
          <div className="grid sm:grid-cols-3 gap-4 mt-10">
            {GIG.map(([n, line]) => (
              <div key={n} className="rounded-2xl bg-white border border-slate-200 p-6">
                <p className="text-[13px] font-bold" style={{ color: ORANGE }}>{n}</p>
                <p className="text-[18px] mt-2 text-slate-900" style={{ fontFamily: SERIF }}>{line}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Why coaches matter */}
        <Section>
          <div className="flex flex-wrap items-center gap-2 mb-10">
            {['Coach Experience', 'Recruiter Guidance', 'Better Execution'].map(x => (
              <React.Fragment key={x}>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 bg-slate-100 px-3.5 py-2 rounded-lg">
                  ◆ {x}
                </span>
                <span className="text-orange-500">→</span>
              </React.Fragment>
            ))}
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white px-3.5 py-2 rounded-lg"
              style={{ background: ORANGE }}>
              ★ Better Outcomes
            </span>
          </div>

          <Eyebrow>Why Coaches Matter</Eyebrow>
          <Display>Experience Becomes More Valuable When It Is Shared.</Display>
          <Lead>
            Recruitment Coaches bring years of practical experience in hiring and team management.
            Their role is not simply to recruit — it is to help other recruiters understand
            requirements, improve their approach, and make better recruitment decisions.
          </Lead>
          <p className="mt-8 text-[19px] sm:text-[23px] leading-snug max-w-3xl border-l-4 pl-5 text-slate-800"
            style={{ fontFamily: SERIF, borderColor: ORANGE }}>
            &ldquo;Great recruitment experience should multiply, not remain confined to one desk.&rdquo;
          </p>
        </Section>

        {/* Technology belief */}
        <Section dark>
          <Eyebrow dark>Our Technology Belief</Eyebrow>
          <Display dark>Automate the Process.<br /><Ital>Empower the People.</Ital></Display>
          <div className="grid lg:grid-cols-2 gap-10 mt-10">
            <div>
              <p className="text-[15px] text-slate-300 leading-relaxed">
                Recruitment involves a significant amount of repetitive work — tracking candidates,
                updating statuses, coordinating activity, and managing follow-ups.
              </p>
              <p className="text-[15px] text-slate-300 leading-relaxed mt-4">
                We believe technology and automation should take care of more of this, allowing
                recruiters and Coaches to focus on what humans do best:
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {HUMAN_WORK.map(x => (
                <div key={x} className="rounded-2xl p-5"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <p className="text-[16px] text-white" style={{ fontFamily: SERIF }}>{x}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Ecosystem */}
        <Section id="ecosystem">
          <Eyebrow>What RecruiterV Is Building</Eyebrow>
          <Display>A Recruitment Ecosystem Where<br /><Ital>Everyone Creates More Value</Ital></Display>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {ECOSYSTEM.map(([title, body], i) => (
              <div key={title} className="rounded-2xl p-6"
                style={i === 3
                  ? { background: INK, color: '#fff' }
                  : { background: '#F7F9FA', border: '1px solid #E5EAED' }}>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: ORANGE }}>{title}</h3>
                <p className={`text-[14px] mt-3 leading-relaxed ${i === 3 ? 'text-slate-300' : 'text-slate-600'}`}>{body}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-[18px] text-slate-900" style={{ fontFamily: SERIF }}>
            One Ecosystem. Different Roles. Shared Outcomes.
          </p>
        </Section>

        {/* Vision */}
        <Section style={{ background: PANEL }}>
          <Eyebrow dark>Our Vision</Eyebrow>
          <Display dark>
            To Make Recruitment More Human, More Flexible, and More Technology-Driven.
          </Display>
          <Lead dark>
            We want to build a recruitment ecosystem where technology removes unnecessary process,
            experienced professionals create greater impact, and recruiters have the freedom to
            build meaningful careers on their own terms.
          </Lead>
        </Section>

        {/* Closing */}
        <Section>
          <Display center size="lg">The Future of Recruitment<br /><Ital>Is More Flexible.</Ital></Display>
          <Lead center>
            We are building a platform where experience, technology and freedom come together to
            create more value for everyone involved in recruitment.
          </Lead>
          <div className="grid sm:grid-cols-3 gap-4 mt-12">
            {CTAS.map(([tag, label, to]) => (
              <button key={to} onClick={() => navigate(to)}
                className="text-left rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-orange-300 transition">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: ORANGE }}>{tag}</p>
                <p className="text-[16px] text-slate-900 mt-2 leading-snug flex items-center gap-2" style={{ fontFamily: SERIF }}>
                  {label} <ArrowRight size={16} className="text-orange-500 flex-shrink-0" />
                </p>
              </button>
            ))}
          </div>
        </Section>

        {/* Company line */}
        <section className="px-4 py-10 border-t border-slate-200" style={{ background: '#F7F9FA' }}>
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
              Unlocking Value for Every Recruiter.
            </p>
            <p className="text-[13px] text-slate-500 mt-2">
              A product of Changeleaders Consulting Private Limited
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
