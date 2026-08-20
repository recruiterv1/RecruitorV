import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ── Attach ClientSPOC(s) to a vendor (SuperAdmin) ───────────────────────────
// A vendor can have several; when they post a position they pick one, and only
// that SPOC can publish it.
export default function VendorSpocModal({ vendor, onClose, onSaved }) {
  const [all, setAll] = useState([]);
  const [picked, setPicked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    axios.get(`/vendor/admin/${vendor.id}/clientspocs`, { withCredentials: true })
      .then(r => {
        setAll(r.data?.clientspocs || []);
        setPicked((r.data?.assigned || []).map(x => (x.email || '').toLowerCase()));
      })
      .catch(e => setErr(e.response?.data?.message || 'Failed to load.'))
      .finally(() => setLoading(false));
  }, [vendor.id]);

  const toggle = (email) => setPicked(p => p.includes(email) ? p.filter(x => x !== email) : [...p, email]);

  const save = async () => {
    setSaving(true); setErr('');
    try {
      await axios.post(`/vendor/admin/${vendor.id}/clientspocs`,
        { clientspocs: picked.map(e => ({ email: e, name: all.find(a => a.email === e)?.name || '' })) },
        { withCredentials: true });
      onSaved();
      onClose();
    } catch (e) { setErr(e.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5 rounded-t-2xl">
          <h2 className="text-lg font-bold text-white">Assign ClientSPOCs</h2>
          <p className="text-white/80 text-sm truncate">{vendor.name} · {vendor.email}</p>
        </div>
        <div className="p-5">
          <p className="text-xs text-gray-500 mb-3">
            The vendor picks one of these when posting a position — and only that ClientSPOC can make it live.
          </p>
          {err && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
          {loading ? (
            <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>
          ) : !all.length ? (
            <div className="py-10 text-center text-gray-400 text-sm">No ClientSPOCs found.</div>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto border border-gray-200 rounded-xl p-2">
              {all.map(sp => (
                <label key={sp.email} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={picked.includes(sp.email)} onChange={() => toggle(sp.email)}
                    className="w-4 h-4 accent-purple-600" />
                  <span className="text-sm text-gray-700 truncate">{sp.name}
                    <span className="text-gray-400"> ({sp.email})</span></span>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-xl">Cancel</button>
            <button onClick={save} disabled={saving || loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl disabled:opacity-60">
              {saving ? 'Saving…' : `Save (${picked.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// SuperAdmin queue of companies vendors added themselves. Approving one lets the
// vendor post positions against it.
const VendorCompaniesApproval = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = () => axios.get('/vendor/admin/companies', { withCredentials: true })
    .then(r => setRows(r.data?.companies || []))
    .catch(() => setRows([]))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const decide = async (c, approve) => {
    const reason = approve ? '' : (window.prompt(`Reason for rejecting "${c.name}"?`) || '');
    if (!approve && !reason.trim()) return;
    setBusyId(c.id);
    try {
      await axios.post(`/vendor/admin/companies/${c.id}/decision`, { approve, reason }, { withCredentials: true });
      load();
    } catch (e) { alert(e.response?.data?.message || 'Failed.'); }
    finally { setBusyId(null); }
  };

  if (loading) return null;
  if (!rows.length) return null;

  const pending = rows.filter(c => !c.approved);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">Vendor-added Companies</h3>
        {pending.length > 0 && (
          <span className="text-xs font-semibold bg-amber-100 text-amber-700 rounded-full px-3 py-1">
            {pending.length} pending
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3">
        A vendor can only post positions against a company once it is approved here.
      </p>
      <div className="space-y-2">
        {rows.map(c => (
          <div key={c.id} className="flex items-center justify-between gap-3 flex-wrap border border-gray-100 rounded-xl px-4 py-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 truncate">{c.name}</p>
              <p className="text-xs text-gray-500 truncate">by {c.vendorName || c.addedByVendor}</p>
            </div>
            {c.approved ? (
              <span className="text-xs font-semibold bg-green-100 text-green-700 rounded-full px-3 py-1">Approved</span>
            ) : (
              <div className="flex items-center gap-2">
                <button disabled={busyId === c.id} onClick={() => decide(c, true)}
                  className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1.5 disabled:opacity-60">Approve</button>
                <button disabled={busyId === c.id} onClick={() => decide(c, false)}
                  className="text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg px-3 py-1.5 disabled:opacity-60">Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
