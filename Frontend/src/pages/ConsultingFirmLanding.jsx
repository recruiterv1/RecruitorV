import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Landmark, MapPin, Briefcase, Globe, Linkedin, Loader2, Building2, Phone, Mail, Menu, X, LogIn } from 'lucide-react';
import { RichTextView } from '../components/RichTextEditor';

// Full public landing page for a consulting firm: own header + menu + login,
// hero, about, open positions, scrolling client logos, and a firm footer with
// "Powered by RecruiterV".
export default function ConsultingFirmLanding() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    axios.get(`/api/consulting/public/${encodeURIComponent(slug)}`).then(r => setData(r.data)).catch(e => setErr(e.response?.data?.message || 'Firm not found.'));
  }, [slug]);

  const loc = (l) => (Array.isArray(l) ? l.join(', ') : l) || '';

  if (err) return <div className="min-h-screen grid place-items-center text-gray-500">{err}</div>;
  if (!data) return <div className="min-h-screen grid place-items-center text-gray-400"><Loader2 size={28} className="animate-spin" /></div>;

  const { firm, clients = [], positions = [] } = data;
  const menu = [
    { id: 'about', label: 'About' },
    { id: 'positions', label: 'Open Positions' },
    { id: 'clients', label: 'Clients' },
    { id: 'contact', label: 'Contact' },
  ];
  const go = (id) => { setNavOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };
  // Duplicate clients for a seamless marquee scroll.
  const marquee = clients.length ? [...clients, ...clients] : [];

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      <style>{`@keyframes firm-marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => go('top')} className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 grid place-items-center overflow-hidden flex-shrink-0">
              {firm.logoUrl ? <img src={firm.logoUrl} alt={firm.name} className="w-full h-full object-contain" /> : <Landmark size={20} className="text-blue-600" />}
            </div>
            <span className="font-extrabold text-gray-900 truncate">{firm.name}</span>
          </button>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            {menu.map(m => <button key={m.id} onClick={() => go(m.id)} className="hover:text-blue-600">{m.label}</button>)}
            <a href="/consulting" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"><LogIn size={15} /> Login</a>
          </nav>
          <button className="md:hidden text-gray-600" onClick={() => setNavOpen(o => !o)}>{navOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {navOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 py-3 space-y-2">
            {menu.map(m => <button key={m.id} onClick={() => go(m.id)} className="block text-sm text-gray-700">{m.label}</button>)}
            <a href="/consulting" className="inline-flex items-center gap-1.5 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm"><LogIn size={15} /> Login</a>
          </div>
        )}
      </header>

      <main id="top" className="flex-1">
        {/* ── Hero ── */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white">
          <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 flex flex-col sm:flex-row items-center gap-8">
            <div className="w-28 h-28 rounded-2xl bg-white/10 border border-white/20 grid place-items-center overflow-hidden flex-shrink-0">
              {firm.logoUrl ? <img src={firm.logoUrl} alt={firm.name} className="w-full h-full object-contain" /> : <Landmark size={48} />}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-4xl font-extrabold">{firm.name}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-sm text-blue-100">
                {(firm.city || firm.state) && <span className="flex items-center gap-1"><MapPin size={14} /> {[firm.city, firm.state].filter(Boolean).join(', ')}</span>}
                {firm.website && <a href={firm.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline"><Globe size={14} /> Website</a>}
                {firm.linkedin && <a href={firm.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline"><Linkedin size={14} /> LinkedIn</a>}
              </div>
              <div className="mt-6"><button onClick={() => go('positions')} className="bg-white text-blue-700 font-semibold rounded-xl px-6 py-3 hover:bg-blue-50">View open positions</button></div>
            </div>
          </div>
        </section>

        {/* ── About ── */}
        {firm.about && (
          <section id="about" className="max-w-4xl mx-auto px-4 py-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About us</h2>
            <div className="prose prose-sm max-w-none text-gray-700"><RichTextView value={firm.about} /></div>
          </section>
        )}

        {/* ── Open positions ── */}
        <section id="positions" className="bg-gray-50 border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Open positions</h2>
            {positions.length === 0 ? <p className="text-sm text-gray-400">No open positions right now.</p> : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {positions.map(p => (
                  <a key={p.pos_id} href={`/position/${p.pos_id}`} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition block">
                    <div className="flex items-center gap-2 text-blue-600"><Briefcase size={16} /><span className="font-bold text-gray-900">{p.position}</span></div>
                    <div className="text-xs text-gray-500 mt-1.5">{p.client} · {p.skill_category || '—'}</div>
                    <div className="text-xs text-gray-400 mt-1">{loc(p.location)}{p.experience ? ` · ${p.experience}` : ''}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Clients (scrolling) ── */}
        {clients.length > 0 && (
          <section id="clients" className="max-w-6xl mx-auto px-4 py-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Our clients</h2>
            <div className="relative overflow-hidden">
              <div className="flex gap-4 w-max" style={{ animation: `firm-marquee ${Math.max(18, marquee.length * 3)}s linear infinite` }}>
                {marquee.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-5 py-4 min-w-[200px]">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 grid place-items-center overflow-hidden flex-shrink-0">
                      {c.logoUrl ? <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain" /> : <Building2 size={20} className="text-blue-600" />}
                    </div>
                    <span className="font-semibold text-gray-800 text-sm whitespace-nowrap">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Contact ── */}
        <section id="contact" className="bg-gray-50 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Get in touch</h2>
            <div className="flex flex-wrap items-center justify-center gap-6 text-gray-700">
              {firm.phone && <a href={`tel:${firm.phone}`} className="flex items-center gap-2 hover:text-blue-600"><Phone size={16} /> {firm.phone}</a>}
              {firm.email && <a href={`mailto:${firm.email}`} className="flex items-center gap-2 hover:text-blue-600"><Mail size={16} /> {firm.email}</a>}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 text-slate-300">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 grid place-items-center overflow-hidden">
              {firm.logoUrl ? <img src={firm.logoUrl} alt="" className="w-full h-full object-contain" /> : <Landmark size={18} />}
            </div>
            <div>
              <div className="font-bold text-white">{firm.name}</div>
              <div className="text-xs text-slate-400 flex flex-wrap gap-x-3">
                {firm.phone && <span>{firm.phone}</span>}
                {firm.email && <span>{firm.email}</span>}
              </div>
            </div>
          </div>
          <a href="https://www.recruiterv.com" target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-white">Powered by <span className="font-bold text-white">RecruiterV</span></a>
        </div>
      </footer>
    </div>
  );
}
