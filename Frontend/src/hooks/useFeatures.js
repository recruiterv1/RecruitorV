import { useEffect, useState } from 'react';
import axios from 'axios';

// What the product currently offers. The server decides; this just asks.
//
// Defaults to everything on, so a slow or failed call never hides a feature
// that is actually available — a missing menu is harder to diagnose than a
// brief flicker.
let cache = null;

export default function useFeatures() {
  const [features, setFeatures] = useState(cache || { coachExpert: true });

  useEffect(() => {
    if (cache) return;
    axios.get('/api/features', { withCredentials: true })
      .then(r => {
        if (r.data?.success && r.data.features) {
          cache = r.data.features;
          setFeatures(r.data.features);
        }
      })
      .catch(() => {});
  }, []);

  return features;
}
