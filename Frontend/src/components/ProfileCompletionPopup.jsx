import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserStateContext } from '../context/AuthPro';
import axios from 'axios';

const SESSION_KEY = 'profilePopupShown';

const ProfileCompletionPopup = () => {
  const { user } = useContext(UserStateContext);
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [percentage, setPercentage] = useState(null);

  const rc = (user?.roleCategory || '').toLowerCase().replace(/\s/g, '');
  const r  = (user?.role         || '').toLowerCase().replace(/\s/g, '');
  const isAdmin = user?.type === 'admin' || rc === 'superadmin' || r === 'superadmin';
  const isClientSpoc = user?.roleCategory?.toLowerCase() === 'clientspoc';
  const shouldCheck = user && !isAdmin && !isClientSpoc && user.agreementSigned;

  useEffect(() => {
    if (!shouldCheck) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    axios.get('/api/profile/profile-completion')
      .then(res => {
        const pct = res.data?.completion?.percentage ?? 100;
        if (pct < 75) {
          setPercentage(pct);
          setVisible(true);
          sessionStorage.setItem(SESSION_KEY, '1');
        }
      })
      .catch(() => {});
  }, [shouldCheck]);

  const handleClose = () => setVisible(false);

  const handleGoToProfile = () => {
    setVisible(false);
    navigate('/profile');
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
        padding: '16px',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          maxWidth: '440px',
          width: '100%',
          padding: '32px',
          position: 'relative',
          textAlign: 'center',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '14px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#9ca3af',
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '28px',
        }}>
          👤
        </div>

        {/* Title */}
        <h2 style={{
          margin: '0 0 12px',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#1e3a5f',
        }}>
          Complete Your Profile
        </h2>

        {/* Progress bar */}
        <div style={{
          background: '#f3f4f6',
          borderRadius: '999px',
          height: '10px',
          margin: '0 auto 16px',
          maxWidth: '280px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${percentage}%`,
            borderRadius: '999px',
            background: 'linear-gradient(90deg, #f97316, #ea580c)',
            transition: 'width 0.6s ease',
          }} />
        </div>
        <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: '#6b7280' }}>
          {percentage}% complete
        </p>

        {/* Message */}
        <p style={{
          margin: '0 0 28px',
          fontSize: '0.95rem',
          color: '#374151',
          lineHeight: 1.6,
        }}>
          Please complete your profile to get better filtered positions as per expertise.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1.5px solid #d1d5db',
              background: '#fff',
              color: '#6b7280',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Later
          </button>
          <button
            onClick={handleGoToProfile}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(249,115,22,0.35)',
            }}
          >
            Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionPopup;
