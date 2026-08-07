import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Briefcase, Loader2, CheckCircle2, XCircle, UserCheck, KeyRound, Copy } from 'lucide-react';

// SuperAdmin/Admin review queue for publicly-posted jobs. Approving auto-creates the
// company (login + assigned ClientSPOC) and routes the position to that SPOC.
export default function SuperAdminPublicJobs() {
  const [list, setList] = useState(null);
  const [spocs, setSpocs] = useState([]);
  const [draft, setDraft] = useState({});      // id -> { email, password, spoc }
  const [busy, setBusy] = useState({});
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [approved, setApproved] = useState({}); // id -> credentials

  const load = useCallback(async () => {
    setError('');
    try {
      const [p, s] = await Promise.all([
        axios.get('/api/public-job/admin/pending', { withCredentials: true }),
        axios.get('/api/public-job/admin/clientspocs', { withCredentials: true }),
      ]);
      setList(p.data.positions || []);
      setSpocs(s.data.clientspocs || []);
    } catch (e) { setList([]); setError(e.response?.data?.message || 'Failed to load. SuperAdmin access required.'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setField = (id, k, v) => setDraft(d => ({ ...d, [id]: { ...d[id], [k]: v } }));

  const approve = async (job) => {
    const d = draft[job.id] || {};
    const email = (d.email !== undefined ? d.email : job.posterEmail) || '';
    const spoc = spocs.find(s => s.email === d.spoc);
    if (!email || !d.password || !d.spoc) { setError('Enter a login email, password and assign a ClientSPOC.'); return; }
    setBusy(b => ({ ...b, [job.id]: true })); setError('');
    try {
      const r = await axios.post(`/api/public-job/admin/approve/${job.id}`, {
        companyEmail: email, password: d.password, clientspocEmail: d.spoc, clientspocName: spoc?.name || '',
      }, { withCredentials: true });
      setApproved(a => ({ ...a, [job.id]: r.data.credentials }));
      setList(l => l.filter(x => x.id !== job.id));
    } catch (e) { setError(e.response?.data?.message || 'Failed to approve.'); }
    finally { setBusy(b => { const n = { ...b }; delete n[job.id]; return n; }); }
  };

  const reject = async (id) => {
    if (!reason.trim()) return;
    setBusy(b => ({ ...b, [id]: true }));
    try { await axios.post(`/api/public-job/admin/reject/${id}`, { reason: reason.trim() }, { withCredentials: true }); setRejecting(null); setReason(''); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Failed to reject.'); }
    finally { setBusy(b => { const n = { ...b }; delete n[id]; return n; }); }
  };

  const loc = (p) => (Array.isArray(p.location) ? p.location.join(', ') : p.location) || '—';

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white flex-shrink-0"><Briefcase size={22} /></div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Public Job Requests</h1>
          <p className="text-sm text-gray-500">Jobs posted from the public page. Approving creates the company login and routes the position to the assigned ClientSPOC.</p>
        </div>
      </div>

      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      {/* Freshly approved — show credentials to share */}
      {Object.entries(approved).map(([id, cred]) => (
        <div key={id} className="mb-3 text-sm bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 font-semibold text-green-800"><CheckCircle2 size={16} /> Approved & company created</div>
          <div className="mt-1 text-green-900">Share these login details: <b>{cred.email}</b> / <b>{cred.password}</b>
            <button onClick={() => navigator.clipboard?.writeText(`Login: ${cred.email}\nPassword: ${cred.password}\nURL: https://www.recruiterv.com/company`)} className="ml-2 inline-flex items-center gap-1 text-xs text-green-700 hover:underline"><Copy size={12} /> copy</button>
          </div>
        </div>
      ))}

      {!list ? (
        <div className="py-16 grid place-items-center text-gray-400"><Loader2 size={26} className="animate-spin" /></div>
      ) : list.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">No pending public job requests.</div>
      ) : (
        <div className="space-y-3">
          {list.map(job => {
            const d = draft[job.id] || {};
            return (
              <div key={job.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900">{job.position} <span className="text-xs text-gray-400">#{job.pos_id}</span></div>
                    <div className="text-xs text-gray-500 mt-0.5">{job.companyName} · {job.skill_category || '—'} · {loc(job)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Posted by {job.posterName || '—'} · {job.posterEmail || '—'} · {job.posterPhone || '—'}</div>
                    {!!(job.client_questions || []).length && <div className="text-xs text-indigo-600 mt-1">{job.client_questions.length} client requirement question(s)</div>}
                  </div>
                </div>

                <div className="mt-3 border-t border-gray-100 pt-3 grid sm:grid-cols-3 gap-2">
                  <label className="text-xs text-gray-500">Company login email
                    <input value={d.email !== undefined ? d.email : (job.posterEmail || '')} onChange={e => setField(job.id, 'email', e.target.value)}
                      className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/30" />
                  </label>
                  <label className="text-xs text-gray-500"><span className="flex items-center gap-1"><KeyRound size={12} /> Password to share</span>
                    <input value={d.password || ''} onChange={e => setField(job.id, 'password', e.target.value)} placeholder="set a password"
                      className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/30" />
                  </label>
                  <label className="text-xs text-gray-500"><span className="flex items-center gap-1"><UserCheck size={12} /> Assign ClientSPOC</span>
                    <select value={d.spoc || ''} onChange={e => setField(job.id, 'spoc', e.target.value)}
                      className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/30">
                      <option value="">— select —</option>
                      {spocs.map(s => <option key={s.email} value={s.email}>{s.name} ({s.email})</option>)}
                    </select>
                  </label>
                </div>

                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => { setRejecting(rejecting === job.id ? null : job.id); setReason(''); }} disabled={!!busy[job.id]}
                    className="flex items-center gap-1 text-xs font-medium text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"><XCircle size={14} /> Reject</button>
                  <button onClick={() => approve(job)} disabled={!!busy[job.id]}
                    className="flex items-center gap-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1.5 disabled:opacity-60">
                    {busy[job.id] ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />} Approve & create company
                  </button>
                </div>

                {rejecting === job.id && (
                  <div className="mt-2 border-t border-gray-100 pt-2">
                    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Reason for rejection (required)…"
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-400/40" />
                    <div className="flex justify-end mt-2">
                      <button onClick={() => reject(job.id)} disabled={!reason.trim()} className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 disabled:opacity-50">Confirm reject</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
