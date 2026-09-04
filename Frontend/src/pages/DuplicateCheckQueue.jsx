import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

// The screen for whoever keeps the client's portal open.
//
// A recruiter part-way through a submission is waiting on each of these, so the
// queue refreshes itself and shows how long each one has been sitting. Copy the
// email/phone/PAN into the portal's own search, then answer here.
export default function DuplicateCheckQueue() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState({});

  const load = useCallback(async () => {
    try {
      const r = await axios.get('/api/dupcheck/queue', { withCredentials: true });
      setRows(r.data?.requests || []);
      setError('');
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load the queue.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  const answer = async (id, verdict) => {
    setBusy(id);
    try {
      await axios.post(`/api/dupcheck/${id}/verdict`,
        { verdict, note: note[id] || '' }, { withCredentials: true });
      setRows(rs => rs.filter(r => r.id !== id));
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not save that verdict.');
    } finally { setBusy(''); }
  };

  const waited = (iso) => {
    if (!iso) return '';
    const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  const copy = (t) => { try { navigator.clipboard.writeText(t); } catch { /* not critical */ } };

  const Field = ({ label, value }) => value ? (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
      <span style={{ color: '#6b7280', minWidth: 52 }}>{label}</span>
      <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{value}</code>
      <button onClick={() => copy(value)} title="Copy"
        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}>⧉</button>
    </div>
  ) : null;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Duplicate check queue</h1>
      <p style={{ color: '#6b7280', marginTop: 0, fontSize: 14 }}>
        Search each candidate in the client's portal, then answer. A recruiter is waiting on every one of these.
      </p>

      {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      {loading && <p style={{ color: '#6b7280' }}>Loading…</p>}
      {!loading && !rows.length && !error && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>
          <div style={{ fontSize: 40 }}>✓</div>
          <p>Nothing waiting.</p>
        </div>
      )}

      {rows.map(r => (
        <div key={r.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <strong style={{ fontSize: 16 }}>{r.name || '(no name)'}</strong>
            <span style={{ fontSize: 12, color: waited(r.requestedAt).startsWith('0') ? '#6b7280' : '#b45309' }}>
              waiting {waited(r.requestedAt)}
            </span>
          </div>

          <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            <Field label="Email" value={r.email} />
            <Field label="Phone" value={r.phone} />
            <Field label="PAN" value={r.pan} />
            <Field label="Job ID" value={r.jobId} />
          </div>

          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
            {r.client} · {r.pos_name || `position ${r.pos_id}`} · raised by {r.requestedBy}
            {!r.jobId && <span style={{ color: '#b45309' }}> · no job ID on this position — search by candidate</span>}
          </div>

          <input placeholder="Optional note the recruiter will see (e.g. which vendor already sent them)"
            value={note[r.id] || ''} onChange={e => setNote(n => ({ ...n, [r.id]: e.target.value }))}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 10, fontSize: 14 }} />

          <div style={{ display: 'flex', gap: 10 }}>
            <button disabled={busy === r.id} onClick={() => answer(r.id, 'clear')}
              style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#15803d', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              ✓ Not a duplicate
            </button>
            <button disabled={busy === r.id} onClick={() => answer(r.id, 'duplicate')}
              style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#b91c1c', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              ✕ Already in portal
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
