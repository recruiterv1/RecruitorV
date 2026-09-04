import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, MapPin, Briefcase, Globe, Linkedin, Facebook, Twitter, Instagram, Youtube, MessageCircle, Mail, Phone, Menu, X } from 'lucide-react';

// Public landing page for a single vendor, at /vendors/:slug — the page a vendor
// sends to a prospective client. It carries the VENDOR's own header and footer,
// not the RecruiterV site chrome, so it reads as their page.

const NAVY = '#0F1D3C';
const ORANGE = '#F47B20';

const initials = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// Normalise whatever the vendor typed into a usable href.
const href = (v, prefix = 'https://') => {
  const t = String(v || '').trim();
  if (!t) return '';
  return /^https?:\/\//i.test(t) ? t : `${prefix}${t.replace(/^\/+/, '')}`;
};

// The social links a vendor can publish, in the order they appear.
const socialsOf = (v) => [
  { key: 'website',   label: 'Website',   Icon: Globe,          url: href(v.website) },
  { key: 'linkedin',  label: 'LinkedIn',  Icon: Linkedin,       url: href(v.linkedin) },
  { key: 'facebook',  label: 'Facebook',  Icon: Facebook,       url: href(v.facebook) },
  { key: 'twitter',   label: 'X',         Icon: Twitter,        url: href(v.twitter) },
  { key: 'instagram', label: 'Instagram', Icon: Instagram,      url: href(v.instagram) },
  { key: 'youtube',   label: 'YouTube',   Icon: Youtube,        url: href(v.youtube) },
  { key: 'whatsapp',  label: 'WhatsApp',  Icon: MessageCircle,
    url: v.whatsapp ? (/^https?:/i.test(v.whatsapp) ? v.whatsapp
      : `https://wa.me/${String(v.whatsapp).replace(/[^0-9]/g, '')}`) : '' },
].filter(x => x.url);

const NAV = [
  { id: 'positions', label: 'Open Positions' },
  { id: 'about', label: 'About Us' },
  { id: 'why', label: 'Why Work With Us' },
  { id: 'process', label: 'How It Works' },
];

const BENEFITS = [
  ['🎯', 'Screened, Not Forwarded', 'Every candidate is screened against your brief before it reaches you, so your team reviews shortlists rather than raw CVs.'],
  ['⚡', 'Faster Time to Shortlist', 'A briefed team starts sourcing the same day, with a live pipeline instead of email threads and spreadsheets.'],
  ['👥', 'A Team, Not One Recruiter', 'Multiple recruiters work your position in parallel, so a single person going quiet never stalls your hiring.'],
  ['🔍', 'Full Visibility', 'See every candidate and their stage as it happens — sourced, screened, submitted, interviewed, selected, joined.'],
  ['🤝', 'One Point of Contact', 'One dedicated contact owns your requirement end to end and coordinates everything behind it.'],
  ['💳', 'You Pay on Success', 'No retainers and no upfront cost. Fees apply on a successful hire, on terms agreed before we start.'],
];

const PROCESS = [
  ['01', 'Share Your Requirement', 'Tell us the role, the must-haves and what a good candidate actually looks like for your team.'],
  ['02', 'We Brief the Team', 'The requirement is turned into a briefing every recruiter on it hears — so nobody sources on guesswork.'],
  ['03', 'Sourcing & Screening', 'Candidates are sourced, screened and matched against your brief before anything is sent to you.'],
  ['04', 'You Receive a Shortlist', 'Only relevant profiles reach you, with the context you need to decide quickly.'],
  ['05', 'Interviews & Feedback', 'Scheduling and follow-ups are coordinated for you, and feedback goes straight back into sourcing.'],
  ['06', 'Offer to Joining', 'We stay with the candidate through offer, notice period and joining, so fewer drop out at the last step.'],
];

export default function VendorPublicPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    axios.get(`/vendor/public/${slug}`)
      .then(r => { if (live) setData(r.data); })
      .catch(e => { if (live) setError(e.response?.status === 404 ? 'notfound' : 'error'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [slug]);

  const go = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>;
  }
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-bold text-slate-800">
          {error === 'notfound' ? 'This page is not available.' : 'Something went wrong.'}
        </p>
        <p className="text-sm text-slate-500">
          {error === 'notfound'
            ? 'The link may be out of date, or the account is no longer active.'
            : 'Please try again in a moment.'}
        </p>
        <Link to="/" className="text-sm font-semibold text-orange-600 hover:text-orange-700">Go to RecruiterV →</Link>
      </div>
    );
  }

  const { vendor: v, stats, positions, clients } = data;
  const place = [v.city, v.state].filter(Boolean).join(', ');
  const socials = socialsOf(v);

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── The vendor's own header ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => go('top')} className="flex items-center gap-2.5 min-w-0">
            {v.logoUrl
              ? <img src={v.logoUrl} alt={v.name}
                  className="h-9 w-auto max-w-[150px] rounded-lg object-contain flex-shrink-0" />
              : <span className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: NAVY }}>{initials(v.name)}</span>}
            {/* A logo usually carries the name already — only spell it out when
                there is no logo to fall back on. */}
            {!v.logoUrl && <span className="font-bold text-slate-900 truncate">{v.name}</span>}
          </button>

          <nav className="hidden lg:flex items-center gap-6 ml-4">
            {NAV.map(n => (
              <button key={n.id} onClick={() => go(n.id)}
                className="text-sm font-medium text-slate-600 hover:text-slate-900">{n.label}</button>
            ))}
          </nav>

          <div className="ml-auto hidden lg:flex items-center gap-2">
            {/* Both logins the vendor's people need, on their own page. */}
            <button onClick={() => navigate('/vendor')}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50">
              Vendor Login
            </button>
            <button onClick={() => navigate('/log_rec')}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white hover:opacity-95"
              style={{ background: ORANGE }}>
              Recruiter Login
            </button>
          </div>

          <button onClick={() => setMenuOpen(o => !o)} className="ml-auto lg:hidden text-slate-700" aria-label="Menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            {NAV.map(n => (
              <button key={n.id} onClick={() => go(n.id)}
                className="block w-full text-left py-2 text-sm font-medium text-slate-700">{n.label}</button>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => navigate('/vendor')}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 border border-slate-300">
                Vendor Login
              </button>
              <button onClick={() => navigate('/log_rec')}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-bold text-white" style={{ background: ORANGE }}>
                Recruiter Login
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1" id="top">
        {/* Hero */}
        <section className="relative overflow-hidden" style={{ background: NAVY }}>
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
          <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-20">
            <div className="flex items-center gap-4">
              {v.logoUrl
                ? <img src={v.logoUrl} alt={v.name}
                    className="h-16 w-auto max-w-[240px] rounded-xl object-contain bg-white p-1.5" />
                : <span className="h-16 w-16 rounded-xl bg-white/10 flex items-center justify-center text-white text-lg font-bold">
                    {initials(v.name)}
                  </span>}
              <div>
                <h1 className="text-white font-bold text-[30px] sm:text-[40px] leading-tight">{v.name}</h1>
                {place && (
                  <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                    <MapPin size={14} /> {place}
                    {v.foundedYear && <span className="ml-2">· Since {v.foundedYear}</span>}
                  </p>
                )}
              </div>
            </div>

            <p className="mt-6 text-slate-200 text-lg sm:text-xl font-semibold max-w-2xl leading-snug">
              {v.tagline || 'Recruitment that reaches your shortlist faster.'}
            </p>
            <p className="mt-3 text-slate-400 text-[15px] max-w-2xl leading-relaxed">
              {v.about
                || `${v.name} is a recruitment partner on RecruiterV, running a briefed team of recruiters against live client requirements — with every candidate screened before it reaches you.`}
            </p>

            {!!v.specialisms?.length && (
              <div className="flex flex-wrap gap-2 mt-6">
                {v.specialisms.map(sp => (
                  <span key={sp} className="text-[12px] font-semibold text-slate-200 bg-white/10 px-3 py-1.5 rounded-full">{sp}</span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-8">
              <button onClick={() => go('contact')}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-95"
                style={{ background: ORANGE }}>
                Hire With Us <ArrowRight size={16} />
              </button>
              <button onClick={() => go('positions')}
                className="px-7 py-3.5 rounded-xl font-semibold text-sm border border-white/30 text-white hover:bg-white/10">
                See Open Positions
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-12 max-w-lg">
              {[[stats.openPositions, 'Open Positions'], [stats.recruiters, 'Recruiters'], [stats.clients, 'Clients']].map(([n, l]) => (
                <div key={l}>
                  <p className="text-3xl font-bold" style={{ color: ORANGE }}>{n}</p>
                  <p className="text-[12px] text-slate-400 mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open positions */}
        <section id="positions" className="px-4 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600 mb-3">Open Positions</p>
            <h2 className="text-[26px] sm:text-[32px] font-bold text-slate-900">Roles We Are Hiring For</h2>
            <p className="mt-3 text-slate-600 max-w-2xl leading-relaxed">
              Live roles {v.name}&apos;s recruiters are working on right now. Recruiters can sign in
              to work these; candidates are welcome to apply.
            </p>

            {positions.length ? (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
                {positions.map(p => (
                  <div key={p.pos_id} className="rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition">
                    <h3 className="font-bold text-slate-900">{p.position}</h3>
                    {p.client && <p className="text-[13px] text-slate-500 mt-0.5">{p.client}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[12px] text-slate-500">
                      {p.location && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {p.location}</span>}
                      {p.experience && <span className="inline-flex items-center gap-1"><Briefcase size={12} /> {p.experience}</span>}
                    </div>
                    {p.skill_category && (
                      <span className="inline-block mt-4 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700">
                        {p.skill_category}
                      </span>
                    )}
                    <button onClick={() => navigate(`/position/${p.pos_id}`)}
                      className="block mt-5 text-[12px] font-bold text-orange-600 hover:text-orange-700">
                      View & Apply →
                    </button>
                  </div>
                ))}
                </div>
              </>
            ) : (
              <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <p className="font-semibold text-slate-700">No positions are open on this page right now.</p>
                <p className="text-sm text-slate-500 mt-1.5 max-w-lg mx-auto">
                  Roles are added as client requirements come in. If you are hiring, get in touch
                  and we will start on your requirement.
                </p>
                <button onClick={() => go('contact')}
                  className="mt-5 px-6 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: ORANGE }}>
                  Talk to Us
                </button>
              </div>
            )}
          </div>
        </section>

        {/* About */}
        <section id="about" className="px-4 py-16 sm:py-20 border-y border-slate-200" style={{ background: '#F7F9FB' }}>
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600 mb-3">About Us</p>
              <h2 className="text-[26px] sm:text-[32px] font-bold text-slate-900">Who We Are</h2>
              <p className="mt-4 text-slate-600 leading-relaxed whitespace-pre-wrap">
                {v.about
                  || `${v.name} works as a recruitment partner for companies that need to hire well and hire quickly. Our recruiters work to a written brief for every position, so sourcing is aimed at the candidate you actually want — not a keyword match.`}
              </p>
              {!!socials.length && (
                <div className="flex flex-wrap gap-3 mt-6">
                  {socials.map(sl => (
                    <a key={sl.key} href={sl.url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-xl px-4 py-2 hover:bg-white">
                      <sl.Icon size={15} /> {sl.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">At a glance</p>
              <div className="grid grid-cols-2 gap-5 mt-4">
                {[['Recruiters on the team', stats.recruiters], ['Live positions', stats.openPositions],
                  ['Client companies', stats.clients], ['Based in', place || '—']].map(([l, val]) => (
                  <div key={l}>
                    <p className="text-2xl font-bold text-slate-900">{val}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
              {!!clients.length && (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 mt-7 mb-2">Companies we hire for</p>
                  <div className="flex flex-wrap gap-2">
                    {clients.map(c => (
                      <span key={c.name} className="text-[12px] font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">{c.name}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section id="why" className="px-4 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600 mb-3">Why Work With Us</p>
            <h2 className="text-[26px] sm:text-[32px] font-bold text-slate-900">What You Get When You Hire Through Us</h2>
            <p className="mt-3 text-slate-600 max-w-2xl leading-relaxed">
              Hiring stalls when requirements are vague, candidates are forwarded unscreened and
              nobody can see where things stand. We work the other way round.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
              {BENEFITS.map(([icon, title, body]) => (
                <div key={title} className="rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition">
                  <div className="text-2xl">{icon}</div>
                  <h3 className="font-bold text-slate-900 mt-3">{title}</h3>
                  <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section id="process" className="px-4 py-16 sm:py-20" style={{ background: NAVY }}>
          <div className="max-w-6xl mx-auto">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-3">How It Works</p>
            <h2 className="text-[26px] sm:text-[32px] font-bold text-white">A Simple Process, From Brief to Joining</h2>
            <p className="mt-3 text-slate-300 max-w-2xl leading-relaxed">
              Six steps, no paperwork to start, and one contact throughout.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
              {PROCESS.map(([n, title, body]) => (
                <div key={n} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <span className="text-base font-bold" style={{ color: ORANGE }}>{n}</span>
                  <h3 className="font-bold text-white mt-1.5">{title}</h3>
                  <p className="text-[13px] text-slate-400 mt-2 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact / CTA */}
        <section id="contact" className="px-4 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-[26px] sm:text-[34px] font-bold text-slate-900">Hiring? Let&apos;s Start.</h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Send us the role and what a good candidate looks like for your team. You will have a
              briefed team sourcing on it, and a shortlist rather than a pile of CVs.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {v.publicEmail && (
                <a href={`mailto:${v.publicEmail}`}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-95"
                  style={{ background: ORANGE }}>
                  <Mail size={16} /> {v.publicEmail}
                </a>
              )}
              {v.publicPhone && (
                <a href={`tel:${v.publicPhone}`}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm border border-slate-300 text-slate-700 hover:bg-slate-50">
                  <Phone size={16} /> {v.publicPhone}
                </a>
              )}
              {!v.publicEmail && !v.publicPhone && (
                <a href={v.website ? (v.website.startsWith('http') ? v.website : `https://${v.website}`) : '/for-vendor'}
                  target={v.website ? '_blank' : undefined} rel="noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-95"
                  style={{ background: ORANGE }}>
                  Get in Touch <ArrowRight size={16} />
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── The vendor's own footer ─────────────────────────────────── */}
      <footer className="border-t border-slate-200" style={{ background: NAVY }}>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5">
                {v.logoUrl
                  ? <img src={v.logoUrl} alt={v.name}
                    className="h-9 w-auto max-w-[150px] rounded-lg object-contain bg-white p-1" />
                  : <span className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-white text-xs font-bold">
                      {initials(v.name)}
                    </span>}
                <span className="font-bold text-white">{v.name}</span>
              </div>
              <p className="text-[13px] text-slate-400 mt-3 max-w-sm leading-relaxed">
                {v.tagline || 'Recruitment that reaches your shortlist faster.'}
              </p>
              {place && <p className="text-[12px] text-slate-500 mt-3 flex items-center gap-1.5"><MapPin size={12} /> {place}</p>}
              {!!socials.length && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {socials.map(sl => (
                    <a key={sl.key} href={sl.url} target="_blank" rel="noreferrer" title={sl.label} aria-label={sl.label}
                      className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200">
                      <sl.Icon size={16} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Explore</p>
              <div className="mt-3 space-y-2">
                {NAV.map(n => (
                  <button key={n.id} onClick={() => go(n.id)}
                    className="block text-[13px] text-slate-300 hover:text-white">{n.label}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Sign In</p>
              <div className="mt-3 space-y-2">
                <button onClick={() => navigate('/vendor')} className="block text-[13px] text-slate-300 hover:text-white">Vendor Login</button>
                <button onClick={() => navigate('/log_rec')} className="block text-[13px] text-slate-300 hover:text-white">Recruiter Login</button>
                <button onClick={() => navigate('/join')} className="block text-[13px] text-slate-300 hover:text-white">Join as a Recruiter</button>
              </div>
              {(v.publicEmail || v.publicPhone) && (
                <div className="mt-5 space-y-1.5">
                  {v.publicEmail && <a href={`mailto:${v.publicEmail}`} className="block text-[12px] text-slate-400 hover:text-white break-all">{v.publicEmail}</a>}
                  {v.publicPhone && <a href={`tel:${v.publicPhone}`} className="block text-[12px] text-slate-400 hover:text-white">{v.publicPhone}</a>}
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-slate-500">
              © {new Date().getFullYear()} {v.name}. All rights reserved.
            </p>
            <p className="text-[12px] text-slate-500">
              Powered by <Link to="/" className="text-slate-300 hover:text-white font-semibold">RecruiterV</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
