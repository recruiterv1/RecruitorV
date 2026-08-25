import React from 'react';
import PortalLanding from '../components/PortalLanding';

// Marketing landing for consulting / staffing firms.
export default function ConsultingLanding() {
  return (
    <PortalLanding
      eyebrow="For Consulting Firms"
      title="Your clients, your recruiters, your platform."
      subtitle="Run your staffing firm on RecruiterV — add your client companies and their positions, build your recruiting team, and keep the whole operation in one place."
      primary={{ label: 'Register your Firm', to: '/consulting-register' }}
      secondary={{ label: 'Firm sign in', to: '/consulting' }}
      benefits={[
        { icon: '🏢', title: 'Your client companies', body: 'Add the companies you recruit for and the positions you hold, kept private to your firm.' },
        { icon: '👥', title: 'Your recruiters and SPOCs', body: 'Add recruiters and your own Client SPOCs, each with their own login and scope.' },
        { icon: '🔐', title: 'Private by default', body: 'Positions you add are visible to your own team, not to the wider platform.' },
        { icon: '📈', title: 'Reporting that adds up', body: 'Track submissions, conversions and per-recruiter performance, and export what you need.' },
        { icon: '🌐', title: 'A public firm page', body: 'Every firm gets a shareable page listing the positions you want seen publicly.' },
        { icon: '🌍', title: 'Reach beyond your bench', body: 'Your recruiters can work RecruiterV positions too when your own pipeline is thin.' },
      ]}
      steps={[
        'Register your firm and tell us how you operate.',
        'Add your client companies and the positions you are working.',
        'Build your team — recruiters and Client SPOCs, each with a login.',
        'Track submissions and performance from your firm dashboard.',
      ]}
      closing={{
        title: 'Set your firm up on RecruiterV',
        body: 'Bring your clients and your team onto one platform.',
      }}
    />
  );
}
