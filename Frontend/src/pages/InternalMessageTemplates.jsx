import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, RefreshCw, Send, Eye, Plus, Trash2, Users } from 'lucide-react';

// SuperAdmin → Internal Message Templates.
// Four in-app events can send an automatic chat message. Nothing is sent until
// the template is written AND switched live here.

// What each token resolves to, shown next to the insert buttons.
// Every variable a custom message can use, grouped so a long list stays
// readable. Clicking one appends it to the message being written.
const VariablePicker = ({ groups, onInsert }) => {
  const [open, setOpen] = useState(groups[0]?.group || '');
  if (!groups.length) return null;
  return (
    <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex flex-wrap gap-1 bg-gray-50 border-b border-gray-200 px-2 py-1.5">
        {groups.map(g => (
          <button key={g.group} type="button" onClick={() => setOpen(g.group)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              open === g.group ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
            {g.group} <span className="opacity-60">({g.variables.length})</span>
          </button>
        ))}
      </div>
      <div className="p-2.5 grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
        {(groups.find(g => g.group === open)?.variables || []).map(v => (
          <button key={v.key} type="button" onClick={() => onInsert(v.key)}
            title={`Insert {{${v.key}}} — ${v.label}`}
            className="text-left border border-blue-100 bg-blue-50/60 hover:bg-blue-100 rounded-lg px-2 py-1.5">
            <span className="block text-[11px] font-mono text-blue-700">{`{{${v.key}}}`}</span>
            <span className="block text-[10px] text-gray-500 truncate">{v.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const VAR_HELP = {
  name: "the person's full name",
  firstName: 'their first name',
  email: 'their email address',
  role: 'their role (recruiter, coach, …)',
};

// The tokens a custom message supports. Mirrors CUSTOM_VARIABLES in
// Backend/utils/internalMessage.js; used when the API list has not arrived yet.
const FALLBACK_GROUPS = [
  { group: 'Recipient', variables: [
    { key: 'name', label: 'Full name' }, { key: 'firstName', label: 'First name' },
    { key: 'email', label: 'Email address' }, { key: 'role', label: 'Role' },
  ] },
];

// Sample values for the live preview — mirrors what varsFor() produces on the
// server, so the preview reads like the real thing.
const SAMPLE_PERSON = {
  name: 'Rahul Sharma', firstName: 'Rahul', lastName: 'Sharma',
  email: 'rahul.sharma@example.com', phone: '98765 43210', role: 'recruiter',
  location: 'Pune, Maharashtra', skillCategory: 'Technology',
  experienceCategory: 'Experienced', company: 'Acme Consulting',
  designation: 'Senior Recruiter', joinedDate: '12 Mar 2026',
  siteUrl: 'https://www.recruiterv.com',
  loginUrl: 'https://www.recruiterv.com/log_rec',
  dashboardUrl: 'https://www.recruiterv.com/dash_rec',
  positionsUrl: 'https://www.recruiterv.com/dash_position',
  appDownloadUrl: 'https://www.recruiterv.com/get-app',
  profileUrl: 'https://www.recruiterv.com/dash_form',
  senderName: 'Super Admin', senderEmail: 'admin@recruiterv.com',
  platformName: 'RecruiterV', supportEmail: 'support@recruiterv.com',
  today: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  currentMonth: new Date().toLocaleDateString('en-IN', { month: 'long' }),
  currentYear: String(new Date().getFullYear()),
};

// Fill {{tokens}} with the sample person, matching what the server does per
// recipient at send time.
const previewWith = (body) =>
  String(body || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g,
    (_, k) => (SAMPLE_PERSON[k] !== undefined ? SAMPLE_PERSON[k] : ''));

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
            <button key={v} type="button"
              onClick={() => insertVar(v)}
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


// A template the SuperAdmin wrote themselves. No event fires it, so it is sent
// by hand to a chosen audience.
const CustomCard = ({ t, audiences, variableGroups, onChanged }) => {
  const [name, setName] = useState(t.name);
  const [body, setBody] = useState(t.body);
  const [audience, setAudience] = useState(t.audience || 'recruiters');
  const [recipients, setRecipients] = useState((t.recipients || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);
  const [count, setCount] = useState(null);

  const dirty = name !== t.name || body !== t.body || audience !== (t.audience || 'recruiters')
    || recipients !== (t.recipients || []).join(', ');

  const payload = () => ({
    name, body, audience,
    recipients: recipients.split(',').map(x => x.trim()).filter(Boolean),
  });

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const r = await axios.put(`/api/internal-templates/custom/${t.key}`, payload(), { withCredentials: true });
      setMsg({ ok: true, text: r.data?.message || 'Saved.' });
      onChanged();
    } catch (e) { setMsg({ ok: false, text: e.response?.data?.message || 'Could not save.' }); }
    finally { setSaving(false); setTimeout(() => setMsg(null), 5000); }
  };

  const checkAudience = async () => {
    setMsg(null); setCount(null);
    try {
      const r = await axios.get(`/api/internal-templates/custom/${t.key}/audience`, { withCredentials: true });
      setCount(r.data);
    } catch (e) { setMsg({ ok: false, text: e.response?.data?.message || 'Could not check the audience.' }); }
  };

  const send = async () => {
    if (dirty) { setMsg({ ok: false, text: 'Save your changes before sending.' }); return; }
    const c = count?.count;
    const who = c !== undefined ? `${c} ${c === 1 ? 'person' : 'people'}` : 'this audience';
    if (!window.confirm(`Send this message to ${who}? It lands in their Messages inbox and cannot be recalled.`)) return;
    setSending(true); setMsg(null);
    try {
      // The server delivers in chunks and hands back the next offset, so a large
      // audience never hangs on one request — keep going until it says done.
      let offset = 0, failedTotal = 0;
      for (;;) {
        const r = await axios.post(`/api/internal-templates/custom/${t.key}/send`,
          { confirm: true, offset }, { withCredentials: true });
        failedTotal += r.data?.failed || 0;
        setMsg({ ok: true, text: r.data?.message || 'Sending…' });
        if (r.data?.done || r.data?.nextOffset == null) {
          setMsg({
            ok: true,
            text: `Sent to ${r.data?.total ?? 0} ${r.data?.total === 1 ? 'person' : 'people'}` +
                  (failedTotal ? `, ${failedTotal} failed.` : '.'),
          });
          break;
        }
        offset = r.data.nextOffset;
      }
      onChanged();
    } catch (e) { setMsg({ ok: false, text: e.response?.data?.message || 'Could not send.' }); }
    finally { setSending(false); }
  };

  const remove = async () => {
    if (!window.confirm(`Delete the template “${t.name}”?`)) return;
    try {
      await axios.delete(`/api/internal-templates/custom/${t.key}`, { withCredentials: true });
      onChanged();
    } catch (e) { setMsg({ ok: false, text: e.response?.data?.message || 'Could not delete.' }); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <input value={name} onChange={e => setName(e.target.value)}
            className="font-bold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none w-full max-w-md" />
          <p className="text-[11px] text-gray-400 mt-1">
            Sent by hand · {t.lastSentAt
              ? `last sent to ${t.lastSentCount} on ${new Date(t.lastSentAt).toLocaleDateString('en-IN')}`
              : 'never sent'}
          </p>
        </div>
        <button onClick={remove} title="Delete template"
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="p-5">
        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Message</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-y" />

        <VariablePicker groups={variableGroups}
          onInsert={(k) => setBody(b => `${b}${b && !b.endsWith(' ') ? ' ' : ''}{{${k}}}`)} />

        {body.trim() && (
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Preview with sample data</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{previewWith(body)}</p>
          </div>
        )}

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Send to</label>
            <select value={audience} onChange={e => { setAudience(e.target.value); setCount(null); }}
              className="w-full h-9 border-2 border-gray-200 rounded-lg px-2 text-sm bg-white focus:border-blue-500 outline-none">
              {audiences.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
          </div>
          {audience === 'custom' && (
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Emails (comma separated)</label>
              <input value={recipients} onChange={e => { setRecipients(e.target.value); setCount(null); }}
                placeholder="one@x.com, two@y.com"
                className="w-full h-9 border-2 border-gray-200 rounded-lg px-3 text-sm focus:border-blue-500 outline-none" />
            </div>
          )}
        </div>

        {count && (
          <p className="mt-3 text-xs text-gray-600">
            Reaches <b>{count.count}</b> {count.count === 1 ? 'person' : 'people'}
            {count.sample?.length ? ` — e.g. ${count.sample.join(', ')}${count.count > count.sample.length ? '…' : ''}` : ''}
          </p>
        )}
        {msg && <p className={`mt-3 text-xs font-semibold ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <button onClick={save} disabled={saving || !dirty}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-40">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={checkAudience}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50">
            <Users size={13} /> Check audience
          </button>
          <button onClick={send} disabled={sending || dirty}
            title={dirty ? 'Save your changes first' : 'Send to the selected audience'}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-40">
            <Send size={13} /> {sending ? 'Sending…' : 'Send now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function InternalMessageTemplates() {
  const [templates, setTemplates] = useState([]);
  const [custom, setCustom] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [variableGroups, setVariableGroups] = useState(FALLBACK_GROUPS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBody, setNewBody] = useState('');
  const [createErr, setCreateErr] = useState('');

  const load = () => {
    setLoading(true);
    axios.get('/api/internal-templates', { withCredentials: true })
      .then(r => {
        setTemplates(r.data?.templates || []);
        setCustom(r.data?.custom || []);
        setAudiences(r.data?.audiences || []);
        setVariableGroups(r.data?.variableGroups?.length ? r.data.variableGroups : FALLBACK_GROUPS);
        setError('');
      })
      .catch(e => setError(e.response?.data?.message || 'Could not load templates.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const liveCount = templates.filter(t => t.enabled).length;

  const createTemplate = async () => {
    setCreateErr('');
    try {
      await axios.post('/api/internal-templates/custom',
        { name: newName, body: newBody, audience: 'recruiters' }, { withCredentials: true });
      setNewName(''); setNewBody(''); setCreating(false);
      load();
    } catch (e) { setCreateErr(e.response?.data?.message || 'Could not create the template.'); }
  };

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
        <>
          <h3 className="text-sm font-bold text-gray-700 mb-3">Event messages</h3>
          <div className="space-y-4">
            {templates.map(t => <TemplateCard key={t.key} t={t} onSaved={load} />)}
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap mt-8 mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-700">Your own messages</h3>
              <p className="text-xs text-gray-500">
                Templates you write yourself. These have no event behind them — send them when you want.
              </p>
            </div>
            <button onClick={() => setCreating(v => !v)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl">
              <Plus size={14} /> New Template
            </button>
          </div>

          {creating && (
            <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-sm p-5 mb-4">
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Template name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Monthly reminder to update profiles"
                className="w-full h-9 border-2 border-gray-200 rounded-lg px-3 text-sm focus:border-blue-500 outline-none mb-3" />
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Message</label>
              <textarea value={newBody} onChange={e => setNewBody(e.target.value)} rows={3}
                placeholder="Hi {{firstName}}, …"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none resize-y" />

              <VariablePicker groups={variableGroups}
                onInsert={(k) => setNewBody(b => `${b}${b && !b.endsWith(' ') ? ' ' : ''}{{${k}}}`)} />

              {newBody.trim() && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Preview with sample data</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{previewWith(newBody)}</p>
                </div>
              )}

              {createErr && <p className="mt-2 text-xs font-semibold text-red-600">{createErr}</p>}
              <div className="flex gap-2 mt-3">
                <button onClick={createTemplate} disabled={!newName.trim() || !newBody.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-40">
                  Create
                </button>
                <button onClick={() => { setCreating(false); setCreateErr(''); }}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {custom.length === 0 && !creating ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-500">No templates of your own yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {custom.map(t => (
                <CustomCard key={t.key} t={t} audiences={audiences} variableGroups={variableGroups} onChanged={load} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
