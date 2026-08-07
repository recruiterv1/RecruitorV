import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, UserCircle, X } from 'lucide-react';

/**
 * Modal shown when a user clicks a sidebar item but their profile is below 80%.
 * Pass `onClose` to dismiss.
 */
const ProfileIncompleteModal = ({ onClose, completion, minCompletion = 80 }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
           onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-5 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg">
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Profile Incomplete</h3>
              <p className="text-orange-100 text-sm">Complete your profile to access this feature</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm text-gray-600 font-medium">Your profile completion</span>
              <span className="text-sm font-bold text-orange-600">{completion ?? 0}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all"
                style={{ width: `${completion ?? 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Minimum required: <strong>{minCompletion}%</strong>
            </p>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            You need at least <strong>{minCompletion}% profile completion</strong> to access the dashboard features.
            Please complete your profile to continue.
          </p>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button
              onClick={() => { navigate('/profile'); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-semibold hover:shadow-md transition-all">
              <UserCircle size={16} /> Complete Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileIncompleteModal;
