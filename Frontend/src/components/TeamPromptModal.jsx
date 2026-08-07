import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { X, Users, Zap, Star, ArrowRight } from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';

const RECRUITER_KEY  = 'teamPrompt_recruiter';
const CE_KEY         = 'teamPrompt_coachexpert';

const Modal = ({ title, subtitle, bullets, ctaLabel, ctaPath, onClose }) => {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-orange-100 text-sm">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2.5">
            {bullets.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3 bg-orange-50 rounded-xl px-4 py-3">
                <Icon size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{text}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
            >
              Maybe Later
            </button>
            <button
              onClick={() => { onClose(); navigate(ctaPath); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all"
            >
              {ctaLabel} <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamPromptModal = () => {
  const { user, isChecking } = useContext(UserStateContext);
  const [show, setShow] = useState(false);
  const [modalType, setModalType] = useState(null); // 'recruiter' | 'coachexpert'

  useEffect(() => {
    if (isChecking || !user) return;

    const role = (user.roleCategory || '').toLowerCase().replace(/\s/g, '');
    const isRecruiter   = !['coach', 'expert', 'superadmin', 'admin'].includes(role);
    const isCoachExpert = role === 'coach' || role === 'expert';

    if (!isRecruiter && !isCoachExpert) return;
    if (!user.agreementSigned) return;

    const storageKey = isRecruiter ? RECRUITER_KEY : CE_KEY;
    if (sessionStorage.getItem(storageKey)) return;

    // Check profile completion
    axios.get('/api/profile/profile-completion', { withCredentials: true })
      .then(res => {
        const pct = res.data?.completion?.percentage ?? 0;
        if (pct >= 80) {
          setModalType(isRecruiter ? 'recruiter' : 'coachexpert');
          setShow(true);
          sessionStorage.setItem(storageKey, '1');
        }
      })
      .catch(() => {});
  }, [user, isChecking]);

  if (!show || !modalType) return null;

  const handleClose = () => setShow(false);

  if (modalType === 'recruiter') {
    return (
      <Modal
        title="Join a Team"
        subtitle="Unlock better opportunities"
        bullets={[
          { icon: Zap,   text: 'Prior access to new positions before they go public' },
          { icon: Star,  text: 'Better incentives & higher payout rates' },
          { icon: Users, text: 'Personal guidance from an experienced Coach/Expert' },
        ]}
        ctaLabel="Join a Team"
        ctaPath="/recruiter-join-team"
        onClose={handleClose}
      />
    );
  }

  return (
    <Modal
      title="Build Your Team"
      subtitle="Grow your network & earn more"
      bullets={[
        { icon: Zap,   text: 'Give your team prior access to new positions before others' },
        { icon: Star,  text: 'Better incentives & higher earnings for you and your team' },
        { icon: Users, text: 'Guide recruiters and grow your influence on the platform' },
      ]}
      ctaLabel="My Team"
      ctaPath="/coach-team"
      onClose={handleClose}
    />
  );
};

export default TeamPromptModal;
