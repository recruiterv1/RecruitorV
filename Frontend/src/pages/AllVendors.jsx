import React, { useState, useEffect } from 'react';
import VendorSpocModal from '../components/VendorSpocModal';
import axios from 'axios';
import {
  Store, Users, ChevronRight, ChevronDown, RefreshCw,
  Briefcase, Hash, ArrowLeft, Clock
} from 'lucide-react';
import { useDeviceStatus, DeviceBadges } from '../components/DeviceStatus';

const fmt = (d) => {
  if (!d) return 'N/A';
  try {
    const ts = d._seconds ? d._seconds * 1000 : typeof d === 'string' ? Date.parse(d) : new Date(d).getTime();
    if (!ts || isNaN(ts)) return 'N/A';
    return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return 'N/A'; }
};

// ─── Vendor Detail Drawer ────────────────────────────────────
const VendorDetail = ({ vendorId, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedRec, setExpandedRec] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/admin/vendors/${vendorId}/details`, { withCredentials: true });
        setData(res.data);
      } catch { setData(null); }
      finally { setLoading(false); }
    };
    load();
  }, [vendorId]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mr-3" />
      <span className="text-gray-500">Loading vendor details…</span>
    </div>
  );

  if (!data) return <div className="text-center py-16 text-gray-500">Failed to load vendor data.</div>;

  const { vendor, recruiters } = data;
  const totalCandidates = recruiters.reduce((s, r) => s + r.totalCandidates, 0);
  const totalPositions = new Set(recruiters.flatMap(r => r.positions.map(p => p.pos_id))).size;

  return (
    <div>
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-purple-600 hover:text-purple-800 font-semibold text-sm">
          <ArrowLeft size={16} /> All Vendors
        </button>
      </div>

      {/* Vendor summary card */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-5 mb-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold">{vendor.name}</h2>
            <p className="text-white/75 text-sm mt-0.5">{vendor.email}</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-black">{vendor.recruitersUsed}/{vendor.recruiterQuantity}</div>
              <div className="text-xs text-white/75">Recruiters</div>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-black">{totalCandidates}</div>
              <div className="text-xs text-white/75">Candidates</div>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-black">{totalPositions}</div>
              <div className="text-xs text-white/75">Positions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter list */}
      {recruiters.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No recruiters registered under this vendor yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recruiters.map(rec => (
            <div key={rec.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              {/* Recruiter row */}
              <button
                onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {(rec.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{rec.name}</p>
                    <p className="text-xs text-gray-500">{rec.email}{rec.mobile ? ` · ${rec.mobile}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="hidden sm:flex gap-3">
                    <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full">
                      <Briefcase size={11} /> {rec.totalPositions} position{rec.totalPositions !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full">
                      <Users size={11} /> {rec.totalCandidates} candidate{rec.totalCandidates !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      <Clock size={11} /> {fmt(rec.lastActive)}
                    </span>
                  </div>
                  {expandedRec === rec.id ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                </div>
              </button>

              {/* Mobile stats */}
              <div className="sm:hidden flex gap-2 px-5 pb-3 flex-wrap">
                <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{rec.totalPositions} positions</span>
                <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">{rec.totalCandidates} candidates</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Active: {fmt(rec.lastActive)}</span>
              </div>

              {/* Position breakdown */}
              {expandedRec === rec.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  {rec.positions.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No candidate submissions yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-500 font-semibold border-b border-gray-200">
                            <th className="pb-2 pr-4">Position</th>
                            <th className="pb-2 pr-4">Client</th>
                            <th className="pb-2 pr-4">Position ID</th>
                            <th className="pb-2">Candidates</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {rec.positions.map(p => (
                            <tr key={p.pos_id} className="hover:bg-white transition-colors">
                              <td className="py-2 pr-4 font-medium text-gray-800">{p.pos_name}</td>
                              <td className="py-2 pr-4 text-gray-600">{p.client}</td>
                              <td className="py-2 pr-4 text-gray-400 font-mono">{p.pos_id}</td>
                              <td className="py-2">
                                <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">{p.candidateCount}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── All Vendors List ────────────────────────────────────────

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
};


const AllVendors = ({ embedded }) => {
  const [spocVendor, setSpocVendor] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const deviceMap = useDeviceStatus(vendors.map(v => v.email));

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/vendors', { withCredentials: true });
      setVendors(res.data.data || []);
    } catch { setVendors([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (selectedVendorId) {
    return (
      <div className="p-4 sm:p-6">
        <VendorDetail vendorId={selectedVendorId} onBack={() => setSelectedVendorId(null)} />
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mr-3" />
      <span className="text-gray-500">Loading vendors…</span>
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-5 mb-6 shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">All Vendors</h2>
          <p className="text-white/80 text-sm mt-1">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <VendorCompaniesApproval />

      {vendors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Store size={48} className="mx-auto text-purple-300 mb-3" />
          <p className="text-lg font-semibold text-gray-700">No Vendors Yet</p>
          <p className="text-sm text-gray-400 mt-1">Add vendors from the Add User section.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map(v => {
            const pct = v.recruiterQuantity > 0 ? Math.round((v.recruitersUsed / v.recruiterQuantity) * 100) : 0;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVendorId(v.id)}
                className="w-full bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all p-5 text-left cursor-pointer"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {(v.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800">{v.name}</p>
                        <DeviceBadges status={deviceMap[(v.email || '').toLowerCase()]} />
                      </div>
                      <p className="text-xs text-gray-500">{v.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <Hash size={13} className="text-purple-500" />
                        <span className="font-bold text-gray-700">{v.recruitersUsed}/{v.recruiterQuantity}</span>
                      </div>
                      <div className="text-xs text-gray-400">Recruiters</div>
                      <div className="w-20 bg-gray-100 rounded-full h-1.5 mt-1">
                        <div className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap"
                  onClick={e => e.stopPropagation()}>
                  <span className="text-xs text-gray-500">
                    ClientSPOCs: <b className="text-gray-700">{(v.clientspocs || []).length}</b>
                    {(v.clientspocs || []).length > 0 && (
                      <span className="text-gray-400"> — {(v.clientspocs || []).map(x => x.name || x.email).join(', ')}</span>
                    )}
                  </span>
                  <button
                    onClick={() => setSpocVendor(v)}
                    className="ml-auto text-xs font-semibold text-purple-700 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50"
                  >
                    Assign ClientSPOCs
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {spocVendor && (
        <VendorSpocModal vendor={spocVendor} onClose={() => setSpocVendor(null)} onSaved={load} />
      )}
    </div>
  );
};

export default AllVendors;
