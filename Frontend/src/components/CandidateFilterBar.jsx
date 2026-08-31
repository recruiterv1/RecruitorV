import React from 'react';
import { Search, X } from 'lucide-react';

// Matching logic and the empty-filter shape live in ../utils/candidateFilters
// so this file only exports the component (fast refresh requirement).

// Shared filter bar for the candidate lists. Each select is only rendered when
// there is something to choose from, so a list with one client or no direct
// sources doesn't show a dropdown that can't change anything.
//
// `value` is a plain object of the active filters; `onChange(next)` replaces it.
export default function CandidateFilterBar({
  value, onChange, facets = {}, showRecruiter = false, resultCount, totalCount,
}) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  const clear = () => onChange({ q: '', status: '', pos_id: '', client: '', source: '', recruiter: '' });
  const active = Object.entries(value).filter(([, v]) => v).length;

  const sel = 'h-9 rounded-lg border border-gray-300 bg-white px-2.5 text-sm text-gray-700 focus:border-orange-400 outline-none max-w-[180px]';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3.5 flex flex-wrap items-center gap-2.5">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={value.q || ''}
          onChange={(e) => set('q', e.target.value)}
          placeholder="Search name, email, phone, position…"
          className="h-9 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-orange-400 outline-none"
        />
      </div>

      {!!facets.statuses?.length && (
        <select value={value.status || ''} onChange={(e) => set('status', e.target.value)} className={sel}>
          <option value="">All statuses</option>
          {facets.statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}

      {!!facets.positions?.length && (
        <select value={value.pos_id || ''} onChange={(e) => set('pos_id', e.target.value)} className={sel}>
          <option value="">All positions</option>
          {facets.positions.map(p => (
            <option key={p.pos_id} value={p.pos_id}>{p.pos_name} (#{p.pos_id})</option>
          ))}
        </select>
      )}

      {facets.clients?.length > 1 && (
        <select value={value.client || ''} onChange={(e) => set('client', e.target.value)} className={sel}>
          <option value="">All clients</option>
          {facets.clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}

      {showRecruiter && !!facets.recruiters?.length && (
        <select value={value.recruiter || ''} onChange={(e) => set('recruiter', e.target.value)} className={sel}>
          <option value="">All recruiters</option>
          {facets.recruiters.map(r => <option key={r.email} value={r.email}>{r.name || r.email}</option>)}
        </select>
      )}

      {facets.sources?.length > 1 && (
        <select value={value.source || ''} onChange={(e) => set('source', e.target.value)} className={sel}>
          <option value="">All sources</option>
          {facets.sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}

      {active > 0 && (
        <button onClick={clear}
          className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
          <X size={13} /> Clear
        </button>
      )}

      <span className="ml-auto text-xs text-gray-500 whitespace-nowrap">
        {resultCount === totalCount
          ? `${totalCount} candidate${totalCount === 1 ? '' : 's'}`
          : `${resultCount} of ${totalCount}`}
      </span>
    </div>
  );
}
