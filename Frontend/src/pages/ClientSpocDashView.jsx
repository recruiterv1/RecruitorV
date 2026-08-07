import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { UserStateContext } from '../context/AuthPro';
import axios from 'axios';
import {
  Briefcase,
  UserPlus,
  Users,
  Phone,
  Mail,
  HelpCircle,
  CheckCircle
} from 'lucide-react';

const ClientSpocDashView = () => {
  const { pos_id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useContext(UserStateContext);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  const isEditMode = searchParams.get('mode') === 'edit';
  const isCoach = user?.roleCategory?.toLowerCase() === 'coach';
  const isExpert = user?.roleCategory?.toLowerCase() === 'expert';
  const isCoachOrExpert = isCoach || isExpert;
  const isRecruiter = user?.role === 'recruiter' || user?.roleType === 'recruiter' || user?.roleCategory?.toLowerCase() === 'recruiter';

  useEffect(() => {
    const fetchPosition = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/candidate/position/${pos_id}`);
        setPosition(res.data);
      } catch (err) {
        console.error('Error fetching position:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosition();
  }, [pos_id]);

  const handleGetHelp = async (coachExpertName, coachExpertType) => {
    try {
      const response = await axios.get('/api/coach-expert/get-by-name', {
        params: {
          name: coachExpertName,
          type: coachExpertType.toLowerCase()
        },
        withCredentials: true
      });

      if (response.data.success) {
        const createResponse = await axios.post('/api/coach-expert/request/create', {
          coachExpertId: response.data.data.id,
          coachExpertType,
          coachExpertName,
          recruiterName: 'Client SPOC', // or user?.name
          positionId: pos_id,
          positionTitle: position?.position || ''
        }, { withCredentials: true });

        if (createResponse.data.success) {
          setShowSuccessNotification(true);
          setTimeout(() => setShowSuccessNotification(false), 3000);
          alert(`Help request sent to ${coachExpertType} ${coachExpertName}!`);
        }
      }
    } catch (error) {
      alert('Failed to send help request');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!position) return <div>Position not found</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle size={20} />
          <span>Help request sent!</span>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">{position.position}</h1>

      {isRecruiter && !isEditMode && !isCoachOrExpert && (
        <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-2xl border-2 border-purple-200 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase size={20} className="text-purple-600" />
            Coach / Expert
          </h3>

          {/* Coaches */}
          {position.coach_ids && position.coach_ids.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                <UserPlus size={16} />
                Coaches:
              </h4>
              {position.coach_ids.split(',').map((coachName, index) => (
                <div key={index} className="bg-white rounded-lg p-4 mb-3 border border-purple-100">
                  <p className="font-semibold text-gray-900 mb-2">{coachName.trim()}</p>
                  <div className="text-sm text-gray-600 mb-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span>****</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      <span>****@***.com</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGetHelp(coachName.trim(), 'Coach')}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-orange-600 transition-all"
                  >
                    <HelpCircle size={16} />
                    Get Help
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Experts */}
          {position.expert_ids && position.expert_ids.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                <Users size={16} />
                Experts:
              </h4>
              {position.expert_ids.split(',').map((expertName, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-purple-100">
                  <p className="font-semibold text-gray-900 mb-2">{expertName.trim()}</p>
                  <div className="text-sm text-gray-600 mb-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span>****</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      <span>****@***.com</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGetHelp(expertName.trim(), 'Expert')}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-orange-600 transition-all"
                  >
                    <HelpCircle size={16} />
                    Get Help
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {(!position.coach_ids || position.coach_ids.length === 0) && (!position.expert_ids || position.expert_ids.length === 0) && (
            <p className="text-sm text-gray-500 text-center py-8">No coaches or experts assigned to this position</p>
          )}
        </div>
      )}

      {/* Position details */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6">Position Details</h2>
        <div className="space-y-4">
          <div><strong>Client:</strong> {position.client}</div>
          <div><strong>Location:</strong> {Array.isArray(position.location) ? position.location.join(', ') : position.location || 'N/A'}</div>
          <div><strong>CTC:</strong> ₹{position.ctcStart} - ₹{position.ctcEnd}</div>
          <div><strong>Description:</strong> {position.job_desc}</div>
        </div>
      </div>
    </div>
  );
};

export default ClientSpocDashView;
