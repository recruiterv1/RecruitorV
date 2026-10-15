import { useEffect, useState } from 'react';
import axios from 'axios';

// What the product currently offers. The server decides; this just asks.
//
// Two defaults, because the right one depends on the screen. `coachExpert`
// starts true so a signed-in user never loses a menu to a slow request. But the
// public pages must not advertise a role for the moment before the answer
// arrives — a withdrawn role flashing on the home page is worse than a beat of
// nothing — so they wait for `ready` instead.
//
// Cached for the session, so only the first page load ever waits.
let cache = null;

export default function useFeatures() {
  const [state, setState] = useState(
    cache ? { ...cache, ready: true } : { coachExpert: true, ready: false });

  useEffect(() => {
    if (cache) return;
    axios.get('/api/features', { withCredentials: true })
      .then(r => {
        if (r.data?.success && r.data.features) {
          cache = r.data.features;
          setState({ ...r.data.features, ready: true });
        }
      })
      // A failed call leaves `ready` false, so the public pages stay quiet
      // rather than guessing at what is open.
      .catch(() => {});
  }, []);

  return state;
}
