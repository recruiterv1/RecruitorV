import React from 'react';
import PortalLanding from '../components/PortalLanding';

// Marketing landing for recruitment vendors running their own team.
export default function VendorLanding() {
  return (
    <PortalLanding
      eyebrow="For Recruitment Vendors"
      title="Bring your recruiters. Keep your positions to yourself."
      subtitle="Run your agency on RecruiterV — register your recruiters, post your own client positions privately to your team, and let them work RecruiterV positions alongside."
      primary={{ label: 'Register as a Vendor', to: '/vendor-register' }}
      secondary={{ label: 'Vendor sign in', to: '/vendor' }}
      benefits={[
        { icon: '🔐', title: 'Your positions stay private', body: 'Positions you post are visible only to recruiters in your own team — never to the wider platform.' },
        { icon: '👥', title: 'Your whole team, managed', body: 'Register recruiters, see what each is working on, and remove them when they move on.' },
        { icon: '🎙️', title: 'Brief once, everyone hears it', body: 'Record a position briefing and your recruiters play it back item by item, in the language they prefer.' },
        { icon: '🌐', title: 'RecruiterV positions too', body: 'Your recruiters can work platform positions alongside yours, widening what they can place.' },
        { icon: '📊', title: 'One dashboard', body: 'Active positions, live CVs, positions with no coverage and client-wise load, at a glance.' },
        { icon: '🤝', title: 'Dedicated Client SPOCs', body: 'One or more Client SPOCs are attached to your account for anything you publish to the platform.' },
      ]}
      steps={[
        'Register your vendor account.',
        'Add your recruiters — each gets their own login.',
        'Post your client positions; they stay private to your team.',
        'Brief your team, assign positions, and track every submission.',
      ]}
      closing={{
        title: 'Put your agency on RecruiterV',
        body: 'Your positions stay yours. Your recruiters get more to work on.',
      }}
    />
  );
}
