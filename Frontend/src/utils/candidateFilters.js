// Shared filtering for the candidate lists, so every list narrows identically.
// Rows are expected to expose: candidate, emails, mob, pos_id, pos_name, client,
// source, statusa, recruiterEmail, recruiterName, curr_emp.

export const EMPTY_FILTERS = { q: '', status: '', pos_id: '', client: '', source: '', recruiter: '' };

export const applyCandidateFilters = (rows, f) => {
  const q = (f.q || '').trim().toLowerCase();
  return rows.filter(r => {
    if (f.status && (r.statusa || '') !== f.status) return false;
    if (f.pos_id && String(r.pos_id || '') !== String(f.pos_id)) return false;
    if (f.client && (r.client || '') !== f.client) return false;
    if (f.source && (r.source || '') !== f.source) return false;
    if (f.recruiter && (r.recruiterEmail || '').toLowerCase() !== f.recruiter.toLowerCase()) return false;
    if (!q) return true;
    return [r.candidate, r.emails, r.mob, r.pos_name, r.client, r.recruiterName, r.curr_emp]
      .some(v => String(v || '').toLowerCase().includes(q));
  });
};

// Build the dropdown options from the rows themselves, so a filter never offers
// a value that matches nothing.
export const facetsFromRows = (rows) => {
  const uniq = (k) => [...new Set(rows.map(r => r[k]).filter(Boolean))].sort();
  return {
    statuses: uniq('statusa'),
    positions: [...new Map(rows.filter(r => r.pos_id)
      .map(r => [r.pos_id, { pos_id: r.pos_id, pos_name: r.pos_name || r.pos_id }])).values()]
      .sort((a, b) => a.pos_name.localeCompare(b.pos_name)),
    clients: uniq('client'),
    sources: uniq('source'),
    recruiters: [...new Map(rows.filter(r => r.recruiterEmail)
      .map(r => [r.recruiterEmail, { email: r.recruiterEmail, name: r.recruiterName || r.recruiterEmail }])).values()]
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
};
