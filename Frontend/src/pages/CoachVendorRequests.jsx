import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Crown, RefreshCw, CheckCircle, XCircle, Clock,
  MapPin, Mail, Phone, Briefcase, AlertCircle
} from 'lucide-react';

const fmtDate = (ts) => {
  if (!ts) return '—';
  const ms = ts._seconds ? ts._seconds * 1000 : ts.seconds ? ts.seconds * 1000 : null;
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const STATUS_STYLE = {
  pending:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  approved:  { label: 'Approved',  cls: 'bg-green-100  text-green-700  border-green-200',  icon: CheckCircle },
  rejected:  { label: 'Rejected',  cls: 'bg-red-100    text-red-700    border-red-200',    icon: XCircle },
  waitlist:  { label: 'Waitlist',  cls: 'bg-blue-100   text-blue-700   border-blue-200',   icon: Clock },
};

const CoachVendorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState({});
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/coach-expert/coach-vendor-requests', { withCredentials: true });
      setRequests(res.data?.requests || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const act = async (id, status) => {
    setActing(p => ({ ...p, [id]: status }));
    try {
      await axios.patch(`/api/coach-expert/coach-vendor-requests/${id}`, { status }, { withCredentials: true });
      showToast(`Request ${status}`);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setActing(p => ({ ...p, [id]: null }));
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const counts = requests.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

  return (
    <div className="p-4 sm:p-6">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-700 rounded-2xl p-5 mb-5 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Crown size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">Vendor Upgrade Requests</h2>
              <p className="text-orange-200 text-sm">
                {requests.length} total · {counts.pending || 0} pending
              </p>
            </div>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['waitlist', 'Waitlist']].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${filter === key ? 'bg-white text-orange-700' : 'bg-white/20 text-white hover:bg-white/30'}`}>
              {label} {key !== 'all' && counts[key] ? `(${counts[key]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Crown size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No requests found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(req => {
            const s = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
            const SIcon = s.icon;
            const isActing = acting[req.id];
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-5 py-4 flex items-center gap-3 border-b border-orange-100">
                  {req.coachProfilePhoto
                    ? <img src={req.coachProfilePhoto} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-orange-200" />
                    : <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center text-orange-800 font-bold text-xl flex-shrink-0">{(req.coachName || '?')[0].toUpperCase()}</div>
                  }
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-800 truncate">{req.coachName || '—'}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>
                      <SIcon size={11} /> {s.label}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-5 py-4 space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Mail size={13} className="text-orange-400 flex-shrink-0" /><span className="truncate">{req.coachEmail}</span></div>
                  {req.coachPhone && <div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={13} className="text-orange-400" />{req.coachPhone}</div>}
                  {req.coachLocation && <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin size={13} className="text-orange-400" />{req.coachLocation}</div>}
                  {req.coachSkillCategory && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Briefcase size={13} className="text-orange-400 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(req.coachSkillCategory) ? req.coachSkillCategory : [req.coachSkillCategory]).map(s => (
                          <span key={s} className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold border border-orange-100">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {req.coachBio && (
                    <div className="mt-1 bg-gray-50 rounded-lg p-2 max-h-28 overflow-y-auto">
                      <p className="text-xs text-gray-500 whitespace-pre-wrap">{req.coachBio}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 pt-1">Requested on {fmtDate(req.createdAt)}</p>
                </div>

                {/* Actions */}
                {req.status === 'pending' && (
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex gap-2">
                    <button onClick={() => act(req.id, 'approved')} disabled={!!isActing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all">
                      {isActing === 'approved' ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={13} />}
                      Approve
                    </button>
                    <button onClick={() => act(req.id, 'waitlist')} disabled={!!isActing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all">
                      {isActing === 'waitlist' ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Clock size={13} />}
                      Waitlist
                    </button>
                    <button onClick={() => act(req.id, 'rejected')} disabled={!!isActing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all">
                      {isActing === 'rejected' ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <XCircle size={13} />}
                      Reject
                    </button>
                  </div>
                )}
                {req.status !== 'pending' && (
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex gap-2">
                    {req.status !== 'approved' && (
                      <button onClick={() => act(req.id, 'approved')} disabled={!!isActing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all">
                        <CheckCircle size={13} /> Approve
                      </button>
                    )}
                    {req.status !== 'waitlist' && (
                      <button onClick={() => act(req.id, 'waitlist')} disabled={!!isActing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all">
                        <Clock size={13} /> Waitlist
                      </button>
                    )}
                    {req.status !== 'rejected' && (
                      <button onClick={() => act(req.id, 'rejected')} disabled={!!isActing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all">
                        <XCircle size={13} /> Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoachVendorRequests;
