import React, { useEffect, useState } from 'react';
import { Award, Download, Share2, ArrowRight, Check, Copy, X } from 'lucide-react';

// What a Certified result looks like: a burst of confetti, the standing, and the
// three things they can do next — take the certificate, tell people, register.

const COLOURS = ['#F47B20', '#C9A227', '#10B981', '#0F1D3C', '#60A5FA'];

// Confetti as plain absolutely-positioned pieces on a CSS animation. No library,
// and it respects a reduced-motion preference.
const Confetti = ({ pieces = 90 }) => {
  const reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return null;

  const bits = Array.from({ length: pieces }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2.2,
    duration: 2.6 + Math.random() * 2.2,
    size: 6 + Math.random() * 7,
    colour: COLOURS[i % COLOURS.length],
    rotate: Math.random() * 360,
    round: Math.random() > 0.6,
  }));

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-[250]">
      <style>{`
        @keyframes rv-fall {
          0%   { transform: translateY(-12vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(104vh) rotate(680deg); opacity: 0; }
        }
      `}</style>
      {bits.map(b => (
        <span key={b.id}
          style={{
            position: 'absolute', top: 0, left: `${b.left}%`,
            width: b.size, height: b.round ? b.size : b.size * 0.45,
            background: b.colour,
            borderRadius: b.round ? '50%' : 2,
            transform: `rotate(${b.rotate}deg)`,
            animation: `rv-fall ${b.duration}s ${b.delay}s cubic-bezier(.25,.6,.4,1) forwards`,
          }} />
      ))}
    </div>
  );
};

export default function CertifiedCelebration({
  name, role, skillCategory, percent, certificateId, certificateUrl,
  registerHref, onDismissConfetti,
}) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setShowConfetti(false); onDismissConfetti?.(); }, 6000);
    return () => clearTimeout(t);
  }, [onDismissConfetti]);

  const title = role === 'Coach' ? 'Certified Recruitment Coach'
    : role === 'Expert' ? 'Certified Industry Expert' : 'Certified Recruiter';

  const shareText = `I'm now a ${title}${skillCategory ? ` in ${skillCategory}` : ''} on RecruiterV.`;
  const shareUrl = certificateId
    ? `https://www.recruiterv.com/verify/${certificateId}`
    : 'https://www.recruiterv.com/join';

  // The share targets people actually use here.
  const SHARES = [
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '#0A66C2'],
    ['WhatsApp', `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, '#25D366'],
    ['X', `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '#0F1419'],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '#1877F2'],
    ['Email', `mailto:?subject=${encodeURIComponent("I'm RecruiterV Certified")}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`, '#64748B'],
  ];

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "I'm RecruiterV Certified", text: shareText, url: shareUrl }); return; }
      catch { /* dismissed — fall through to the list */ }
    }
    setShareOpen(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <>
      {showConfetti && <Confetti />}

      <div className="max-w-xl mx-auto text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center animate-bounce"
          style={{ animationIterationCount: 3 }}>
          <Award size={40} />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600 mt-6">Certified</p>
        <h1 className="text-[28px] sm:text-[36px] font-bold text-slate-900 mt-1 leading-tight">
          Congratulations{name ? `, ${name.split(' ')[0]}` : ''}!
        </h1>
        <p className="mt-3 text-[15px] text-slate-600 leading-relaxed">
          You scored <span className="font-bold text-slate-900">{percent}%</span> and are now a{' '}
          <span className="font-bold text-orange-600">{title}</span>
          {skillCategory ? <> in <span className="font-semibold text-slate-900">{skillCategory}</span></> : null}.
        </p>
        <p className="mt-2 text-[14px] text-slate-600">
          Full access: requisitions are assigned immediately and the standard revenue share applies
          from day one.
        </p>

        {certificateId && (
          <p className="inline-block text-[12px] font-mono text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-5">
            {certificateId}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {certificateUrl && (
            <a href={certificateUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-lg">
              <Download size={16} /> Download Certificate
            </a>
          )}
          <button onClick={nativeShare}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm">
            <Share2 size={16} /> Share
          </button>
          {registerHref && (
            <a href={registerHref}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg"
              style={{ background: '#F47B20' }}>
              Proceed to Register <ArrowRight size={16} />
            </a>
          )}
        </div>

        <p className="text-[12px] text-slate-500 mt-4">
          Your certificate has also been emailed to you.
        </p>
      </div>

      {/* Share sheet */}
      {shareOpen && (
        <div onClick={() => setShareOpen(false)}
          className="fixed inset-0 z-[300] bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-slate-900">Share your certification</p>
              <button onClick={() => setShareOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SHARES.map(([label, href, colour]) => (
                <a key={label} href={href} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 py-3 hover:bg-slate-50">
                  <span className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold"
                    style={{ background: colour }}>
                    {label[0]}
                  </span>
                  <span className="text-[13px] font-semibold text-slate-700">{label}</span>
                </a>
              ))}
            </div>
            <button onClick={copyLink}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
              {copied ? <><Check size={14} className="text-green-600" /> Copied</> : <><Copy size={14} /> Copy link</>}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
