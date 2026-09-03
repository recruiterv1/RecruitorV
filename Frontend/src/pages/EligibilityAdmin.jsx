import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Plus, Trash2, Pencil, Save, X, Loader2, CheckCircle2, XCircle,
  Clock, Search, Download, AlertCircle,
} from 'lucide-react';

// SuperAdmin side of the eligibility check: the question bank, the per-role
// settings (timer, pass mark, messages) and every attempt taken.
// One component, three views, so the three menu entries stay in step.

const ROLES = ['Coach', 'Expert', 'Recruiter'];
const BLANK = { role: 'Recruiter', question: '', options: ['', '', '', ''], correctIndex: 0, active: true, order: 0 };

const Toast = ({ msg, onClose }) => msg ? (
  <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm mb-4 ${
    msg.bad ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-800'}`}>
    <span className="flex items-center gap-2">
      {msg.bad ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}{msg.text}
    </span>
    <button onClick={onClose}><X size={15} /></button>
  </div>
) : null;

const RoleTabs = ({ value, onChange, counts }) => (
  <div className="flex flex-wrap gap-2 mb-5">
    {['All', ...ROLES].map(r => (
      <button key={r} onClick={() => onChange(r === 'All' ? '' : r)}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
          (r === 'All' ? '' : r) === value
            ? 'bg-orange-500 text-white'
            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
        {r}{counts && counts[r] !== undefined ? ` (${counts[r]})` : ''}
      </button>
    ))}
  </div>
);

/* ── Questions ─────────────────────────────────────────────────────── */

export function EligibilityQuestions() {
  const [rows, setRows] = useState([]);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // question object or BLANK
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/eligibility/admin/questions', { withCredentials: true });
      setRows(r.data?.questions || []);
    } catch (e) {
      setMsg({ bad: true, text: e.response?.data?.message || 'Could not load questions.' });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setMsg(null);
    const body = { ...editing, options: editing.options.map(o => o.trim()).filter(Boolean) };
    if (body.correctIndex >= body.options.length) body.correctIndex = 0;
    try {
      if (editing.id) await axios.put(`/api/eligibility/admin/questions/${editing.id}`, body, { withCredentials: true });
      else await axios.post('/api/eligibility/admin/questions', body, { withCredentials: true });
      setMsg({ text: editing.id ? 'Question updated.' : 'Question added.' });
      setEditing(null);
      load();
    } catch (e) {
      setMsg({ bad: true, text: e.response?.data?.message || 'Could not save.' });
    } finally { setSaving(false); }
  };

  const remove = async (q) => {
    if (!window.confirm(`Delete this question?\n\n"${q.question}"\n\nThis cannot be undone. Attempts already taken keep their record.`)) return;
    try {
      await axios.delete(`/api/eligibility/admin/questions/${q.id}`, { withCredentials: true });
      setMsg({ text: 'Question deleted.' });
      load();
    } catch (e) {
      setMsg({ bad: true, text: e.response?.data?.message || 'Could not delete.' });
    }
  };

  const filtered = role ? rows.filter(r => r.role === role) : rows;
  const counts = useMemo(() => {
    const c = { All: rows.length };
    ROLES.forEach(r => { c[r] = rows.filter(x => x.role === r).length; });
    return c;
  }, [rows]);

  const field = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 outline-none';

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Eligibility Questions</h2>
          <p className="text-sm text-gray-500">Multiple-choice questions, per role. Only active questions are asked.</p>
        </div>
        <button onClick={() => setEditing({ ...BLANK, role: role || 'Recruiter' })}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold">
          <Plus size={15} /> Add Question
        </button>
      </div>

      <Toast msg={msg} onClose={() => setMsg(null)} />
      <RoleTabs value={role} onChange={setRole} counts={counts} />

      {editing && (
        <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 mb-5">
          <h3 className="font-bold text-gray-900 mb-4">{editing.id ? 'Edit question' : 'New question'}</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
              <select className={field} value={editing.role}
                onChange={(e) => setEditing(q => ({ ...q, role: e.target.value }))}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Order</label>
              <input type="number" className={field} value={editing.order ?? 0}
                onChange={(e) => setEditing(q => ({ ...q, order: e.target.value }))} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
                <input type="checkbox" className="accent-orange-500" checked={editing.active !== false}
                  onChange={(e) => setEditing(q => ({ ...q, active: e.target.checked }))} />
                Active (asked in the check)
              </label>
            </div>
          </div>

          <label className="block text-xs font-semibold text-gray-600 mb-1 mt-4">Question</label>
          <textarea rows={2} className={field} value={editing.question}
            onChange={(e) => setEditing(q => ({ ...q, question: e.target.value }))} />

          <label className="block text-xs font-semibold text-gray-600 mb-1 mt-4">
            Options — tick the correct answer
          </label>
          <div className="space-y-2">
            {editing.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correct" className="accent-orange-500"
                  checked={Number(editing.correctIndex) === i}
                  onChange={() => setEditing(q => ({ ...q, correctIndex: i }))} />
                <input className={field} value={opt} placeholder={`Option ${i + 1}`}
                  onChange={(e) => setEditing(q => {
                    const o = [...q.options]; o[i] = e.target.value; return { ...q, options: o };
                  })} />
                {editing.options.length > 2 && (
                  <button onClick={() => setEditing(q => {
                    const o = q.options.filter((_, j) => j !== i);
                    return { ...q, options: o, correctIndex: Math.min(q.correctIndex, o.length - 1) };
                  })} className="text-gray-400 hover:text-red-500"><X size={15} /></button>
                )}
              </div>
            ))}
          </div>
          {editing.options.length < 6 && (
            <button onClick={() => setEditing(q => ({ ...q, options: [...q.options, ''] }))}
              className="text-[12px] font-semibold text-orange-600 mt-2">+ Add option</button>
          )}

          <div className="flex gap-2 mt-5">
            <button onClick={save} disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(null)}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="py-16 text-center text-gray-500 text-sm">Loading…</p>
        ) : !filtered.length ? (
          <div className="py-16 text-center">
            <p className="font-semibold text-gray-600">No questions yet{role ? ` for ${role}` : ''}</p>
            <p className="text-sm text-gray-400 mt-1">
              The check stays unavailable for a role until it has at least one active question.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(q => (
              <div key={q.id} className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{q.role}</span>
                    {q.active === false && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Inactive</span>
                    )}
                    <span className="text-[11px] text-gray-400">#{q.order ?? 0}</span>
                  </div>
                  <p className="font-semibold text-gray-900 mt-1.5">{q.question}</p>
                  <div className="grid sm:grid-cols-2 gap-1.5 mt-2">
                    {(q.options || []).map((o, i) => (
                      <p key={i} className={`text-[12.5px] px-2.5 py-1.5 rounded-lg ${
                        i === q.correctIndex ? 'bg-green-50 text-green-800 font-semibold' : 'bg-gray-50 text-gray-600'}`}>
                        {i === q.correctIndex ? '✓ ' : ''}{o}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing({ ...q, options: [...(q.options || [])] })}
                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"><Pencil size={14} /></button>
                  <button onClick={() => remove(q)}
                    className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

/* ── Settings ──────────────────────────────────────────────────────── */

export function EligibilitySettings() {
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState('');
  const [msg, setMsg] = useState(null);

  const load = () => axios.get('/api/eligibility/admin/config', { withCredentials: true })
    .then(r => setCfg(r.data?.config || {}))
    .catch(e => setMsg({ bad: true, text: e.response?.data?.message || 'Could not load settings.' }));
  useEffect(() => { load(); }, []);

  const set = (role, k, v) => setCfg(c => ({ ...c, [role]: { ...c[role], [k]: v } }));

  const save = async (role) => {
    setSaving(role); setMsg(null);
    try {
      await axios.put(`/api/eligibility/admin/config/${role}`, cfg[role], { withCredentials: true });
      setMsg({ text: `${role} settings saved.` });
    } catch (e) {
      setMsg({ bad: true, text: e.response?.data?.message || 'Could not save.' });
    } finally { setSaving(''); }
  };

  if (!cfg) return <p className="py-16 text-center text-gray-500 text-sm">Loading…</p>;
  const field = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 outline-none';

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Eligibility Settings</h2>
      <p className="text-sm text-gray-500 mb-5">
        Time limit, pass mark and the messages shown at the end — set separately for each role.
      </p>
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <div className="space-y-5">
        {ROLES.map(role => {
          const c = cfg[role] || {};
          return (
            <div key={role} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="font-bold text-gray-900">{role}</h3>
                <span className="text-[12px] text-gray-500">
                  {c.activeQuestions ?? 0} active of {c.totalQuestions ?? 0} questions
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Time limit (minutes)</label>
                  <input type="number" min={1} max={240} className={field} value={c.timeLimitMinutes ?? 15}
                    onChange={(e) => set(role, 'timeLimitMinutes', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Pass mark (%)</label>
                  <input type="number" min={1} max={100} className={field} value={c.passPercent ?? 70}
                    onChange={(e) => set(role, 'passPercent', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Questions to ask</label>
                  <input type="number" min={0} className={field} value={c.questionCount ?? 0}
                    onChange={(e) => set(role, 'questionCount', e.target.value)} />
                  <p className="text-[11px] text-gray-400 mt-1">0 asks every active question.</p>
                </div>
              </div>

              <label className="block text-xs font-semibold text-gray-600 mb-1 mt-4">
                Success message — shown at {c.passPercent ?? 70}% and above
              </label>
              <textarea rows={2} className={field} value={c.successMessage ?? ''}
                onChange={(e) => set(role, 'successMessage', e.target.value)} />

              <label className="block text-xs font-semibold text-gray-600 mb-1 mt-4">
                Sorry message — shown below the pass mark
              </label>
              <textarea rows={2} className={field} value={c.sorryMessage ?? ''}
                onChange={(e) => set(role, 'sorryMessage', e.target.value)} />

              <button onClick={() => save(role)} disabled={saving === role}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold disabled:opacity-60">
                {saving === role ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving === role ? 'Saving…' : `Save ${role} settings`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Results ───────────────────────────────────────────────────────── */

export function EligibilityResults() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);       // the attempt opened in the modal
  const [detailLoading, setDetailLoading] = useState(false);

  // Open one attempt in full: every question, what the candidate ticked and
  // what the right answer was.
  const openDetail = async (row) => {
    setDetail({ row, attempt: null });
    setDetailLoading(true);
    try {
      const r = await axios.get(`/api/eligibility/admin/results/${row.id}`, { withCredentials: true });
      setDetail({ row, attempt: r.data?.attempt || null });
    } catch (e) {
      setDetail({ row, attempt: null, error: e.response?.data?.message || 'Could not load this attempt.' });
    } finally { setDetailLoading(false); }
  };

  const load = () => {
    setLoading(true);
    axios.get('/api/eligibility/admin/results', { withCredentials: true })
      .then(r => { setRows(r.data?.results || []); setSummary(r.data?.summary || {}); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c = { All: rows.length };
    ROLES.forEach(r => { c[r] = rows.filter(x => x.role === r).length; });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return rows.filter(r => {
      if (role && r.role !== role) return false;
      if (!n) return true;
      return [r.name, r.email, r.phone].some(v => String(v || '').toLowerCase().includes(n));
    });
  }, [rows, role, q]);

  const exportCsv = () => {
    const head = ['Name', 'Email', 'Phone', 'Role', 'Score %', 'Correct', 'Total', 'Result', 'Registered', 'Timed out', 'Started', 'Submitted'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const body = filtered.map(r => [r.name, r.email, r.phone, r.role, r.percent ?? '', r.correct ?? '', r.total ?? '',
      r.status !== 'submitted' ? 'Not submitted' : (r.passed ? 'Passed' : 'Failed'),
      r.passed ? (r.registered ? 'Yes' : 'No') : '',
      r.timedOut ? 'Yes' : 'No', r.startedAt || '', r.submittedAt || ''].map(esc).join(','));
    const blob = new Blob([[head.map(esc).join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `eligibility-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  const fmt = (v) => v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Eligibility Results</h2>
          <p className="text-sm text-gray-500">Every attempt taken, by role.</p>
        </div>
        <button onClick={exportCsv} disabled={!filtered.length}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold disabled:opacity-50">
          <Download size={15} /> Export
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
        {[['Attempts', summary.total, 'bg-white border-gray-200 text-gray-800'],
          ['Passed', summary.passed, 'bg-green-50 border-green-200 text-green-700'],
          ['Failed', summary.failed, 'bg-red-50 border-red-200 text-red-700'],
          ['Not submitted', summary.abandoned, 'bg-amber-50 border-amber-200 text-amber-700'],
          ['Registered', summary.registered, 'bg-indigo-50 border-indigo-200 text-indigo-700'],
          ['Passed, not registered', summary.notRegistered, 'bg-orange-50 border-orange-200 text-orange-700']].map(([l, v, cls]) => (
          <div key={l} className={`rounded-2xl border p-4 ${cls}`}>
            <p className="text-[11px] uppercase tracking-wider opacity-70">{l}</p>
            <p className="text-2xl font-bold mt-1">{v ?? 0}</p>
          </div>
        ))}
      </div>

      <RoleTabs value={role} onChange={setRole} counts={counts} />

      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone…"
          className="h-9 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-orange-400" />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="py-16 text-center text-gray-500 text-sm">Loading…</p>
        ) : !filtered.length ? (
          <p className="py-16 text-center text-gray-500 text-sm">
            {rows.length ? 'No attempts match these filters.' : 'Nobody has taken the check yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 font-semibold">Candidate</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Result</th>
                  <th className="px-4 py-3 font-semibold">Registered</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Started</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => (
                  <tr key={r.id} onClick={() => openDetail(r)}
                    className="hover:bg-gray-50/70 cursor-pointer"
                    title="Open this attempt">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{r.name}</p>
                      <p className="text-[11px] text-gray-500">{r.email}</p>
                      <p className="text-[11px] text-gray-400">{r.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.role}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.status === 'submitted'
                        ? <span className="font-bold text-gray-900">{r.percent}% <span className="font-normal text-gray-500">({r.correct}/{r.total})</span></span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.status !== 'submitted'
                        ? <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200"><Clock size={11} /> Not submitted</span>
                        : r.passed
                          ? <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200"><CheckCircle2 size={11} /> Passed</span>
                          : <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200"><XCircle size={11} /> Failed</span>}
                      {r.timedOut && <span className="block text-[10px] text-amber-600 mt-1">timed out</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {!r.passed
                        ? <span className="text-gray-300 text-[11px]">—</span>
                        : r.registered
                          ? <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <CheckCircle2 size={11} /> Registered
                            </span>
                          : <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200"
                              title="Cleared the check but has not created their account yet">
                              <Clock size={11} /> Not registered
                            </span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(r.startedAt)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(r.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* One attempt in full */}
      {detail && (
        <div onClick={() => setDetail(null)}
          className="fixed inset-0 z-[300] bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-3xl my-8 shadow-2xl">
            {/* Header — who, and how they scored */}
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{detail.row.name}</h3>
                  <p className="text-[13px] text-gray-500">{detail.row.email} · {detail.row.phone}</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">{detail.row.role} check</p>
                </div>
                <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {detail.row.status === 'submitted' ? `${detail.row.percent}%` : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Correct</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {detail.row.status === 'submitted' ? `${detail.row.correct}/${detail.row.total}` : '—'}
                  </p>
                </div>
                <div className={`rounded-xl border p-3 ${detail.row.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <p className="text-[10px] uppercase tracking-wider opacity-70">Result</p>
                  <p className={`text-sm font-bold mt-1.5 ${detail.row.passed ? 'text-green-700' : 'text-red-700'}`}>
                    {detail.row.status !== 'submitted' ? 'Not submitted' : detail.row.passed ? 'Passed' : 'Failed'}
                  </p>
                </div>
                <div className={`rounded-xl border p-3 ${detail.row.registered ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200'}`}>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Registered</p>
                  <p className={`text-sm font-bold mt-1.5 ${detail.row.registered ? 'text-indigo-700' : 'text-gray-500'}`}>
                    {!detail.row.passed ? '—' : detail.row.registered ? 'Registered' : 'Not registered'}
                  </p>
                </div>
              </div>
              {detail.row.timedOut && (
                <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                  Time ran out — whatever was selected at that point was submitted.
                </p>
              )}
            </div>

            {/* Every question, with what was ticked */}
            <div className="p-5 max-h-[55vh] overflow-y-auto">
              {detailLoading ? (
                <p className="py-10 text-center text-gray-500 text-sm">Loading the answers…</p>
              ) : detail.error ? (
                <p className="py-10 text-center text-red-600 text-sm">{detail.error}</p>
              ) : !detail.attempt?.detail?.length ? (
                <p className="py-10 text-center text-gray-500 text-sm">
                  {detail.row.status === 'submitted'
                    ? 'No answer breakdown was recorded for this attempt.'
                    : 'This attempt was never submitted, so there are no answers to show.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {detail.attempt.detail.map((d, i) => (
                    <div key={d.questionId || i}
                      className={`rounded-xl border p-4 ${d.correct ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'}`}>
                      <div className="flex items-start gap-3">
                        <span className={`flex-shrink-0 h-6 w-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center ${
                          d.correct ? 'bg-green-600' : 'bg-red-500'}`}>{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-[14px] whitespace-pre-wrap">{d.question}</p>
                          <div className="mt-3 space-y-1.5 text-[13px]">
                            <p className="text-green-800">
                              <span className="font-semibold">Correct answer:</span>{' '}
                              {(detail.attempt.questionOptions?.[d.questionId] || [])[d.correctIndex]
                                ?? `Option ${Number(d.correctIndex) + 1}`}
                            </p>
                            <p className={d.correct ? 'text-green-800' : 'text-red-700'}>
                              <span className="font-semibold">They ticked:</span>{' '}
                              {d.chosen === -1 || d.chosen === undefined || d.chosen === null
                                ? <em className="text-gray-500">left unanswered</em>
                                : ((detail.attempt.questionOptions?.[d.questionId] || [])[d.chosen]
                                    ?? `Option ${Number(d.chosen) + 1}`)}
                              {d.correct ? ' ✓' : ' ✕'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
