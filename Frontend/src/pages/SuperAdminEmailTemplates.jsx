import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import {
  Mail, Loader2, Save, Send, RotateCcw, Search, CheckCircle2, Circle, Code2, Eye, Plus, Trash2,
  Bold, Italic, Underline, List, ListOrdered, Link2, Heading, Eraser,
  Image as ImageIcon, Upload
} from 'lucide-react';

const substitute = (str, vars = {}) =>
  (str || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''));
const detectVars = (...strs) => {
  const set = new Set(); const re = /\{\{\s*([\w.]+)\s*\}\}/g;
  strs.forEach(s => { let m; re.lastIndex = 0; while ((m = re.exec(s || ''))) set.add(m[1]); });
  return [...set];
};

// ── Rich text (WYSIWYG) editor with a raw-HTML toggle ────────────────────────
const RichEditor = forwardRef(({ resetToken, initialHtml, onChange }, ref) => {
  const el = useRef(null);
  const imgInput = useRef(null);
  const [source, setSource] = useState(false);

  useEffect(() => { if (el.current && !source) el.current.innerHTML = initialHtml || ''; /* eslint-disable-next-line */ }, [resetToken]);

  const emit = () => onChange(el.current?.innerHTML || '');
  const exec = (cmd, val = null) => { el.current?.focus(); document.execCommand(cmd, false, val); emit(); };

  useImperativeHandle(ref, () => ({
    insertText: (t) => {
      if (source) return false;        // parent handles textarea insertion
      el.current?.focus(); document.execCommand('insertText', false, t); emit(); return true;
    },
  }));

  const Btn = ({ onClick, title, children }) => (
    <button type="button" title={title} onMouseDown={e => e.preventDefault()} onClick={onClick}
      className="w-8 h-8 grid place-items-center rounded hover:bg-gray-100 text-gray-600">{children}</button>
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex items-center gap-0.5 flex-wrap border-b border-gray-200 bg-gray-50 px-1 py-1">
        <Btn title="Bold" onClick={() => exec('bold')}><Bold size={15} /></Btn>
        <Btn title="Italic" onClick={() => exec('italic')}><Italic size={15} /></Btn>
        <Btn title="Underline" onClick={() => exec('underline')}><Underline size={15} /></Btn>
        <Btn title="Heading" onClick={() => exec('formatBlock', 'H2')}><Heading size={15} /></Btn>
        <Btn title="Bulleted list" onClick={() => exec('insertUnorderedList')}><List size={15} /></Btn>
        <Btn title="Numbered list" onClick={() => exec('insertOrderedList')}><ListOrdered size={15} /></Btn>
        <Btn title="Link" onClick={() => { const u = window.prompt('Link URL'); if (u) exec('createLink', u); }}><Link2 size={15} /></Btn>
        {/* Image / QR code. Email clients can't load local files, so an uploaded
            image is embedded as a data URI and a pasted URL is used as-is. */}
        <Btn title="Insert image by URL" onClick={() => {
          const u = window.prompt('Image URL (QR code, logo, banner…)');
          if (!u) return;
          const w = window.prompt('Width in pixels (blank = original)', '160');
          const width = w && /^\d+$/.test(w.trim()) ? ` width="${w.trim()}"` : '';
          exec('insertHTML', `<img src="${u}"${width} style="max-width:100%;height:auto;" alt="" />`);
        }}><ImageIcon size={15} /></Btn>
        <Btn title="Upload image / QR (embedded in the email)" onClick={() => imgInput.current?.click()}><Upload size={15} /></Btn>
        <input ref={imgInput} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0]; if (!f) return;
            if (f.size > 200 * 1024) {
              alert('Please use an image under 200 KB — larger images get clipped by email clients (Gmail clips messages over ~102 KB of HTML).');
              e.target.value = ''; return;
            }
            const r = new FileReader();
            r.onload = () => {
              exec('insertHTML', `<img src="${r.result}" width="160" style="max-width:100%;height:auto;" alt="" />`);
              e.target.value = '';
            };
            r.readAsDataURL(f);
          }} />
        <Btn title="Clear formatting" onClick={() => exec('removeFormat')}><Eraser size={15} /></Btn>
        <button type="button" onClick={() => { if (source) { /* leaving source: re-render handled by parent reset */ } setSource(s => !s); }}
          className={`ml-auto text-xs font-semibold px-2 py-1 rounded ${source ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          <Code2 size={13} className="inline mr-1" />{source ? 'Rich text' : 'HTML'}
        </button>
      </div>
      {source ? (
        <textarea value={initialHtml || ''} spellCheck={false}
          onChange={e => onChange(e.target.value)}
          className="w-full h-[300px] text-[12px] font-mono px-3 py-2 outline-none resize-vertical" />
      ) : (
        <div ref={el} contentEditable suppressContentEditableWarning onInput={emit}
          className="w-full h-[300px] overflow-y-auto text-sm px-3 py-2 outline-none"
          style={{ lineHeight: 1.6 }} />
      )}
    </div>
  );
});

const emptyDraft = { key: null, name: '', recipient: 'Custom', subject: '', htmlBody: '', variables: [], sample: {}, enabled: true, custom: true };

const SuperAdminEmailTemplates = () => {
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('view');          // 'view' | 'edit' | 'create'
  const [tpl, setTpl] = useState(null);
  const [loadingTpl, setLoadingTpl] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [resetToken, setResetToken] = useState(0);
  const [recipients, setRecipients] = useState([]);
  const [varCatalog, setVarCatalog] = useState([]);
  const editorRef = useRef(null);

  useEffect(() => {
    axios.get('/api/email-templates/meta', { withCredentials: true })
      .then(r => { setRecipients(r.data?.recipients || []); setVarCatalog(r.data?.variables || []); })
      .catch(() => {});
  }, []);

  const fetchList = useCallback(() => {
    setLoadingList(true);
    axios.get('/api/email-templates/list', { withCredentials: true })
      .then(r => setList(r.data?.templates || []))
      .catch(() => setList([]))
      .finally(() => setLoadingList(false));
  }, []);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openTpl = (key) => {
    setMode('edit'); setLoadingTpl(true); setMsg(null); setTpl(null);
    axios.get(`/api/email-templates/${key}`, { withCredentials: true })
      .then(r => { setTpl(r.data?.template || null); setResetToken(t => t + 1); })
      .catch(() => setTpl(null))
      .finally(() => setLoadingTpl(false));
  };
  const newTemplate = () => { setMode('create'); setMsg(null); setTpl({ ...emptyDraft }); setResetToken(t => t + 1); };

  const setField = (k, v) => setTpl(t => ({ ...t, [k]: v }));

  const insertVar = (v) => {
    const token = `{{${v}}}`;
    if (editorRef.current && editorRef.current.insertText(token)) return;  // rich mode handled it
    setTpl(t => ({ ...t, htmlBody: (t.htmlBody || '') + token }));         // source/fallback
  };

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      if (mode === 'create') {
        const r = await axios.post('/api/email-templates/create',
          { name: tpl.name, recipient: tpl.recipient, subject: tpl.subject, htmlBody: tpl.htmlBody },
          { withCredentials: true });
        setMsg({ type: 'ok', text: 'Template created.' });
        fetchList();
        openTpl(r.data.key);
      } else {
        await axios.put(`/api/email-templates/${tpl.key}`,
          { name: tpl.name, recipient: tpl.recipient, subject: tpl.subject, htmlBody: tpl.htmlBody, enabled: tpl.enabled },
          { withCredentials: true });
        setMsg({ type: 'ok', text: 'Saved.' });
        fetchList();
      }
    } catch (e) { setMsg({ type: 'err', text: e.response?.data?.message || 'Save failed.' }); }
    finally { setSaving(false); }
  };

  const resetDefault = async () => {
    if (!window.confirm('Reset this template to the system default?')) return;
    try { await axios.post(`/api/email-templates/${tpl.key}/reset`, {}, { withCredentials: true }); openTpl(tpl.key); fetchList(); }
    catch (e) { setMsg({ type: 'err', text: e.response?.data?.message || 'Reset failed.' }); }
  };
  const deleteCustom = async () => {
    if (!window.confirm('Delete this custom template permanently?')) return;
    try { await axios.delete(`/api/email-templates/${tpl.key}`, { withCredentials: true }); setMode('view'); setTpl(null); fetchList(); }
    catch (e) { setMsg({ type: 'err', text: e.response?.data?.message || 'Delete failed.' }); }
  };
  const sendTest = async () => {
    setMsg(null);
    try {
      const key = tpl.key || (await axios.post('/api/email-templates/create', { name: tpl.name || 'Draft', recipient: tpl.recipient, subject: tpl.subject, htmlBody: tpl.htmlBody }, { withCredentials: true })).data.key;
      const r = await axios.post(`/api/email-templates/${key}/test`, { to: testEmail.trim(), subject: tpl.subject, htmlBody: tpl.htmlBody }, { withCredentials: true });
      setMsg({ type: 'ok', text: r.data?.message || 'Test sent.' });
      if (!tpl.key) { fetchList(); openTpl(key); }
    } catch (e) { setMsg({ type: 'err', text: e.response?.data?.message || 'Test failed.' }); }
  };

  const filtered = list.filter(t => !search ||
    [t.name, t.recipient, t.key].some(v => (v || '').toLowerCase().includes(search.toLowerCase())));

  const vars = tpl ? (tpl.variables?.length ? tpl.variables : detectVars(tpl.subject, tpl.htmlBody)) : [];
  const previewVars = tpl ? { ...Object.fromEntries(vars.map(v => [v, `[${v}]`])), ...(tpl.sample || {}) } : {};
  const previewHtml = tpl ? substitute(tpl.htmlBody, previewVars) : '';

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail size={20} className="text-gray-600" />
        <h1 className="text-lg font-bold text-gray-900">Email Templates</h1>
        <span className="text-xs text-gray-400 ml-1">{list.length} templates</span>
        <button onClick={newTemplate} className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
          <Plus size={15} /> New template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
        {/* List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
              <Search size={14} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates" className="bg-transparent text-sm outline-none w-full" />
            </div>
          </div>
          {loadingList ? (
            <div className="p-6 text-center text-gray-400 text-sm"><Loader2 size={16} className="animate-spin inline mr-1" /> Loading…</div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              {filtered.map(t => (
                <button key={t.key} onClick={() => openTpl(t.key)}
                  className={`w-full text-left px-3 py-2.5 border-b border-gray-50 flex items-center justify-between gap-2 ${tpl?.key === t.key && mode === 'edit' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <span className="min-w-0">
                    <span className={`block text-[13px] truncate ${tpl?.key === t.key && mode === 'edit' ? 'text-blue-700 font-semibold' : 'text-gray-800'}`}>
                      {t.name} {t.custom && <span className="text-[10px] bg-purple-100 text-purple-700 rounded px-1">custom</span>}
                    </span>
                    <span className="block text-[11px] text-gray-400">To: {t.recipient}</span>
                  </span>
                  {t.enabled ? <CheckCircle2 size={15} className="text-green-600 flex-shrink-0" /> : <Circle size={15} className="text-gray-300 flex-shrink-0" />}
                </button>
              ))}
              {!filtered.length && <div className="p-6 text-center text-gray-400 text-sm">No templates.</div>}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          {mode === 'view' ? (
            <div className="py-16 text-center text-gray-400 text-sm">Select a template to edit, or create a new one.</div>
          ) : loadingTpl || !tpl ? (
            <div className="py-16 text-center text-gray-400 text-sm"><Loader2 size={18} className="animate-spin inline mr-1" /> Loading…</div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 truncate">{mode === 'create' ? 'New template' : tpl.name}</div>
                  {mode === 'edit' && <div className="text-[11px] text-gray-400">To: {tpl.recipient} · {tpl.custom ? 'custom' : 'system'} · key: {tpl.key}</div>}
                </div>
                {mode === 'edit' && !tpl.custom && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer flex-shrink-0">
                    <input type="checkbox" checked={!!tpl.enabled} onChange={e => setField('enabled', e.target.checked)} /> Use custom template
                  </label>
                )}
              </div>

              {mode === 'edit' && !tpl.custom && !tpl.enabled && (
                <div className="mb-3 text-[12px] bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
                  Not active — the system default design is being sent. Tick "Use custom template" and Save to switch.
                </div>
              )}
              {msg && <div className={`mb-3 text-[12px] rounded-lg px-3 py-2 border ${msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{msg.text}</div>}

              {(mode === 'create' || tpl.custom) && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <label className="block"><span className="text-[12px] font-medium text-gray-500">Template name</span>
                    <input value={tpl.name || ''} onChange={e => setField('name', e.target.value)} className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" /></label>
                  <label className="block"><span className="text-[12px] font-medium text-gray-500">Recipient (user type)</span>
                    <select value={tpl.recipient || ''} onChange={e => setField('recipient', e.target.value)}
                      className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white">
                      <option value="">Select user type…</option>
                      {recipients.map(r => <option key={r} value={r}>{r}</option>)}
                      {tpl.recipient && !recipients.includes(tpl.recipient) && <option value={tpl.recipient}>{tpl.recipient}</option>}
                    </select></label>
                </div>
              )}

              <label className="text-[12px] font-medium text-gray-500 block mb-1">Subject</label>
              <input value={tpl.subject || ''} onChange={e => setField('subject', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 mb-3" />

              {vars.length > 0 && (<>
                <label className="text-[12px] font-medium text-gray-500 block mb-1.5">Used in this template · click to insert</label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {vars.map(v => (
                    <button key={v} onClick={() => insertVar(v)} className="text-[11px] bg-blue-50 text-blue-700 rounded-md px-2 py-1 hover:bg-blue-100">{`{{${v}}}`}</button>
                  ))}
                </div>
              </>)}

              {(mode === 'create' || tpl.custom) && varCatalog.length > 0 && (
                <details className="mb-3" open>
                  <summary className="text-[12px] font-medium text-gray-500 cursor-pointer mb-1.5">All available variables · click to insert</summary>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {varCatalog.map(v => (
                      <button key={v.name} onClick={() => insertVar(v.name)} title={v.desc}
                        className="text-[11px] bg-gray-100 text-gray-700 rounded-md px-2 py-1 hover:bg-blue-50 hover:text-blue-700">{`{{${v.name}}}`}</button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">Hover a variable to see what it means. Whatever you insert is filled in automatically when the email is sent (where that data is available).</p>
                </details>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-1 block">Body</label>
                  <RichEditor ref={editorRef} resetToken={resetToken} initialHtml={tpl.htmlBody} onChange={v => setField('htmlBody', v)} />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-1 flex items-center gap-1"><Eye size={13} /> Live preview</label>
                  <iframe title="preview" srcDoc={previewHtml} className="w-full h-[348px] border border-gray-300 rounded-lg bg-white" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {mode === 'create' ? 'Create template' : 'Save changes'}
                </button>
                {mode === 'edit' && !tpl.custom && (
                  <button onClick={resetDefault} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw size={15} /> Reset to default</button>
                )}
                {mode === 'edit' && tpl.custom && (
                  <button onClick={deleteCustom} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 size={15} /> Delete</button>
                )}
                <div className="flex items-center gap-1.5 ml-auto">
                  <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@email.com" className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 w-44" />
                  <button onClick={sendTest} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"><Send size={15} /> Send test</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminEmailTemplates;
