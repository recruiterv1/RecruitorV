import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Bookmark, Loader2, Gauge, MapPin, Clock, Briefcase, FileText, Trash2, Check, X } from 'lucide-react';
import DashShell from '../components/DashShell';
import SubmitCandidateTabs from '../components/SubmitCandidateTabs';

// Candidates a recruiter set aside from the Resume Bank, each scored against
// that recruiter's own live positions.
//
// The bank answers "who is out there"; this answers the harder question — of
// the people I kept, who fits what I am actually working on, and why.
export default function Shortlist() {
  const [rows, setRows] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(null);       // candidateId whose breakdown is showing
  const [submitCtx, setSubmitCtx] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/resume-bank/shortlist', { withCredentials: true });
      if (r.data?.success) { setRows(r.data.rows || []); setPositions(r.data.positions || []); }
    } catch (e) { setMsg(e?.response?.data?.message || 'Could not load your shortlist.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (candidateId) => {
    try {
      await axios.delete(`/api/resume-bank/shortlist/${candidateId}`, { withCredentials: true });
      setRows(rs => rs.filter(r => r.candidateId !== candidateId));
    } catch { setMsg('Could not remove that one.'); }
  };

  const tone = (s) => (s >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : s >= 45 ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-gray-50 text-gray-600 border-gray-200');

  return (
    <DashShell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <Bookmark size={20} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Shortlist</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Candidates you kept from the Resume Bank, scored against your own live positions.
          {positions.length > 0 && ` Matching against ${positions.length} position${positions.length === 1 ? '' : 's'} assigned to you.`}
        </p>

        {msg && <p className="mb-4 text-sm font-semibold text-red-600">{msg}</p>}

        {loading ? (
          <p className="flex items-center gap-2 text-gray-400 text-sm py-8">
            <Loader2 size={15} className="animate-spin" /> Loading…
          </p>
        ) : !rows.length ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
            <Bookmark size={28} className="mx-auto text-gray-300 mb-3" />
            <p className="font-semibold text-gray-700">Nothing shortlisted yet</p>
            <p className="text-[13px] text-gray-500 mt-1">
              Open the Resume Bank and use Shortlist on anyone worth keeping. They land here,
              matched to the positions you are working on.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Nothing to match against is a different problem from a bad match,
                so it is said plainly rather than shown as 0%. */}
            {!positions.length && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-[13px] text-amber-900">
                You have no active assigned positions, so these cannot be scored yet.
                Take a position and the matches will appear here.
              </div>
            )}

            {rows.map(r => (
              <div key={r.candidateId} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-[15px]">{r.candidate || '—'}</p>
                    <p className="text-[12.5px] text-gray-500 truncate">{r.emails}{r.mob ? ` · ${r.mob}` : ''}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[12px] text-gray-500">
                      {r.curr_loc && <span className="inline-flex items-center gap-1"><MapPin size={11} />{r.curr_loc}</span>}
                      {r.total_exp && <span className="inline-flex items-center gap-1"><Briefcase size={11} />{r.total_exp}</span>}
                      {r.notice_period && <span className="inline-flex items-center gap-1"><Clock size={11} />{r.notice_period}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {r.cv_data && (
                      <a href={r.cv_data} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
                        <FileText size={12} /> CV
                      </a>
                    )}
                    <button onClick={() => remove(r.candidateId)} title="Remove from shortlist"
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {r.best ? (
                  <div className={`mt-3 rounded-xl border p-3 ${tone(r.best.score)}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">Best fit</p>
                        <p className="font-bold text-[14px] truncate">{r.best.position}</p>
                        <p className="text-[12px] opacity-80">{r.best.client}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[20px] font-bold flex-shrink-0">
                        <Gauge size={16} />{r.best.score}%
                      </span>
                    </div>

                    {/* The words behind the number. A percentage on its own is
                        not something a recruiter can act on. */}
                    <div className="mt-2.5 space-y-1.5">
                      {r.best.matched.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <Check size={11} className="opacity-70" />
                          {r.best.matched.map(w => (
                            <span key={w} className="px-1.5 py-0.5 rounded bg-white/70 text-[11.5px] font-medium">{w}</span>
                          ))}
                        </div>
                      )}
                      {r.best.missing.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 opacity-70">
                          <X size={11} />
                          {r.best.missing.map(w => (
                            <span key={w} className="px-1.5 py-0.5 rounded bg-white/50 text-[11.5px] line-through">{w}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        onClick={() => setSubmitCtx({
                          pos_id: r.best.pos_id, pos_name: r.best.position, client: r.best.client,
                          clientspoc: r.best.clientspoc, hr_name: r.best.hr_name, prefill: r,
                        })}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-[12.5px] font-bold">
                        Submit to this position
                      </button>
                      {r.matches.length > 1 && (
                        <button onClick={() => setOpen(open === r.candidateId ? null : r.candidateId)}
                          className="px-3 py-1.5 rounded-lg border border-current/20 text-[12.5px] font-semibold">
                          {open === r.candidateId ? 'Hide' : `${r.matches.length - 1} other position${r.matches.length === 2 ? '' : 's'}`}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-[12.5px] text-gray-500">
                    No live position of yours to score this person against.
                  </p>
                )}

                {open === r.candidateId && (
                  <div className="mt-2 space-y-1.5">
                    {r.matches.slice(1).map(m => (
                      <div key={m.pos_id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">{m.position}</p>
                          <p className="text-[11.5px] text-gray-500">{m.client} · {m.matched.slice(0, 5).join(', ')}</p>
                        </div>
                        <span className="text-[13px] font-bold text-gray-700 flex-shrink-0">{m.score}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* The same submit form the Resume Bank uses, prefilled with this person
          and pointed at the position they matched. */}
      {submitCtx && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSubmitCtx(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] overflow-y-auto p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 truncate">Submit {submitCtx.prefill?.candidate}</h3>
                <p className="text-xs text-gray-500 truncate">{submitCtx.pos_name} · {submitCtx.client}</p>
              </div>
              <button onClick={() => setSubmitCtx(null)} className="text-gray-400 hover:text-gray-700 flex-shrink-0"><X size={20} /></button>
            </div>
            <SubmitCandidateTabs
              pos_id={submitCtx.pos_id} client={submitCtx.client} clientspoc={submitCtx.clientspoc}
              pos_name={submitCtx.pos_name} hr_name={submitCtx.hr_name} prefill={submitCtx.prefill}
              onClose={() => setSubmitCtx(null)}
              onSubmitted={() => { setSubmitCtx(null); load(); }}
            />
          </div>
        </div>
      )}

    </DashShell>
  );
}
