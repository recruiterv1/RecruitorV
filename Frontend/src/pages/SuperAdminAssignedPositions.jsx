import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Loader2,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Users
} from 'lucide-react';

const SuperAdminAssignedPositions = () => {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssignedPositions();
  }, []);

  const fetchAssignedPositions = async () => {
    try {
      setLoading(true);
      console.log('🔍 SuperAdmin fetching /admin/assigned-positions...');
      const response = await axios.get('/admin/assigned-positions', { withCredentials: true });
      console.log('✅ Assigned positions loaded:', response.data);
      setData(response.data.positions || []);
      setError(null);
    } catch (err) {
      console.error('❌ Assigned positions error:', err.response?.data || err.message || err);
      setError('Failed to load. Check console for details (auth/backend?).');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-blue-50 to-orange-50 rounded-2xl p-8">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-6" />
          <p className="text-xl font-semibold text-gray-700 mb-2">Loading Assigned Positions...</p>
          <p className="text-gray-500">Fetching positions and assignments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-8">
        <div className="text-center max-w-lg mx-auto">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Failed to Load Data</h3>
          <p className="text-lg text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchAssignedPositions}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold"
          >
            <Clock className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-24 bg-gradient-to-br from-indigo-50 via-blue-50 to-orange-50 rounded-3xl border-4 border-dashed border-gray-200">
        <Users className="w-28 h-28 text-gray-300 mx-auto mb-8" />
        <h3 className="text-4xl font-bold text-gray-900 mb-4">No Assigned Positions Yet</h3>
        <p className="text-xl text-gray-600">
          Assignments will appear here once approved.
        </p>
      </div>
    );
  }

  return (

    <div className="space-y-8">

      {/* HEADER */}

      <div className="bg-white rounded-2xl shadow-xl p-8 flex justify-between items-center">

        <div>
          <h1 className="text-4xl font-black text-gray-900">
            Assigned Positions Dashboard
          </h1>

          <p className="text-xl text-gray-700 mt-2">
            {data.length} positions • {data.reduce((sum, pos) =>
              sum + (pos.recruiters?.length || 0) + (pos.coachExperts?.length || 0), 0
            )} total assignments
          </p>
        </div>

        <button
          onClick={fetchAssignedPositions}
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl flex items-center gap-2"
        >
          <Clock className="w-5 h-5" />
          Refresh
        </button>

      </div>

      {/* TABLE */}

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full divide-y divide-gray-200">

            <thead>
              <tr className="bg-gray-100 text-xs font-bold text-gray-900 uppercase">

                <th className="px-6 py-4 text-left">Clientspoc Contact</th>
                <th className="px-6 py-4 text-left">Recruiters Assigned</th>
                <th className="px-6 py-4 text-left">Coaches / Experts</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Position Created</th>
                <th className="px-6 py-4 text-left">Request Dates</th>

              </tr>
            </thead>

            <tbody className="divide-y">

              {data.map((position) => {

                const recruiters = position.recruiters || [];
                const coachExperts = position.coachExperts || [];

                const maxRows = Math.max(recruiters.length, coachExperts.length, 1);

                return Array.from({ length: maxRows }, (_, rowIndex) => {

                  const recruiterDates = recruiters.map(r =>
                    new Date(r.requestSent).getTime()
                  );

                  const coachDates = coachExperts.map(c =>
                    new Date(c.requestSent).getTime()
                  );

                  const allDates = [...recruiterDates, ...coachDates];

                  const firstRequestDate =
                    allDates.length > 0
                      ? new Date(Math.min(...allDates)).toLocaleDateString()
                      : 'N/A';

                  return (

                    <tr key={`${position.pos_id}-${rowIndex}`} className="hover:bg-gray-50">

                      {/* CLIENT */}

                      {rowIndex === 0 && (

                        <td rowSpan={maxRows} className="px-6 py-4">

                          <div className="font-bold">{position.clientspoc_name}</div>

                          <div className="text-sm flex items-center gap-1 text-gray-600">
                            <Mail className="w-4 h-4" /> {position.clientspoc_email}
                          </div>

                          {position.clientspoc_phone !== 'N/A' && (
                            <div className="text-sm flex items-center gap-1 text-gray-600">
                              <Phone className="w-4 h-4" /> {position.clientspoc_phone}
                            </div>
                          )}

                          <div className="text-xs text-gray-500 mt-2">
                            Position: {position.position}
                          </div>

                          <div className="text-xs text-gray-500">
                            Client: {position.client}
                          </div>

                        </td>
                      )}

                      {/* RECRUITER */}

                      <td className="px-6 py-4">

                        {recruiters[rowIndex] ? (

                          <div>

                            <div className="font-semibold">
                              {recruiters[rowIndex].name}
                            </div>

                            <div className="text-sm text-gray-600">
                              {recruiters[rowIndex].email}
                            </div>

                          </div>

                        ) : (
                          <span className="text-gray-400">—</span>
                        )}

                      </td>

                      {/* COACH */}

                      <td className="px-6 py-4">

                        {coachExperts[rowIndex] ? (

                          <div>

                            <div className="text-sm font-semibold text-emerald-700">
                              {coachExperts[rowIndex].role}
                            </div>

                            <div className="font-semibold">
                              {coachExperts[rowIndex].name}
                            </div>

                            <div className="text-sm text-gray-600">
                              {coachExperts[rowIndex].email}
                            </div>

                          </div>

                        ) : (
                          <span className="text-gray-400">—</span>
                        )}

                      </td>

                      {/* STATUS */}

                      {rowIndex === 0 && (

                        <td rowSpan={maxRows} className="px-6 py-4">

                          {position.status === 'fully_assigned' && (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" /> Fully Assigned
                            </span>
                          )}

                          {position.status === 'partially_assigned' && (
                            <span className="text-amber-700 font-semibold flex items-center gap-1">
                              <Clock className="w-4 h-4" /> Partially Assigned
                            </span>
                          )}

                          {position.status === 'open' && (
                            <span className="text-gray-600 font-semibold flex items-center gap-1">
                              <Users className="w-4 h-4" /> Open
                            </span>
                          )}

                        </td>
                      )}

                      {/* CREATED */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-2">

                          <Calendar className="w-4 h-4 text-blue-600" />

                          <div>
                            <div>{position.dateCreated}</div>
                            <div className="text-xs text-gray-500">{position.pos_id}</div>
                          </div>

                        </div>

                      </td>

                      {/* REQUEST DATE */}

                      <td className="px-6 py-4">

                        {rowIndex === 0 && (

                          <div>

                            <div className="text-sm text-gray-600">
                              First: {firstRequestDate}
                            </div>

                            {position.recruiters?.[0]?.approvedAt && (
                              <div className="text-emerald-600 text-sm">
                                Approved: {position.recruiters[0].approvedAt}
                              </div>
                            )}

                          </div>

                        )}

                      </td>

                    </tr>

                  );

                });

              })}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

};

export default SuperAdminAssignedPositions;