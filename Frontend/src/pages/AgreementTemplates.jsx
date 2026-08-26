import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileSignature, RefreshCw, Plus, X } from 'lucide-react';

// SuperAdmin → agreement wording, per user type.
// Until a role is saved AND made live, its agreement page keeps using the
// built-in copy — so nothing changes on the strength of a half-finished edit.

const RoleEditor = ({ role, onSaved }) => {
  const [intro, setIntro] = useState(role.intro || '');
  const [clauses, setClauses] = useState(
    role.clauses?.length ? role.clauses : [{ id: 'clause1', title: '', content: [''] }]
  );
  const [enabled, setEnabled] = useState(role.enabled === true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const setClause = (i, k, v) => setClauses(cs => cs.map((c, j) => j === i ? { ...c, [k]: v } : c));
  const addClause = () => setClauses(cs => [...cs, { id: `clause${cs.length + 1}`, title: '', content: [''] }]);
  const removeClause = (i) => setClauses(cs => cs.length > 1 ? cs.filter((_, j) => j !== i) : cs);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const payload = {
        intro, enabled,
        clauses: clauses
          .map((c, i) => ({
            id: c.id || `clause${i + 1}`,
            title: c.title,
            // Each line of the box becomes a line of the clause.
            content: (Array.isArray(c.content) ? c.content.join('\n') : c.content || '')
              .split('\n').map(l => l.trim()).filter(Boolean),
          }))
          .filter(c => c.title.trim() || c.content.length),
      };
      const r = await axios.put(`/api/agreement-templates/${role.key}`, payload, { withCredentials: true });
      setMsg({ ok: true, text: r.data?.message || 'Saved.' });
      onSaved();
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.message || 'Could not save.' });
    } finally { setSaving(false); setTimeout(() => setMsg(null), 5000); }
  };

  return (
    <div className="p-5 border-t border-gray-100 bg-gray-50/60">
      <label className="text-xs font-semibold text-gray-600 block mb-1.5">
        Opening paragraph <span className="text-gray-400">(optional)</span>
      </label>
      <textarea value={intro} onChange={e => setIntro(e.target.value)} rows={2}
        placeholder="Shown above the clauses."
        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none resize-y" />

      <p className="text-xs font-semibold text-gray-600 mt-4 mb-2">Clauses</p>
      <div className="space-y-3">
        {clauses.map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 w-6">{i + 1}.</span>
              <input value={c.title} onChange={e => setClause(i, 'title', e.target.value)}
                placeholder="Clause heading"
                className="flex-1 h-9 border-2 border-gray-200 rounded-lg px-3 text-sm font-semibold focus:border-blue-500 outline-none" />
              {clauses.length > 1 && (
                <button onClick={() => removeClause(i)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                  <X size={15} />
                </button>
              )}
            </div>
            <textarea
              value={Array.isArray(c.content) ? c.content.join('\n') : (c.content || '')}
              onChange={e => setClause(i, 'content', e.target.value.split('\n'))}
              rows={4}
              placeholder="One line per point. Start a line with • for a bullet."
              className="mt-2 w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none resize-y" />
          </div>
        ))}
      </div>

      <button onClick={addClause}
        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50">
        <Plus size={13} /> Add clause
      </button>

      <label className="flex items-center gap-2 mt-4 cursor-pointer">
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)}
          className="w-4 h-4 accent-green-600" />
        <span className="text-xs font-semibold text-gray-700">
          Live — use this wording instead of the built-in copy
        </span>
      </label>

      {role.key === 'vendor' && (
        <p className="mt-3 text-[11px] text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          A vendor's payment terms are added automatically from what you set when approving them —
          you do not need a clause for those.
        </p>
      )}

      {msg && <p className={`mt-3 text-xs font-semibold ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}

      <button onClick={save} disabled={saving}
        className="mt-4 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50">
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
};

export default function AgreementTemplates() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  const load = () => {
    setLoading(true);
    axios.get('/api/agreement-templates', { withCredentials: true })
      .then(r => { setRoles(r.data?.roles || []); setError(''); })
      .catch(e => setError(e.response?.data?.message || 'Could not load agreements.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 mb-5 shadow-lg flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSignature size={20} /> Agreements
          </h2>
          <p className="text-white/80 text-sm mt-1">
            The wording each user type accepts. Until a version is live, the built-in copy is used.
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 text-sm">{error}</div>
      ) : (
        <div className="space-y-3">
          {roles.map(r => (
            <div key={r.key} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button onClick={() => setOpen(open === r.key ? null : r.key)}
                className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-gray-50">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{r.label}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      r.enabled ? 'bg-green-100 text-green-700'
                        : r.hasTemplate ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-500'}`}>
                      {r.enabled ? '● Live' : r.hasTemplate ? 'Draft' : 'Using built-in copy'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {r.clauses?.length ? `${r.clauses.length} clauses` : 'No custom clauses yet'}
                    {r.updatedAt && ` · edited ${new Date(r.updatedAt).toLocaleDateString('en-IN')}`}
                  </p>
                </div>
                <span className="text-gray-400 text-sm">{open === r.key ? '▴' : '▾'}</span>
              </button>
              {open === r.key && <RoleEditor role={r} onSaved={load} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
