import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  UserCheck, Briefcase, CheckCircle, XCircle, Clock,
  RefreshCw, AlertCircle, ExternalLink
} from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import Sidebar from './Sidebar';
import Dash_Header from './Dash_Header';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';

const STATUS_CFG = {
  pending:  { label: 'Pending',  icon: Clock,        cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  accepted: { label: 'Accepted', icon: CheckCircle,  cls: 'bg-green-100  text-green-700  border-green-200'  },
  rejected: { label: 'Rejected', icon: XCircle,      cls: 'bg-red-100    text-red-700    border-red-200'    },
};

// ── Layout wrapper ──────────────────────────────────────────────────────────
const RecruiterCoachAssignments = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 relative">
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          <Sidebar />
        </aside>
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in"><Sidebar /></aside>
          </div>
        )}
        <RecruiterCoachAssignmentsContent isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <style>{`
          @keyframes slide-in { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
        `}</style>
      </div>
    </SidebarProvider>
  );
};

const RecruiterCoachAssignmentsContent = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  return (
    <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      </header>
      <main className="min-h-screen">
        <RecruiterCoachAssignmentsPage />
      </main>
      <Footer />
    </div>
  );
};

// ── Page content ────────────────────────────────────────────────────────────
const RecruiterCoachAssignmentsPage = () => {
  const { user } = useContext(UserStateContext);
  const navigate  = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [acting, setActing]           = useState(null);
  const [toast, setToast]             = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/coach-expert/coach-assigned-positions', { withCredentials: true });
      setAssignments(res.data?.assignments || []);
    } catch (err) {
      console.error('fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchAssignments(); }, [user]);

  const handleAction = async (id, status) => {
    setActing(id + status);
    try {
      await axios.patch(`/api/coach-expert/coach-assigned-positions/${id}`, { status }, { withCredentials: true });
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      showToast(`Position ${status} successfully`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setActing(null);
    }
  };

  const formatDate = (ts) => {
    if (!ts?._seconds) return '—';
    return new Date(ts._seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const pending  = assignments.filter(a => a.status === 'pending');
  const resolved = assignments.filter(a => a.status !== 'pending');

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><UserCheck size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">Coach Assigned Positions</h2>
              <p className="text-blue-100 text-sm">Positions assigned to you by your coach — accept or reject each one</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 px-3 py-1.5 rounded-lg text-sm font-semibold">
              {pending.length} pending
            </div>
            <button onClick={fetchAssignments} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <UserCheck size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="font-bold text-gray-600 mb-1">No assignments yet</h3>
          <p className="text-gray-400 text-sm">Your coach hasn't assigned you any positions yet.</p>
        </div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div className="bg-white rounded-2xl border border-yellow-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-yellow-50 border-b border-yellow-200 flex items-center gap-2">
                <Clock size={16} className="text-yellow-600" />
                <h3 className="font-bold text-yellow-800">Pending — Action Required ({pending.length})</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {pending.map((a, i) => (
                  <div key={a.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                        <h4 className="font-bold text-gray-800 truncate">{a.positionTitle || '—'}</h4>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span><Briefcase size={11} className="inline mr-1" />{a.client || '—'}</span>
                        <span className="text-blue-600 font-semibold">Assigned by: {a.coachName}</span>
                        <span>{formatDate(a.createdAt)}</span>
                      </div>
                      {a.note && (
                        <p className="mt-1 text-xs text-gray-500 italic">Note: {a.note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => navigate(`/dash_view/${a.positionId}`)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 hover:border-blue-400 rounded-lg text-xs font-semibold text-gray-600 hover:text-blue-600 transition-all"
                        title="View position"
                      >
                        <ExternalLink size={12} /> View
                      </button>
                      <button
                        onClick={() => handleAction(a.id, 'rejected')}
                        disabled={!!acting}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {acting === a.id + 'rejected'
                          ? <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          : <XCircle size={13} />
                        }
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(a.id, 'accepted')}
                        disabled={!!acting}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                      >
                        {acting === a.id + 'accepted'
                          ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <CheckCircle size={13} />
                        }
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved */}
          {resolved.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold text-gray-700">History ({resolved.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-left">
                      <th className="px-4 py-3 font-semibold text-gray-500">#</th>
                      <th className="px-4 py-3 font-semibold text-gray-500">Position</th>
                      <th className="px-4 py-3 font-semibold text-gray-500">Client</th>
                      <th className="px-4 py-3 font-semibold text-gray-500">Coach</th>
                      <th className="px-4 py-3 font-semibold text-gray-500">Status</th>
                      <th className="px-4 py-3 font-semibold text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolved.map((a, i) => {
                      const s = STATUS_CFG[a.status] || STATUS_CFG.pending;
                      const Icon = s.icon;
                      return (
                        <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{a.positionTitle || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{a.client || '—'}</td>
                          <td className="px-4 py-3 text-blue-600 font-medium">{a.coachName || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${s.cls}`}>
                              <Icon size={11} /> {s.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400">{formatDate(a.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecruiterCoachAssignments;
