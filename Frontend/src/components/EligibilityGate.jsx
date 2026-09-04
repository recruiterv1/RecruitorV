import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { readEligibilityPass } from '../utils/eligibilityPass';

// Registration is only reachable once the eligibility check has been cleared.
//
// The hard rule lives on the server — /auth/register refuses a Coach, Expert or
// Recruiter without a passing attempt. This wrapper is the front-door version of
// the same rule: it keeps the form from opening at all, so nobody fills it in
// only to be turned away, and so a stray /reg link anywhere on the site cannot
// become a way in.
//
// A visitor is let through when the server confirms a pass for the email and
// role they are carrying — either in the URL (the check page hands both over) or
// remembered from when they passed in this browser.

export default function EligibilityGate({ children }) {
  const [state, setState] = useState('checking');   // checking | allowed | denied

  useEffect(() => {
    let live = true;
    const params = new URLSearchParams(window.location.search);
    const remembered = readEligibilityPass();
    const email = (params.get('email') || remembered?.email || '').trim().toLowerCase();
    const role = params.get('role') || remembered?.role || '';

    // Nothing to go on — send them to the check.
    if (!email || !role) { setState('denied'); return; }

    // The server is the authority on whether this pass is real.
    axios.get('/api/eligibility/public/status', { params: { role, email } })
      .then(r => {
        if (!live) return;
        // A role with no questions is not gated, so `passed` comes back true.
        setState(r.data?.passed ? 'allowed' : 'denied');
      })
      .catch(() => {
        // If the check cannot be reached, do not strand a legitimate candidate:
        // let them through and let the server refuse on submit if it must.
        if (live) setState('allowed');
      });

    return () => { live = false; };
  }, []);

  if (state === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Checking your eligibility…
      </div>
    );
  }
  if (state === 'denied') {
    return <Navigate to="/check-eligibility" replace />;
  }
  return children;
}
