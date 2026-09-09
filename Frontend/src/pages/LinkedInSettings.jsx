import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Linkedin, CheckCircle2, AlertTriangle, Loader2, ExternalLink, Send } from 'lucide-react';
import DashShell from '../components/DashShell';

// SuperAdmin control for auto-posting new positions to the company page.
//
// This existed only in Firestore before, which is why a rotated client secret
// left it silently dead from July with no way to notice or fix it. The three
// things that break are all visible and fixable here: the app credentials, the
// page authorisation, and the ~60-day token expiry.
export default function LinkedInSettings() {
  const [cfg, setCfg] = useState(null);
  const [make, setMake] = useState(null);
  const [verify, setVerify] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ clientId: '', clientSecret: '', orgId: '' });

  const load = async () => {
    try {
      const [li, mk] = await Promise.all([
        axios.get('/api/app/linkedin-config', { withCredentials: true }),
        axios.get('/admin/zapier-config', { withCredentials: true }).catch(() => null),
      ]);
      setCfg(li.data);
      setMake(mk?.data || null);
      setForm(f => ({ ...f, orgId: li.data?.orgId || '' }));
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.message || 'Could not load the settings.' });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const checkCredentials = async () => {
    setBusy('verify'); setMsg(null);
    try {
      const r = await axios.get('/api/app/linkedin-verify', { withCredentials: true });
      setVerify(r.data);
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.message || 'Verification failed.' });
    } finally { setBusy(''); }
  };

  const save = async () => {
    setBusy('save'); setMsg(null);
    try {
      const payload = {};
      if (form.clientId.trim()) payload.clientId = form.clientId.trim();
      if (form.clientSecret.trim()) payload.clientSecret = form.clientSecret.trim();
      if (form.orgId.trim()) payload.orgId = form.orgId.trim();
      if (!Object.keys(payload).length) { setMsg({ ok: false, text: 'Nothing to save.' }); return; }
      await axios.post('/api/app/linkedin-config', payload, { withCredentials: true });
      setForm(f => ({ ...f, clientSecret: '' }));   // never keep a secret on screen
      setMsg({ ok: true, text: 'Saved. Verify the credentials, then connect the page.' });
      setVerify(null);
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.message || 'Could not save.' });
    } finally { setBusy(''); }
  };

  const testPost = async () => {
    setBusy('test'); setMsg(null);
    try {
      const r = await axios.post('/api/app/linkedin-test', {}, { withCredentials: true });
      setMsg({ ok: !!r.data?.posted, text: r.data?.posted
        ? 'Test post published to the page.'
        : (r.data?.reason || 'The test post did not go out.') });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.message || 'Test post failed.' });
    } finally { setBusy(''); }
  };

  const Row = ({ label, ok, children }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      {ok === undefined ? <span className="w-4" /> :
        ok ? <CheckCircle2 size={17} className="text-emerald-600 mt-0.5 flex-shrink-0" />
           : <AlertTriangle size={17} className="text-amber-500 mt-0.5 flex-shrink-0" />}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-[13px] text-gray-500">{children}</p>
      </div>
    </div>
  );

  const input = 'w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none';

  return (
    <DashShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <Linkedin size={20} className="text-blue-700" />
          <h1 className="text-2xl font-bold text-gray-900">LinkedIn auto-posting</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Positions reach the company page through the automation webhook below. The direct
          LinkedIn integration underneath it is a separate, unused path.
        </p>

        {loading ? (
          <p className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 size={15} className="animate-spin" /> Loading…</p>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-200 p-5 mb-5">
              <Row label="Auto-posting" ok={!!cfg?.enabled}>
                {cfg?.enabled ? 'On — new positions are posted.' : 'Off — nothing is being posted.'}
              </Row>
              <Row label="Access token" ok={!!cfg?.hasToken}>
                {cfg?.hasToken ? `Stored (${cfg.tokenPreview}).` : 'Not stored — the page has never been connected.'}
              </Row>
              <Row label="Company page" ok={!!cfg?.orgId}>
                {cfg?.orgId ? `Organization ${cfg.orgId}.` : 'No organization id set.'}
              </Row>
              <Row label="Last post" ok={cfg?.lastPostAt ? true : undefined}>
                {cfg?.lastPostAt
                  ? `${new Date(cfg.lastPostAt._seconds ? cfg.lastPostAt._seconds * 1000 : cfg.lastPostAt).toLocaleString('en-IN')} (position ${cfg.lastPostPosId || '—'}).`
                  : 'Nothing has been posted yet.'}
              </Row>
            </div>

            {/* The live route: positions go to Make, which posts them to LinkedIn. */}
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/40 p-5 mb-5">
              <p className="font-bold text-gray-800 text-sm mb-2">
                Automation webhook{make?.provider ? ` · ${make.provider}` : ''}
                {make?.host && <span className="ml-2 font-normal text-gray-500">{make.host}</span>}
              </p>
              <Row label="Webhook" ok={!!make?.enabled}>
                {make?.enabled ? 'Enabled — every ClientSPOC position is sent.' : 'Not enabled.'}
              </Row>
              <Row label="Last send" ok={make?.lastSendAt ? make.lastSendOk !== false : undefined}>
                {make?.lastSendAt
                  ? `${new Date(make.lastSendAt).toLocaleString('en-IN')} — position ${make.lastSendPosId || '—'} ${
                      make.lastSendOk === false ? `FAILED (${make.lastSendStatus || ''} ${make.lastSendError || ''})` : 'accepted'}`
                  : 'No send recorded yet. Sends have only been logged since this page existed — post a position to populate it.'}
              </Row>
              <p className="text-[12.5px] text-gray-600 mt-3 leading-relaxed">
                A webhook that reports <b>accepted</b> only means the automation received the
                position. Make queues incoming data even when its scenario is switched off,
                erroring, or out of operations — so if posts stop appearing while sends keep
                succeeding here, the fault is inside the scenario, not on this side.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-5 mb-5">
              <p className="font-bold text-gray-800 text-sm mb-1">1 · App credentials</p>
              <p className="text-[13px] text-gray-500 mb-3">
                From the LinkedIn Developer portal → your app → Auth. Regenerating the secret
                there invalidates the one stored here, which stops posting with no other warning.
              </p>
              <div className="space-y-2.5">
                <input className={input} placeholder="Client ID" value={form.clientId}
                  onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} />
                <input className={input} type="password" placeholder="Client Secret (leave blank to keep the current one)"
                  value={form.clientSecret} onChange={e => setForm(f => ({ ...f, clientSecret: e.target.value }))} />
                <input className={input} placeholder="Organization ID (numeric)" value={form.orgId}
                  onChange={e => setForm(f => ({ ...f, orgId: e.target.value }))} />
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <button onClick={save} disabled={busy === 'save'}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm disabled:opacity-60">
                  {busy === 'save' ? 'Saving…' : 'Save'}
                </button>
                <button onClick={checkCredentials} disabled={busy === 'verify'}
                  className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm disabled:opacity-60">
                  {busy === 'verify' ? 'Checking…' : 'Verify credentials'}
                </button>
              </div>
              {verify && (
                <p className={`mt-3 text-[13px] font-semibold ${verify.credentialsValid ? 'text-emerald-700' : 'text-red-600'}`}>
                  {verify.credentialsValid ? '✓ ' : '✕ '}{verify.reason}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 p-5 mb-5">
              <p className="font-bold text-gray-800 text-sm mb-1">2 · Authorise the page</p>
              <p className="text-[13px] text-gray-500 mb-3">
                Open this while signed into LinkedIn as an admin of the page. The token lasts about
                60 days, so this has to be repeated when it lapses.
              </p>
              <a href="/api/app/linkedin/auth" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0a66c2] text-white font-bold text-sm">
                <ExternalLink size={15} /> Connect LinkedIn page
              </a>
            </div>

            <div className="rounded-2xl border border-gray-200 p-5">
              <p className="font-bold text-gray-800 text-sm mb-1">3 · Check it works</p>
              <p className="text-[13px] text-gray-500 mb-3">Publishes one test post to the page.</p>
              <button onClick={testPost} disabled={busy === 'test' || !cfg?.hasToken}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm disabled:opacity-50">
                <Send size={15} /> {busy === 'test' ? 'Posting…' : 'Send test post'}
              </button>
            </div>

            {msg && (
              <p className={`mt-5 text-sm font-semibold ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>
            )}
          </>
        )}
      </div>
    </DashShell>
  );
}
