import React from 'react';
import PortalLanding from '../components/PortalLanding';

// Marketing landing for companies with an ongoing hiring programme.
export default function CompanyLanding() {
  return (
    <PortalLanding
      eyebrow="For Companies"
      title="Run all your hiring from one place."
      subtitle="A company account gives your whole talent team a shared view — post positions, add your HRs by skill area, and follow every candidate from submission to offer."
      primary={{ label: 'Register your Company', to: '/company-signup' }}
      secondary={{ label: 'Company sign in', to: '/company' }}
      benefits={[
        { icon: '👥', title: 'Your HR team, by skill area', body: 'Add HRs and give each one the skill categories they own. They see only the positions and candidates that belong to them.' },
        { icon: '📊', title: 'Progress on every position', body: 'See how many candidates each position has, where they are in the process, and what is stalling.' },
        { icon: '🔁', title: 'Move candidates yourself', body: 'Change status, schedule interviews and record decisions without going through anyone else.' },
        { icon: '🤝', title: 'Dedicated Client SPOCs', body: 'One or more Client SPOCs are assigned to your account and publish your positions to recruiters.' },
        { icon: '🎯', title: 'Reach the right recruiters', body: 'Published positions go to recruiters, coaches and experts working in that skill area.' },
        { icon: '🗂️', title: 'One history, not many inboxes', body: 'Every submission, note and status change stays against the position.' },
      ]}
      steps={[
        'Register your company and tell us how you hire.',
        'A Client SPOC is assigned to your account and approves it.',
        'Add your HRs and give each the skill categories they handle.',
        'Post positions — your SPOC publishes them to matching recruiters.',
        'Track candidates and move them through your stages.',
      ]}
      closing={{
        title: 'Set your company up on RecruiterV',
        body: 'Registration takes a few minutes. Your Client SPOC will be in touch once your account is approved.',
      }}
    />
  );
}
