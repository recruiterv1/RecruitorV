import { useEffect, useState } from 'react';
import axios from 'axios';
import { SCREEN_REJECT_REASONS } from '../constants/rejectReasons';

// The rejection and approval reasons an admin maintains.
//
// Falls back to the built-in list when the request fails, so a reviewer is
// never left with an empty dropdown and unable to reject anyone — losing an
// admin's edits for one session is much the lesser problem.
export default function useReviewReasons() {
  const [rejectReasons, setRejectReasons] = useState(SCREEN_REJECT_REASONS);
  const [approveReasons, setApproveReasons] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    axios.get('/api/review-reasons', { withCredentials: true })
      .then(r => {
        if (!live) return;
        const rj = (r.data?.reject || []).map(x => x.label).filter(Boolean);
        const ap = (r.data?.approve || []).map(x => x.label).filter(Boolean);
        // An empty list means "not configured yet", not "no reasons allowed".
        if (rj.length) setRejectReasons(rj);
        setApproveReasons(ap);
      })
      .catch(() => { /* keep the built-in list */ })
      .finally(() => { if (live) setLoaded(true); });
    return () => { live = false; };
  }, []);

  return { rejectReasons, approveReasons, loaded };
}
