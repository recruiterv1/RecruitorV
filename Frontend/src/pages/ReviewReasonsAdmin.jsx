import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ListChecks, Plus, Pencil, Trash2, Loader2, X, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';

// Rejection and approval reasons, as an admin sees them.
//
// A rejection reason is not just a label: each carries the guidance email the
// recruiter receives when a candidate is rejected for it. They are edited
// together here, because changing one without the other is how the original
// hard-coded list drifted out of step with its emails.
export default function ReviewReasonsAdmin() {
  const [rows, setRows] = useState([]);
  const [kind, setKind] = useState('reject');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [editing, setEditing] = useState(null);   // row, or {} for a new one

  const load = useCallback(async () => {
    try {
      const r = await axios.get('/api/review-reasons/admin', { withCredentials: true });
      setRows(r.data?.reasons || []);
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.message || 'Could not load the reasons.' });
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (row) => {
    if (!window.confirm(`Remove "${row.label}"? Candidates already rejected for it keep the label.`)) return;
    try {
      const r = await axios.delete(`/api/review-reasons/admin/${row.id}`, { withCredentials: true });
      setMsg({ ok: true, text: r.data?.message || 'Removed.' });
      await load();
    } catch (e) { setMsg({ ok: false, text: e?.response?.data?.message || 'Could not remove it.' }); }
  };

  const toggle = async (row) => {
    try {
      await axios.put(`/api/review-reasons/admin/${row.id}`, { active: !row.active }, { withCredentials: true });
      await load();
    } catch (e) { setMsg({ ok: false, text: e?.response?.data?.message || 'Could not update it.' }); }
  };

  const list = rows.filter(r => r.kind === kind);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <ListChecks size={20} className="text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">Review Reasons</h1>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        The reasons a Client SPOC or coach picks from when they approve or reject a candidate.
      </p>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-2">
          {[['reject', 'Rejection'], ['approve', 'Approval']].map(([k, label]) => (
            <button key={k} onClick={() => setKind(k)}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold border-2 transition ${
                kind === k ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {label} ({rows.filter(r => r.kind === k).length})
            </button>
          ))}
        </div>
        <button onClick={() => setEditing({ kind, label: '', guidance: '', active: true })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-bold">
          <Plus size={15} /> Add a reason
        </button>
      </div>

      {msg && <p className={`mb-4 text-sm font-semibold ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}

      {loading ? (
        <p className="flex items-center gap-2 text-gray-400 text-sm py-8"><Loader2 size={15} className="animate-spin" /> Loading…</p>
      ) : !list.length ? (
        <div className="text-center py-14 text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-sm">
            {kind === 'approve'
              ? 'No approval reasons yet — reviewers type their own words until you add some.'
              : 'No rejection reasons yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map(r => (
            <div key={r.id} className={`rounded-xl border-2 p-3.5 ${r.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`font-bold text-[14px] ${r.active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                    {r.label}
                  </p>
                  {r.kind === 'reject' && (
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      {r.guidance
                        ? `Guidance email: ${r.guidance.slice(0, 90).replace(/\n/g, ' ')}…`
                        : 'No guidance email — the recruiter gets the standard rejection notice.'}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => toggle(r)} title={r.active ? 'Hide from the dropdown' : 'Show in the dropdown'}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                    {r.active ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button onClick={() => setEditing(r)} title="Edit"
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(r)} title="Remove"
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal row={editing} onClose={() => setEditing(null)}
          onDone={async (t) => { setEditing(null); setMsg({ ok: true, text: t }); await load(); }} />
      )}
    </div>
  );
}

function EditModal({ row, onClose, onDone }) {
  const isNew = !row.id;
  const [label, setLabel] = useState(row.label || '');
  const [guidance, setGuidance] = useState(row.guidance || '');
  const [kind, setKind] = useState(row.kind || 'reject');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!label.trim()) return setErr('A label is required.');
    setBusy(true); setErr('');
    try {
      if (isNew) {
        await axios.post('/api/review-reasons/admin', { kind, label, guidance }, { withCredentials: true });
        onDone('Reason added.');
      } else {
        await axios.put(`/api/review-reasons/admin/${row.id}`, { label, guidance }, { withCredentials: true });
        onDone('Reason updated.');
      }
    } catch (e) { setErr(e?.response?.data?.message || 'Could not save.'); }
    finally { setBusy(false); }
  };

  const field = 'w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none';

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="font-bold text-gray-900">{isNew ? 'Add a reason' : 'Edit reason'}</p>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-3.5">
          {isNew && (
            <div className="flex gap-2">
              {[['reject', 'Rejection', XCircle], ['approve', 'Approval', CheckCircle2]].map(([k, l, Icon]) => (
                <button key={k} onClick={() => setKind(k)}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold border-2 ${
                    kind === k ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                  <Icon size={15} /> {l}
                </button>
              ))}
            </div>
          )}

          <div>
            <label className="text-[12.5px] font-bold text-gray-700">
              Label <span className="text-red-500">*</span>
            </label>
            <input className={field + ' mt-1'} value={label} onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Skill Mismatch" />
            {!isNew && (
              <p className="text-[11.5px] text-amber-700 mt-1">
                Renaming this does not change candidates already rejected for it — they keep the old label.
              </p>
            )}
          </div>

          {kind === 'reject' && (
            <div>
              <label className="text-[12.5px] font-bold text-gray-700">Guidance email to the recruiter</label>
              <p className="text-[11.5px] text-gray-500 mb-1">
                Sent when a candidate is rejected for this reason. Leave blank and they get the
                standard rejection notice. Blank lines separate paragraphs.
              </p>
              <textarea className={field + ' font-mono text-[12.5px]'} rows={12}
                value={guidance} onChange={e => setGuidance(e.target.value)}
                placeholder="Thank you for sharing this profile…" />
            </div>
          )}

          {err && <p className="text-[13px] font-semibold text-red-600">{err}</p>}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 text-[13px] font-bold">Cancel</button>
          <button onClick={save} disabled={busy}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-bold disabled:opacity-60">
            {busy ? 'Saving…' : isNew ? 'Add reason' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
