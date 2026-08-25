import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LogIn } from 'lucide-react';
import Header from '../pages/Header';
import Footer from '../pages/Footer';

// One template behind the four audience landing pages (Employer, Company,
// Vendor, Consulting Firm). Each supplies its own copy; the structure, styling
// and calls to action stay identical so the four read as one family.
//
// Props:
//   eyebrow, title, subtitle   — hero copy
//   primary  {label, to}       — the main call to action (the form / registration)
//   secondary{label, to}       — usually "already have an account" → login
//   benefits [{icon, title, body}]
//   steps    [string]          — how it works, in order
//   closing  {title, body}     — final call-to-action band
const PortalLanding = ({
  eyebrow, title, subtitle, primary, secondary, benefits = [], steps = [], closing,
}) => {
  const navigate = useNavigate();

  const Cta = ({ big }) => (
    <div className={`flex flex-wrap gap-3 ${big ? 'justify-center' : ''}`}>
      <button
        onClick={() => navigate(primary.to)}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 text-white font-bold text-sm hover:opacity-95 transition shadow-lg"
      >
        {primary.label} <ArrowRight size={16} />
      </button>
      {secondary && (
        <button
          onClick={() => navigate(secondary.to)}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition border ${
            big ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'border-white/40 text-white hover:bg-white/10'}`}
        >
          <LogIn size={15} /> {secondary.label}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white">
          <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
            {eyebrow && (
              <p className="text-[11px] uppercase tracking-[0.2em] text-blue-200 mb-3">{eyebrow}</p>
            )}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight max-w-3xl">
              {title}
            </h1>
            <p className="mt-4 text-blue-100 text-base sm:text-lg max-w-2xl leading-relaxed">
              {subtitle}
            </p>
            <div className="mt-8"><Cta /></div>
          </div>
        </section>

        {/* Benefits */}
        {benefits.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-14">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {benefits.map(b => (
                <div key={b.title} className="rounded-2xl border border-gray-200 p-5 hover:shadow-md transition">
                  <div className="text-2xl mb-2">{b.icon}</div>
                  <h3 className="font-bold text-gray-900">{b.title}</h3>
                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{b.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* How it works */}
        {steps.length > 0 && (
          <section className="bg-gray-50 border-y border-gray-100">
            <div className="max-w-4xl mx-auto px-4 py-14">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">How it works</h2>
              <ol className="space-y-4">
                {steps.map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="text-[15px] text-gray-700 leading-relaxed pt-0.5">{s}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* Closing call to action */}
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {closing?.title || 'Ready to get started?'}
          </h2>
          {closing?.body && (
            <p className="mt-3 text-gray-600 max-w-xl mx-auto leading-relaxed">{closing.body}</p>
          )}
          <div className="mt-7 flex justify-center"><Cta big /></div>
          <p className="mt-5 text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <CheckCircle2 size={13} className="text-green-500" /> No charge to list a position.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PortalLanding;
