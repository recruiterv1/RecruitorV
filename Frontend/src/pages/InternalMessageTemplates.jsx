import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, RefreshCw, Send, Eye } from 'lucide-react';

// SuperAdmin → Internal Message Templates.
// Four in-app events can send an automatic chat message. Nothing is sent until
// the template is written AND switched live here.

const TemplateCard = ({ t, onSaved }) => {
  const [body, setBody] = useState(t.body || '');
  const [enabled, setEnabled] = useState(t.enabled === true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);        // { ok, text }
  const [preview, setPreview] = useState('');
  const dirty = body !== (t.body || '') || enabled !== (t.enabled === true);

  const insertVar = (v) => setBody(b => `${b}${b && !b.endsWith(' ') ? ' ' : ''}{{${v}}}`);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const r = await axios.put(`/api/internal-templates/${t.key}`, { body, enabled }, { withCredentials: true });
      setMsg({ ok: true, text: r.data?.message || 'Saved.' });
      onSaved();
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.message || 'Could not save.' });
    } finally { setSaving(false); setTimeout(() => setMsg(null), 5000); }
  };

  const doPreview = async () => {
    try {
      const r = await axios.post(`/api/internal-templates/${t.key}/preview`, { body }, { withCredentials: true });
      setPreview(r.data?.preview || '');
    } catch { setPreview(''); }
  };

  const sendTest = async () => {
    setMsg(null);
    try {
      const r = await axios.post(`/api/internal-templates/${t.key}/test`, { body }, { withCredentials: true });
      setMsg({ ok: r.data?.success, text: r.data?.message || '' });
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.message || 'Could not send the test.' });
    } finally { setTimeout(() => setMsg(null), 6000); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900">{t.name}</h3>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              t.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {t.enabled ? '● Live' : '○ Not live'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">{t.description}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            From: {t.from} · To: {t.to}
            {t.updatedAt && ` · last saved ${new Date(t.updatedAt).toLocaleDateString('en-IN')}`}
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)}
            className="w-4 h-4 accent-green-600" />
          <span className="text-xs font-semibold text-gray-700">Live</span>
        </label>
      </div>

      <div className="p-5">
        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Message</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={4}
          placeholder={`e.g. Hi {{${t.variables[0]}}}, …`}
          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-y"
        />

        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[11px] text-gray-400 mr-1">Insert:</span>
          {t.variables.map(v => (
            <button key={v} type="button" onClick={() => insertVar(v)}
              className="text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 hover:bg-blue-100">
              {`{{${v}}}`}
            </button>
          ))}
        </div>

        {preview && (
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Preview with sample data</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{preview}</p>
          </div>
        )}

        {msg && (
          <p className={`mt-3 text-xs font-semibold ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>
        )}

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <button onClick={save} disabled={saving || !dirty}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-40">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={doPreview} disabled={!body.trim()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40">
            <Eye size={13} /> Preview
          </button>
          <button onClick={sendTest} disabled={!body.trim()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40">
            <Send size={13} /> Send test to me
          </button>
          {!enabled && body.trim() && (
            <span className="text-[11px] text-amber-600">Tick “Live” and save to start sending this.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function InternalMessageTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    axios.get('/api/internal-templates', { withCredentials: true })
      .then(r => { setTemplates(r.data?.templates || []); setError(''); })
      .catch(e => setError(e.response?.data?.message || 'Could not load templates.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const liveCount = templates.filter(t => t.enabled).length;

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 mb-5 shadow-lg flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare size={20} /> Internal Message Templates
          </h2>
          <p className="text-white/80 text-sm mt-1">
            Automatic messages into the recipient’s Messages inbox. {liveCount} of {templates.length} live.
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
        <p className="text-xs text-amber-900">
          A message is only sent once its template is written <b>and</b> ticked <b>Live</b>. Untick Live
          to stop that notification without losing the wording.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 text-sm">{error}</div>
      ) : (
        <div className="space-y-4">
          {templates.map(t => <TemplateCard key={t.key} t={t} onSaved={load} />)}
        </div>
      )}
    </div>
  );
}
