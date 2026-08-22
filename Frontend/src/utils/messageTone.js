// Is this user-facing message good news or bad?
//
// Login and OTP screens infer the colour of their banner from the message text.
// The checks were case-sensitive `includes("success")`, so the server's actual
// reply — "Login Successfully!" with a capital S — fell through to the error
// styling and a successful login was shown in red.
//
// Matching is case-insensitive and covers the wording these flows really use.

const SUCCESS_PATTERNS = [
  /success/i,          // success, successful, Successfully
  /verified/i,
  /redirecting/i,
  /logged in/i,
  /welcome back/i,
  /\bsent\b/i,         // "OTP sent to your email"
  /✅|✓/,
];

// Words that look positive but appear in failures — "verification failed",
// "unsuccessful". Checked first so they win.
const FAILURE_PATTERNS = [
  /fail/i, /unsuccessful/i, /invalid/i, /incorrect/i, /error/i,
  /not found/i, /expired/i, /denied/i, /blocked/i, /on hold/i,
  /try again/i, /wrong/i, /unable/i, /already/i,
];

export function isSuccessMessage(message) {
  const m = String(message || '');
  if (!m.trim()) return false;
  if (FAILURE_PATTERNS.some(re => re.test(m))) return false;
  return SUCCESS_PATTERNS.some(re => re.test(m));
}

export default isSuccessMessage;
