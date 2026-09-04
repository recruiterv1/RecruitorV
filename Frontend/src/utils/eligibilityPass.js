// Remembering that this browser cleared the eligibility check.
//
// Only a convenience: it saves carrying the email in the URL. The server is
// always asked to confirm the pass before registration opens, and refuses the
// registration itself regardless, so nothing here can be used to get in.

const PASS_KEY = 'rv_eligibility_pass';

export const rememberEligibilityPass = (email, role) => {
  try {
    localStorage.setItem(PASS_KEY, JSON.stringify({ email, role, at: Date.now() }));
  } catch { /* private browsing — the URL hand-off still works */ }
};

export const readEligibilityPass = () => {
  try {
    const raw = localStorage.getItem(PASS_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && v.email && v.role ? v : null;
  } catch { return null; }
};
