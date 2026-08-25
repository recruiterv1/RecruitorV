import React from 'react';
import PortalLanding from '../components/PortalLanding';

// Marketing landing for employers. The position form now lives at
// /for-employer/post; this page is the way in.
export default function EmployerLanding() {
  return (
    <PortalLanding
      eyebrow="For Employers"
      title="Post a position. Reach recruiters who already know your market."
      subtitle="Share what you're hiring for and RecruiterV puts it in front of recruiters, coaches and experts working in that exact skill area — so you see relevant CVs, not a flood."
      primary={{ label: 'Post a Position', to: '/for-employer/post' }}
      secondary={{ label: 'Already posted? Sign in', to: '/company' }}
      benefits={[
        { icon: '🎯', title: 'Matched to the right recruiters', body: 'Your position reaches recruiters whose skill category matches it, rather than everybody on the platform.' },
        { icon: '👀', title: 'See every candidate', body: 'Track each submission, read the full profile and resume, and move candidates through your own stages.' },
        { icon: '✅', title: 'Reviewed before it goes live', body: 'A RecruiterV Client SPOC checks your position before it is published, so the brief reaching recruiters is complete.' },
        { icon: '💬', title: 'A named point of contact', body: 'Every employer gets a dedicated Client SPOC — one person accountable for your hiring on the platform.' },
        { icon: '📄', title: 'Nothing to install', body: 'Post, review and decide from the browser. No setup, no integration, no licence.' },
        { icon: '🔒', title: 'Your details stay yours', body: 'Contact details are never exposed to candidates; recruiters work through the platform.' },
      ]}
      steps={[
        'Tell us who you are and the position you are hiring for.',
        'Your Client SPOC reviews the brief and publishes it to matching recruiters.',
        'Candidates start arriving — review profiles and resumes as they come in.',
        'Move each candidate through your stages, from screening to offer.',
      ]}
      closing={{
        title: 'Start hiring with RecruiterV',
        body: 'It takes a few minutes to describe your position. You will hear from your Client SPOC as soon as it is reviewed.',
      }}
    />
  );
}
