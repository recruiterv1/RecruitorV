import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { SidebarContext } from '../context/Sidebarcontext';
import ClientSpocSidebar from '../components/Dash_View_ClientSpocSidebar';
import { Building2, Loader2, CheckCircle2, XCircle } from 'lucide-react';

// ClientSPOC reviews positions posted by companies assigned to them and makes
// them live (visible to recruiters) or rejects them with a reason.
export default function ClientSpocCompanyApprovals() {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const isCollapsed = isSidebarCollapsed || false;
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState({});
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    axios.get('/api/company/spoc/pending', { withCredentials: true })
      .then(r => setList(r.data.positions || []))
      .catch(e => { setList([]); setError(e.response?.data?.message || 'Failed to load.'); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const goLive = async (id) => {
    setBusy(b => ({ ...b, [id]: true }));
    try { await axios.post(`/api/company/spoc/positions/${id}/golive`, {}, { withCredentials: true }); await load(); }
    catch (e) { alert(e.response?.data?.message || 'Failed.'); }
    finally { setBusy(b => { const n = { ...b }; delete n[id]; return n; }); }
  };
  const reject = async (id) => {
    if (!reason.trim()) return;
    setBusy(b => ({ ...b, [id]: true }));
    try { await axios.post(`/api/company/spoc/positions/${id}/reject`, { reason: reason.trim() }, { withCredentials: true }); setRejecting(null); setReason(''); await load(); }
    catch (e) { alert(e.response?.data?.message || 'Failed.'); }
    finally { setBusy(b => { const n = { ...b }; delete n[id]; return n; }); }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300"><ClientSpocSidebar /></aside>
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-0'}`}>
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white"><Building2 size={22} /></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Company Position Approvals</h1>
              <p className="text-sm text-gray-500">Positions posted by your assigned companies. Make them live for recruiters, or reject.</p>
            </div>
          </div>

          {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          {!list ? (
            <div className="py-16 grid place-items-center text-gray-400"><Loader2 size={26} className="animate-spin" /></div>
          ) : list.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No pending company positions.</div>
          ) : (
            <div className="space-y-3">
              {list.map(p => (
                <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{p.position} <span className="text-xs text-gray-400">#{p.pos_id}</span></div>
                      <div className="text-xs text-gray-500 mt-0.5">{p.companyName} · {p.skill_category || '—'} · {(Array.isArray(p.location) ? p.location.join(', ') : p.location) || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => goLive(p.id)} disabled={!!busy[p.id]}
                        className="flex items-center gap-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1.5 disabled:opacity-60">
                        <CheckCircle2 size={14} /> Make live
                      </button>
                      <button onClick={() => { setRejecting(p.id); setReason(''); }} disabled={!!busy[p.id]}
                        className="flex items-center gap-1 text-xs font-medium text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                  {rejecting === p.id && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Reason for rejection (required)…"
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-400/40" />
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setRejecting(null)} className="text-xs text-gray-500 px-3 py-1.5">Cancel</button>
                        <button onClick={() => reject(p.id)} disabled={!reason.trim()} className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 disabled:opacity-50">Confirm reject</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
