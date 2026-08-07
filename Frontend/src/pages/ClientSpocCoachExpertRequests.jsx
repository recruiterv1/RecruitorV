import React, { useState, useEffect, useMemo, useContext } from 'react';
import axios from 'axios';
import { Briefcase, Users, Mail, Phone, Clock } from 'lucide-react';
import { Chip } from '@mui/material';
import { UserStateContext } from '../context/AuthPro';

const ClientSpocCoachExpertRequests = () => {
  const { user } = useContext(UserStateContext);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('requestedAt');
  const [sortDir, setSortDir] = useState('desc');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/coach-expert/clientspoc/position-requests', {
        params: { email: user?.email },
        withCredentials: true
      });
      if (res.data.success) {
        setRows(res.data.data || []);
      } else {
        setRows([]);
      }
    } catch (err) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const formatDate = (d) => {
    if (!d) return 'N/A';
    try {
      const date = new Date(d);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const groupedByPosition = useMemo(() => {
    const map = {};
    rows.forEach(r => {
      const key = r.positionId || 'unknown';
      if (!map[key]) {
        map[key] = {
          positionId: r.positionId,
          positionTitle: r.positionTitle,
          client: r.client,
          requests: []
        };
      }
      map[key].requests.push(r);
    });
    // Sort each group by requestedAt desc (No Request last)
    Object.values(map).forEach(group => {
      const reqComparator = (a, b) => {
        const getReqVal = (obj) => {
          if (sortKey === 'coachExpertName') return (obj.coachExpertName || '').toLowerCase();
          if (sortKey === 'coachExpertEmail') return (obj.coachExpertEmail || '').toLowerCase();
          if (sortKey === 'coachExpertPhone') return (obj.coachExpertPhone || '').toLowerCase();
          if (sortKey === 'status') return (obj.status || '').toLowerCase();
          if (sortKey === 'requestedAt') return obj.requestedAt ? new Date(obj.requestedAt).getTime() : 0;
          return obj.requestedAt ? new Date(obj.requestedAt).getTime() : 0;
        };
        const va = getReqVal(a);
        const vb = getReqVal(b);
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      };
      group.requests.sort(reqComparator);
    });
    let groups = Object.values(map).filter(g => g.requests.some(r => r.id));
    const groupComparator = (ga, gb) => {
      const getGroupVal = (g) => {
        if (sortKey === 'positionTitle') return (g.positionTitle || '').toLowerCase();
        if (sortKey === 'client') return (g.client || '').toLowerCase();
        if (sortKey === 'coachExpertName') return (g.requests[0]?.coachExpertName || '').toLowerCase();
        if (sortKey === 'coachExpertEmail') return (g.requests[0]?.coachExpertEmail || '').toLowerCase();
        if (sortKey === 'coachExpertPhone') return (g.requests[0]?.coachExpertPhone || '').toLowerCase();
        if (sortKey === 'status') return (g.requests[0]?.status || '').toLowerCase();
        if (sortKey === 'requestedAt') return g.requests[0]?.requestedAt ? new Date(g.requests[0].requestedAt).getTime() : 0;
        return g.requests[0]?.requestedAt ? new Date(g.requests[0].requestedAt).getTime() : 0;
      };
      const va = getGroupVal(ga);
      const vb = getGroupVal(gb);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    };
    return groups.sort(groupComparator);
  }, [rows, sortKey, sortDir]);

  return (
    <div className="w-full py-6">
      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Recuiters Requests</h3>
              <p className="text-blue-100 text-sm">Positions created by you with sent requests and statuses</p>
            </div>
          </div>
        </div>

        <div className="p-3">
          <div className="overflow-x-auto">
            <table className="min-w-full border-2 border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th onClick={() => handleSort('positionTitle')} className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none">
                    Position {sortKey === 'positionTitle' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSort('client')} className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none">
                    Client {sortKey === 'client' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSort('recruiterName')} className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none">
                    Recruiter {sortKey === 'recruiterName' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSort('recruiterEmail')} className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none">
                    Recruiter Email {sortKey === 'recruiterEmail' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSort('recruiterPhone')} className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none">
                    Recruiter Phone {sortKey === 'recruiterPhone' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSort('coachExpertName')} className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none">
                    Coach/Expert {sortKey === 'coachExpertName' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSort('coachExpertEmail')} className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none">
                    Email {sortKey === 'coachExpertEmail' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSort('coachExpertPhone')} className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none">
                    Phone {sortKey === 'coachExpertPhone' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSort('status')} className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none">
                    Status {sortKey === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSort('requestedAt')} className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none">
                    Requested On {sortKey === 'requestedAt' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-600">Loading...</td>
                  </tr>
                ) : groupedByPosition.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No data available</td>
                  </tr>
                ) : (
                  groupedByPosition.map(group => {
                    const rowSpan = Math.max(group.requests.length, 1);
                    return group.requests.map((req, idx) => (
                      <tr key={`${group.positionId}-${req.id || idx}`}>
                        {idx === 0 && (
                          <>
                            <td rowSpan={rowSpan} className="px-3 py-2 align-top">
                              <div className="flex items-center gap-2">
                                <Briefcase size={16} className="text-green-600" />
                                <div>
                                  <div className="font-semibold text-gray-900 text-sm">{group.positionTitle || 'N/A'}</div>
                                  <div className="text-xs text-gray-500">ID: {group.positionId || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td rowSpan={rowSpan} className="px-3 py-2 align-top text-sm text-gray-700">
                              {group.client || 'N/A'}
                            </td>
                          </>
                        )}
                        <td className="px-3 py-2 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900">{req.recruiterName || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <Mail size={16} className="text-blue-600" />
                            <div className="font-medium">{req.recruiterEmail || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <Phone size={16} className="text-blue-600" />
                            <div className="font-medium">{req.recruiterPhone || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Users size={16} className={req.coachExpertType === 'Coach' ? 'text-purple-600' : 'text-orange-600'} />
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{req.coachExpertName || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{req.coachExpertType || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Mail size={14} className="text-blue-600" />
                            <span className="text-sm">{req.coachExpertEmail || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone size={14} className="text-blue-600" />
                            <span className="text-sm">{req.coachExpertPhone || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Chip label={req.status || 'N/A'} color={req.status === 'accepted' ? 'success' : (req.status === 'pending' ? 'warning' : 'default')} variant="filled" />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Clock size={14} className="text-orange-500" />
                            <span className="text-sm">{formatDate(req.requestedAt)}</span>
                          </div>
                        </td>
                      </tr>
                    ));
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-semibold"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSpocCoachExpertRequests;
