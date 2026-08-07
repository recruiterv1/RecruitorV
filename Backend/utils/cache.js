// Tiny in-memory TTL cache shared across requests.
//
// With a warm instance (minInstances: 1) this map persists between requests, so
// an expensive aggregation (full-collection scans in the stats models) runs at
// most once per TTL and every other request is served instantly from memory.
//
// This is a speed layer, not a source of truth: values may be a few minutes
// stale, which is perfectly fine for dashboards/stats. Never cache per-request
// auth decisions or anything that must be exact-to-the-second here.
const store = new Map();

// De-dupes concurrent misses too: if 5 users hit the same cold key at once, the
// work runs once and all 5 await the same promise (avoids a thundering herd of
// 15k-doc scans).
const inflight = new Map();

async function cached(key, ttlMs, fn) {
  const hit = store.get(key);
  if (hit && (Date.now() - hit.t) < ttlMs) return hit.v;

  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    try {
      const v = await fn();
      store.set(key, { v, t: Date.now() });
      return v;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

// Drop cached entries (all, or those whose key starts with `prefix`) so a write
// can force fresh data on the next read.
function invalidate(prefix) {
  if (!prefix) { store.clear(); return; }
  for (const k of [...store.keys()]) if (k.startsWith(prefix)) store.delete(k);
}

module.exports = { cached, invalidate };
