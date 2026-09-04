import React from 'react';
import { Award } from 'lucide-react';

// The mark shown against anyone who reached Certified (80–100) on the
// eligibility assessment. Used anywhere a user is listed, so the standing
// travels with the person rather than living only in the assessment results.
//
// Pass `tier` straight from the record — anything other than 'certified'
// renders nothing, so it can be dropped into a list without a guard.

export default function CertifiedBadge({ tier, size = 'sm', withLabel = true, className = '' }) {
  if (tier !== 'certified') return null;

  const s = {
    xs: { box: 'text-[9px] px-1.5 py-0.5 gap-1', icon: 9 },
    sm: { box: 'text-[10px] px-2 py-0.5 gap-1', icon: 10 },
    md: { box: 'text-[11px] px-2.5 py-1 gap-1.5', icon: 12 },
  }[size] || { box: 'text-[10px] px-2 py-0.5 gap-1', icon: 10 };

  return (
    <span
      title="Certified on the RecruiterV eligibility assessment"
      className={`inline-flex items-center rounded-full font-bold border whitespace-nowrap
        bg-amber-50 text-amber-800 border-amber-300 ${s.box} ${className}`}
    >
      <Award size={s.icon} className="flex-shrink-0" />
      {withLabel && 'Certified'}
    </span>
  );
}

// The conditional standing, shown where it matters that someone is on the
// probationary pipeline rather than fully cleared.
export function TierBadge({ tier, positionCap, size = 'sm', className = '' }) {
  if (tier === 'certified') return <CertifiedBadge tier={tier} size={size} className={className} />;
  if (tier !== 'conditional') return null;

  const s = {
    xs: 'text-[9px] px-1.5 py-0.5',
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-[11px] px-2.5 py-1',
  }[size] || 'text-[10px] px-2 py-0.5';

  return (
    <span
      title={positionCap ? `Conditional — capped at ${positionCap} active positions` : 'Conditional standing'}
      className={`inline-flex items-center rounded-full font-bold border whitespace-nowrap
        bg-slate-100 text-slate-600 border-slate-300 ${s} ${className}`}
    >
      Conditional
    </span>
  );
}
