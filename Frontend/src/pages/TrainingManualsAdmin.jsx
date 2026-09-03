import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BookOpen, Plus, Pencil, Trash2, Save, X, Loader2, Image as ImageIcon,
  CheckCircle2, AlertCircle, ChevronRight, Eye, EyeOff,
} from 'lucide-react';

// SuperAdmin console for the training manuals — one manual per user type, each
// a list of steps with the menu path to click and an optional screenshot.

const ROLES = ['Recruiter', 'Coach', 'Expert', 'Vendor', 'ClientSPOC', 'Company', 'ConsultingFirm'];
const LABEL = {
  Recruiter: 'Recruiter', Coach: 'Coach', Expert: 'Expert', Vendor: 'Vendor',
  ClientSPOC: 'Client SPOC', Company: 'Company / HR', ConsultingFirm: 'Consulting Firm',
};
const blankStep = (role) => ({ role, section: 'Getting started', title: '', body: '', menuPath: '', imageUrl: '', order: 0 });

export default function TrainingManualsAdmin() {
  const [role, setRole] = useState('Recruiter');
  const [overview, setOverview] = useState([]);
  const [manual, setManual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [meta, setMeta] = useState({ title: '', intro: '', published: true });

  const loadOverview = () => axios.get('/api/training/admin/manuals', { withCredentials: true })
    .then(r => setOverview(r.data?.manuals || []))
    .catch(() => {});

  const loadManual = async (r) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/training/admin/manual/${r}`, { withCredentials: true });
      const m = res.data?.manual;
      setManual(m);
      setMeta({ title: m.title || '', intro: m.intro || '', published: m.published !== false });
    } catch (e) {
      setMsg({ bad: true, text: e.response?.data?.message || 'Could not load the manual.' });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadOverview(); }, []);
  useEffect(() => { loadManual(role); setEditing(null); }, [role]);

  const saveMeta = async () => {
    setSaving(true); setMsg(null);
    try {
      await axios.put(`/api/training/admin/manual/${role}`, meta, { withCredentials: true });
      setMsg({ text: 'Manual details saved.' });
      loadOverview(); loadManual(role);
    } catch (e) {
      setMsg({ bad: true, text: e.response?.data?.message || 'Could not save.' });
    } finally { setSaving(false); }
  };

  const saveStep = async () => {
    setSaving(true); setMsg(null);
    try {
      if (editing.id) await axios.put(`/api/training/admin/steps/${editing.id}`, editing, { withCredentials: true });
      else await axios.post('/api/training/admin/steps', editing, { withCredentials: true });
      setMsg({ text: editing.id ? 'Step updated.' : 'Step added.' });
      setEditing(null);
      loadManual(role); loadOverview();
    } catch (e) {
      setMsg({ bad: true, text: e.response?.data?.message || 'Could not save the step.' });
    } finally { setSaving(false); }
  };

  const removeStep = async (s) => {
    if (!window.confirm(`Delete this step?\n\n"${s.title}"\n\nThis cannot be undone.`)) return;
    try {
      await axios.delete(`/api/training/admin/steps/${s.id}`, { withCredentials: true });
      setMsg({ text: 'Step deleted.' });
      loadManual(role); loadOverview();
    } catch (e) {
      setMsg({ bad: true, text: e.response?.data?.message || 'Could not delete.' });
    }
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true); setMsg(null);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const r = await axios.post('/api/training/admin/screenshot',
        { filename: file.name, contentType: file.type, base64 }, { withCredentials: true });
      setEditing(s => ({ ...s, imageUrl: r.data.url }));
      setMsg({ text: 'Screenshot uploaded.' });
    } catch (e) {
      setMsg({ bad: true, text: e.response?.data?.message || 'Could not upload the screenshot.' });
    } finally { setUploading(false); }
  };

  const field = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 outline-none';
  const countFor = (r) => overview.find(m => m.role === r)?.stepCount ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Training Manuals</h2>
          <p className="text-sm text-gray-500">
            One manual per user type. Each step can name the menu path to click and carry a screenshot.
          </p>
        </div>
        <button onClick={() => setEditing(blankStep(role))}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold">
          <Plus size={15} /> Add Step
        </button>
      </div>

      {msg && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm mb-4 ${
          msg.bad ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-800'}`}>
          <span className="flex items-center gap-2">
            {msg.bad ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}{msg.text}
          </span>
          <button onClick={() => setMsg(null)}><X size={15} /></button>
        </div>
      )}

      {/* User type picker */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ROLES.map(r => (
          <button key={r} onClick={() => setRole(r)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              r === role ? 'bg-orange-500 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {LABEL[r]} <span className={r === role ? 'text-orange-100' : 'text-gray-400'}>({countFor(r)})</span>
          </button>
        ))}
      </div>

      {/* Manual details */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={17} className="text-orange-500" /> {LABEL[role]} manual
          </h3>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="accent-orange-500" checked={meta.published}
              onChange={(e) => setMeta(m => ({ ...m, published: e.target.checked }))} />
            {meta.published ? <><Eye size={14} /> Visible to {LABEL[role]}s</> : <><EyeOff size={14} /> Hidden</>}
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Manual title</label>
            <input className={field} value={meta.title} placeholder={`${LABEL[role]} Training Manual`}
              onChange={(e) => setMeta(m => ({ ...m, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Introduction</label>
            <textarea rows={2} className={field} value={meta.intro}
              placeholder="A line or two on what this manual covers."
              onChange={(e) => setMeta(m => ({ ...m, intro: e.target.value }))} />
          </div>
        </div>
        <button onClick={saveMeta} disabled={saving}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold disabled:opacity-60">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save details
        </button>
      </div>

      {/* Step editor */}
      {editing && (
        <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 mb-5">
          <h3 className="font-bold text-gray-900 mb-4">{editing.id ? 'Edit step' : 'New step'}</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">User type</label>
              <select className={field} value={editing.role}
                onChange={(e) => setEditing(s => ({ ...s, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{LABEL[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Section</label>
              <input className={field} value={editing.section} placeholder="Getting started"
                onChange={(e) => setEditing(s => ({ ...s, section: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Order within the section</label>
              <input type="number" className={field} value={editing.order}
                onChange={(e) => setEditing(s => ({ ...s, order: e.target.value }))} />
            </div>
          </div>

          <label className="block text-xs font-semibold text-gray-600 mb-1 mt-4">Step title</label>
          <input className={field} value={editing.title} placeholder="e.g. Submit a candidate to a position"
            onChange={(e) => setEditing(s => ({ ...s, title: e.target.value }))} />

          <label className="block text-xs font-semibold text-gray-600 mb-1 mt-4">
            Menu path — separate each click with an arrow
          </label>
          <input className={field} value={editing.menuPath}
            placeholder="Dashboard → Open Positions → Submit Candidate"
            onChange={(e) => setEditing(s => ({ ...s, menuPath: e.target.value }))} />
          <p className="text-[11px] text-gray-400 mt-1">
            Shown to the user as clickable-looking crumbs, so the route through the menus is obvious.
          </p>

          <label className="block text-xs font-semibold text-gray-600 mb-1 mt-4">Instructions</label>
          <textarea rows={5} className={field} value={editing.body}
            placeholder="What to do at this step, and what to expect."
            onChange={(e) => setEditing(s => ({ ...s, body: e.target.value }))} />

          <label className="block text-xs font-semibold text-gray-600 mb-1 mt-4">Screenshot (optional)</label>
          <div className="flex items-center gap-4 flex-wrap">
            {editing.imageUrl ? (
              <div className="relative">
                <img src={editing.imageUrl} alt="" className="h-24 rounded-lg border border-gray-200" />
                <button onClick={() => setEditing(s => ({ ...s, imageUrl: '' }))}
                  className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 text-gray-500 hover:text-red-500">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="h-24 w-32 rounded-lg bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                <ImageIcon size={20} />
              </div>
            )}
            <label className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
              {uploading ? 'Uploading…' : 'Upload screenshot'}
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={(e) => upload(e.target.files?.[0])} />
            </label>
            <span className="text-[11px] text-gray-400">PNG or JPG, up to 5 MB.</span>
          </div>

          <div className="flex gap-2 mt-5">
            <button onClick={saveStep} disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving…' : 'Save step'}
            </button>
            <button onClick={() => setEditing(null)}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold">Cancel</button>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="py-16 text-center text-gray-500 text-sm">Loading…</p>
        ) : !manual?.sections?.length ? (
          <div className="py-16 text-center">
            <BookOpen size={34} className="mx-auto text-gray-300" />
            <p className="mt-3 font-semibold text-gray-600">No steps yet for {LABEL[role]}</p>
            <p className="text-sm text-gray-400 mt-1">
              Until a step is added, {LABEL[role]}s see a &ldquo;manual is being prepared&rdquo; note.
            </p>
          </div>
        ) : (
          manual.sections.map(sec => (
            <div key={sec.section}>
              <p className="px-4 py-2.5 bg-gray-50 border-y border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                {sec.section}
              </p>
              <div className="divide-y divide-gray-100">
                {sec.steps.map(s => (
                  <div key={s.id} className="p-4 flex items-start gap-4">
                    {s.imageUrl
                      ? <img src={s.imageUrl} alt="" className="h-16 w-24 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                      : <div className="h-16 w-24 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-300 flex-shrink-0">
                          <ImageIcon size={16} />
                        </div>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400">#{s.order ?? 0}</span>
                        <p className="font-semibold text-gray-900">{s.title}</p>
                      </div>
                      {s.menuPath && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {s.menuPath.split(/→|>/).map(p => p.trim()).filter(Boolean).map((p, i, arr) => (
                            <React.Fragment key={`${p}-${i}`}>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-700">{p}</span>
                              {i < arr.length - 1 && <ChevronRight size={11} className="text-gray-400" />}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                      {s.body && <p className="text-[13px] text-gray-600 mt-2 line-clamp-2">{s.body}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditing({ ...s })}
                        className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"><Pencil size={14} /></button>
                      <button onClick={() => removeStep(s)}
                        className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
