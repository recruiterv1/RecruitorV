// The rejection reasons a Client SPOC picks from when screening a candidate.
//
// Shared rather than duplicated: a coach rejecting in the review bin chooses
// from the same list, so a rejection means the same thing wherever it happened
// and the two can be counted together.
//
// The backend emails the sharing recruiter guidance matched to the reason, so
// these strings are meaningful — do not reword one without checking that.
export const SCREEN_REJECT_REASONS = [
  'Experience Short', 'Experience High', 'Skill Mismatch', 'Notice Period',
  'Budget Mismatch', 'Notice Verification', 'Relevant Experience', 'Job Stability',
  'Recent Switch', 'Employer Concern', 'Employment Gap', 'Location Mismatch',
  'Industry Mismatch', 'Communication', 'Skills Not Evident',
];

export default SCREEN_REJECT_REASONS;
