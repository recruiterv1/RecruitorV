import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, RefreshCw, Plus, Trash2, Pencil } from 'lucide-react';

// SuperAdmin → Announcements. Role-wise announcement bar content.

const TONE_STYLE = {
  info:     'bg-blue-100 text-blue-700',
  success:  'bg-green-100 text-green-700',
  warning:  'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

const fmt = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

const Editor = ({ item, roles, tones, onCancel, onSaved }) => {
  const isNew = !item?.id;
  const [text, setText] = useState(item?.text || '');
  const [picked, setPicked] = useState(item?.roles || ['all']);
  const [tone, setTone] = useState(item?.tone || 'info');
  const [link, setLink] = useState(item?.link || '');
  const [enabled, setEnabled] = useState(item?.enabled ?? true);
  const [startsAt, setStartsAt] = useState(fmt(item?.startsAt));
  const [endsAt, setEndsAt] = useState(fmt(item?.endsAt));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // 'Everyone' and the individual roles are mutually exclusive — picking one
  // clears the other, so the audience is never ambiguous.
  const toggleRole = (key) => {
    setPicked(prev => {
      if (key === 'all') return ['all'];
      const next = prev.filter(r => r !== 'all');
      return next.includes(key) ? next.filter(r => r !== key) : [...next, key];
    });
  };

  const save = async () => {
    setSaving(true); setErr('');
    const payload = {
      text, roles: picked, tone, link, enabled,
      startsAt: startsAt || null, endsAt: endsAt || null,
    };
    try {
      if (isNew) await axios.post('/api/announcements', payload, { withCredentials: true });
      else await axios.put(`/api/announcements/${item.id}`, payload, { withCredentials: true });
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not save.');
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-sm p-5 mb-4">
      <h3 className="font-bold text-gray-900 mb-3">{isNew ? 'New announcement' : 'Edit announcement'}</h3>

      <label className="text-xs font-semibold text-gray-600 block mb-1.5">Announcement text</label>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={2} maxLength={500}
        placeholder="e.g. Payouts for March will be processed on 5 April."
        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none resize-y" />
      <p className="text-[11px] text-gray-400 mt-1">{text.length}/500</p>

      <label className="text-xs font-semibold text-gray-600 block mt-4 mb-1.5">Show to</label>
      <div className="flex flex-wrap gap-1.5">
        {roles.map(r => {
          const on = picked.includes(r.key);
          return (
            <button key={r.key} type="button" onClick={() => toggleRole(r.key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                on ? 'bg-blue-600 text-white border-blue-600'
                   : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
              {r.label}
            </button>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">Style</label>
          <select value={tone} onChange={e => setTone(e.target.value)}
            className="w-full h-9 border-2 border-gray-200 rounded-lg px-2 text-sm bg-white focus:border-blue-500 outline-none">
            {tones.map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">Link (optional)</label>
          <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://…"
            className="w-full h-9 border-2 border-gray-200 rounded-lg px-3 text-sm focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">Start (optional)</label>
          <input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)}
            className="w-full h-9 border-2 border-gray-200 rounded-lg px-2 text-sm focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">End (optional)</label>
          <input type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)}
            className="w-full h-9 border-2 border-gray-200 rounded-lg px-2 text-sm focus:border-blue-500 outline-none" />
        </div>
      </div>

      <label className="flex items-center gap-2 mt-4 cursor-pointer">
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)}
          className="w-4 h-4 accent-green-600" />
        <span className="text-xs font-semibold text-gray-700">Live — show this in the bar</span>
      </label>

      {text.trim() && (
        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Preview</p>
          <div className={`rounded-lg px-3 py-2 text-sm text-white bg-gradient-to-r ${
            tone === 'success' ? 'from-green-600 to-emerald-600'
            : tone === 'warning' ? 'from-amber-500 to-orange-500'
            : tone === 'critical' ? 'from-red-600 to-rose-600'
            : 'from-blue-600 to-indigo-600'}`}>
            📣 {text}
          </div>
        </div>
      )}

      {err && <p className="mt-3 text-xs font-semibold text-red-600">{err}</p>}

      <div className="flex gap-2 mt-4">
        <button onClick={save} disabled={saving || !text.trim() || !picked.length}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-40">
          {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default function AnnouncementsAdmin() {
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tones, setTones] = useState(['info', 'success', 'warning', 'critical']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);   // announcement object, or {} for new

  const load = () => {
    setLoading(true);
    axios.get('/api/announcements', { withCredentials: true })
      .then(r => {
        setItems(r.data?.announcements || []);
        setRoles(r.data?.roles || []);
        if (r.data?.tones?.length) setTones(r.data.tones);
        setError('');
      })
      .catch(e => setError(e.response?.data?.message || 'Could not load announcements.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const remove = async (a) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await axios.delete(`/api/announcements/${a.id}`, { withCredentials: true });
      load();
    } catch (e) { alert(e.response?.data?.message || 'Could not delete.'); }
  };

  const toggleLive = async (a, enabled) => {
    setItems(prev => prev.map(x => x.id === a.id ? { ...x, enabled } : x));
    try {
      await axios.put(`/api/announcements/${a.id}`, { ...a, enabled }, { withCredentials: true });
    } catch (e) {
      setItems(prev => prev.map(x => x.id === a.id ? { ...x, enabled: !enabled } : x));
      alert(e.response?.data?.message || 'Could not update.');
    }
  };

  const roleLabel = (k) => roles.find(r => r.key === k)?.label || k;
  const liveCount = items.filter(a => a.enabled).length;

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 mb-5 shadow-lg flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone size={20} /> Announcements
          </h2>
          <p className="text-white/80 text-sm mt-1">
            Scrolling bar at the top of each dashboard. {liveCount} of {items.length} live.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing({})}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-50">
            <Plus size={16} /> New
          </button>
          <button onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {editing && (
        <Editor item={editing} roles={roles} tones={tones}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }} />
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 text-sm">{error}</div>
      ) : !items.length ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-sm text-gray-500">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TONE_STYLE[a.tone] || TONE_STYLE.info}`}>
                      {a.tone}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      a.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {a.enabled ? '● Live' : '○ Off'}
                    </span>
                    {(a.startsAt || a.endsAt) && (
                      <span className="text-[11px] text-gray-400">
                        {a.startsAt ? fmt(a.startsAt) : '…'} → {a.endsAt ? fmt(a.endsAt) : '…'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800">{a.text}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {a.roles.map(r => (
                      <span key={r} className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5">
                        {roleLabel(r)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={a.enabled} onChange={e => toggleLive(a, e.target.checked)}
                      className="w-4 h-4 accent-green-600" />
                    <span className="text-xs font-semibold text-gray-700">Live</span>
                  </label>
                  <button onClick={() => setEditing(a)} title="Edit"
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(a)} title="Delete"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
