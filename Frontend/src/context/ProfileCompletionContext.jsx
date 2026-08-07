import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { UserStateContext } from './AuthPro';

export const ProfileCompletionContext = createContext({ completion: null, loading: true, refresh: () => {} });

const RESTRICTED_ROLES = ['Coach', 'Recruiter', 'Expert'];
const MIN_COMPLETION = 80;

export const ProfileCompletionProvider = ({ children }) => {
  const { user } = useContext(UserStateContext);
  const [completion, setCompletion] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const res = await axios.get('/api/profile/profile-completion', { withCredentials: true });
      if (res.data.success) setCompletion(res.data.completion.percentage);
    } catch (_) {}
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const isBlocked = !loading &&
    RESTRICTED_ROLES.includes(user?.roleCategory) &&
    completion !== null &&
    completion < MIN_COMPLETION;

  return (
    <ProfileCompletionContext.Provider value={{ completion, loading, refresh: fetch, isBlocked, minCompletion: MIN_COMPLETION }}>
      {children}
    </ProfileCompletionContext.Provider>
  );
};

export const useProfileCompletion = () => useContext(ProfileCompletionContext);
