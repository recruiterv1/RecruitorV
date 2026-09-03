import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, ChevronRight, Loader2, ImageOff, X } from 'lucide-react';
import DashShell from '../components/DashShell';

// The training manual for whoever is signed in. The server picks the manual
// from the session's role, so there is nothing to choose here — a recruiter
// sees the recruiter manual, a coach the coach one, and so on.

// "Dashboard → Open Positions" renders as clickable-looking crumbs so the path
// through the menus is obvious at a glance.
const MenuPath = ({ path }) => {
  const parts = String(path || '').split(/→|>|→/).map(p => p.trim()).filter(Boolean);
  if (!parts.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {parts.map((p, i) => (
        <React.Fragment key={`${p}-${i}`}>
          <span className="inline-flex items-center text-[11.5px] font-semibold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">
            {p}
          </span>
          {i < parts.length - 1 && <ChevronRight size={13} className="text-gray-400" />}
        </React.Fragment>
      ))}
    </div>
  );
};

function TrainingManualInner() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState('');     // screenshot opened full size

  useEffect(() => {
    axios.get('/api/training/my', { withCredentials: true })
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.message || 'Could not load the training manual.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 flex items-center justify-center gap-2 text-gray-500 text-sm">
      <Loader2 size={16} className="animate-spin" /> Loading your manual…
    </div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600 text-sm">{error}</div>;
  }

  if (data?.empty) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-5 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><BookOpen size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">Training Manual</h2>
              <p className="text-blue-100 text-sm">For {data.label}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center mt-4">
          <BookOpen size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 font-semibold text-gray-600">The manual is being prepared</p>
          <p className="text-sm text-gray-400 mt-1">
            Your training manual has not been published yet. It will appear here once it is ready.
          </p>
        </div>
      </div>
    );
  }

  const m = data.manual;
  let stepNo = 0;

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl"><BookOpen size={22} /></div>
          <div>
            <h2 className="text-xl font-bold">{m.title}</h2>
            <p className="text-blue-100 text-sm">
              For {m.label} · {m.stepCount} step{m.stepCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        {m.intro && <p className="text-blue-50 text-sm mt-4 leading-relaxed max-w-3xl">{m.intro}</p>}
      </div>

      {/* Contents */}
      {m.sections.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">In this manual</p>
          <div className="flex flex-wrap gap-2">
            {m.sections.map(s => (
              <button key={s.section}
                onClick={() => document.getElementById(`sec-${s.section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="text-[12.5px] font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">
                {s.section} <span className="text-gray-400">({s.steps.length})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {m.sections.map(sec => (
        <div key={sec.section} id={`sec-${sec.section}`} className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">{sec.section}</h3>
          <div className="space-y-3">
            {sec.steps.map(step => {
              stepNo += 1;
              return (
                <div key={step.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 h-8 w-8 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center">
                      {stepNo}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900">{step.title}</h4>
                      {step.menuPath && <MenuPath path={step.menuPath} />}
                      {step.body && (
                        <p className="text-[14px] text-gray-600 leading-relaxed mt-3 whitespace-pre-wrap">{step.body}</p>
                      )}
                      {step.imageUrl && (
                        <button onClick={() => setZoom(step.imageUrl)}
                          className="block mt-4 rounded-xl overflow-hidden border border-gray-200 hover:border-orange-300 transition">
                          <img src={step.imageUrl} alt={step.title}
                            className="max-w-full sm:max-w-lg" loading="lazy" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Screenshot at full size */}
      {zoom && (
        <div onClick={() => setZoom('')}
          className="fixed inset-0 z-[300] bg-black/70 flex items-center justify-center p-4">
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" aria-label="Close">
            <X size={26} />
          </button>
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-xl"
            onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export default function TrainingManual() {
  return <DashShell><TrainingManualInner /></DashShell>;
}
