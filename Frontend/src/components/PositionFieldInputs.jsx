import React, { useState } from 'react';
import { X, Plus, CheckCircle, ChevronDown } from 'lucide-react';

// ── Helpers to convert between an HTML <ul><li> list and an array of strings ──
export const parseListItems = (html) => {
  const v = html == null ? '' : String(html);
  if (!v.trim()) return [];
  const lis = v.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  if (lis) {
    return lis
      .map(li => li.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim())
      .filter(Boolean);
  }
  // Fallback: plain text / comma-separated (older data)
  return v.replace(/<[^>]*>/g, ' ').split(/[,\n·•]+/).map(s => s.trim()).filter(Boolean);
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const itemsToHtml = (arr) => (arr.length ? `<ul>${arr.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '');

// ── Chip-style tag input (Must/Good-to-have skills) ───────────────────────────
export function TagInput({ value, onChange, maxTags = 5, maxLen = 25, placeholder = 'Type a skill and press Enter' }) {
  const tags = parseListItems(value);
  const [input, setInput] = useState('');
  const atLimit = tags.length >= maxTags;

  const add = () => {
    const t = input.trim().slice(0, maxLen);
    if (!t || atLimit) return;
    if (tags.some(x => x.toLowerCase() === t.toLowerCase())) { setInput(''); return; }
    onChange(itemsToHtml([...tags, t]));
    setInput('');
  };
  const remove = (i) => onChange(itemsToHtml(tags.filter((_, j) => j !== i)));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1 text-xs font-medium">
            {t}
            <button type="button" onClick={() => remove(i)} className="text-blue-400 hover:text-red-500"><X size={12} /></button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          maxLength={maxLen}
          disabled={atLimit}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          placeholder={atLimit ? `Max ${maxTags} tags reached` : placeholder}
          className="flex-1 h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button type="button" onClick={add} disabled={atLimit || !input.trim()}
          className="h-9 sm:h-11 px-3 rounded-lg sm:rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-40 flex items-center gap-1">
          <Plus size={14} /> Add
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-1">{tags.length}/{maxTags} tags · max {maxLen} characters per tag</p>
    </div>
  );
}

// ── List editor (Competencies) — up to `maxItems` bullet rows ─────────────────
export function ListInput({ value, onChange, maxItems = 5, maxLen = 120, placeholder = 'Add a competency' }) {
  const items = parseListItems(value);
  const [input, setInput] = useState('');
  const atLimit = items.length >= maxItems;

  const add = () => {
    const t = input.trim().slice(0, maxLen);
    if (!t || atLimit) return;
    onChange(itemsToHtml([...items, t]));
    setInput('');
  };
  const remove = (i) => onChange(itemsToHtml(items.filter((_, j) => j !== i)));

  return (
    <div>
      {items.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {items.map((t, i) => (
            <li key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="flex-1 text-sm text-gray-800 break-words">{t}</span>
              <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          maxLength={maxLen}
          disabled={atLimit}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={atLimit ? `Max ${maxItems} items reached` : placeholder}
          className="flex-1 h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button type="button" onClick={add} disabled={atLimit || !input.trim()}
          className="h-9 sm:h-11 px-3 rounded-lg sm:rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-40 flex items-center gap-1">
          <Plus size={14} /> Add
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-1">{items.length}/{maxItems} items (list only)</p>
    </div>
  );
}

// ── Char-limited textarea (Key Responsibilities, Job Summary) ─────────────────
export function LimitedTextarea({ value, onChange, maxLen = 500, rows = 5, placeholder = '' }) {
  const v = value || '';
  return (
    <div>
      <textarea
        value={v}
        maxLength={maxLen}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm resize-y"
      />
      <p className={`text-[11px] mt-1 text-right ${v.length >= maxLen ? 'text-red-500' : 'text-gray-400'}`}>{v.length}/{maxLen}</p>
    </div>
  );
}

// Education is stored as one comma-joined string; these keep that shape.
const toList = (v) => (Array.isArray(v) ? v : String(v || '').split(','))
  .map(x => String(x).trim()).filter(Boolean);

// ── Education catalogue + searchable multi-select ─────────────────────────────
export const EDUCATION_OPTIONS = [
  // General
  'Any Graduate', 'Any Postgraduate', 'Graduate / Postgraduate', 'Not Required',
  // School / pre-degree
  '10th', '12th', 'ITI', 'Diploma', 'Polytechnic Diploma',
  // Engineering & technology
  'B.Tech / B.E.', 'B.Tech - Computer Science', 'B.Tech - Information Technology',
  'B.Tech - Electronics', 'B.Tech - Electrical', 'B.Tech - Mechanical', 'B.Tech - Civil',
  'B.Tech - Chemical', 'B.Tech - Aerospace', 'B.Tech - Biotechnology',
  'M.Tech / M.E.', 'M.Tech - Computer Science', 'M.Tech - Structural Engineering',
  // Science
  'B.Sc', 'B.Sc - Computer Science', 'B.Sc - Physics', 'B.Sc - Chemistry',
  'B.Sc - Mathematics', 'B.Sc - Biology', 'B.Sc - Agriculture', 'B.Sc - Nursing',
  'M.Sc', 'M.Sc - Physics', 'M.Sc - Chemistry', 'M.Sc - Mathematics', 'M.Sc - Statistics',
  'M.Sc - Data Science', 'M.Sc - Biotechnology',
  // Commerce & management
  'B.Com', 'B.Com (Hons)', 'M.Com', 'BBA', 'BBM', 'BMS',
  'MBA / PGDM', 'MBA - Finance', 'MBA - Marketing', 'MBA - HR', 'MBA - Operations',
  'MBA - Systems / IT', 'MBA - Supply Chain', 'MBA - Business Analytics',
  'Executive MBA', 'PGDM - Rural Management',
  // Computer applications
  'BCA', 'MCA',
  // Arts, humanities & social sciences
  'BA', 'BA - English', 'BA - Economics', 'BA - Psychology', 'BA - Political Science',
  'BA - History', 'BA - Sociology', 'BA - Journalism / Mass Communication',
  'MA', 'MA - English', 'MA - Economics', 'MA - Psychology', 'MA - Sociology',
  'MA - Journalism / Mass Communication', 'BFA', 'MFA', 'BSW', 'MSW',
  // Law
  'LLB', 'BA LLB', 'BBA LLB', 'LLM',
  // Medicine & allied health
  'MBBS', 'MD', 'MS (Medicine)', 'BDS', 'MDS', 'BAMS', 'BHMS', 'BUMS', 'BPT', 'MPT',
  'B.Pharm', 'M.Pharm', 'Pharm.D', 'B.Sc - Medical Lab Technology', 'GNM', 'ANM',
  'B.V.Sc (Veterinary)', 'B.Optom', 'BOT (Occupational Therapy)',
  // Professional & finance certifications
  'CA', 'CA Inter', 'CS', 'CS Executive', 'ICWA / CMA', 'CFA', 'FRM', 'ACCA', 'CPA',
  // Education & teaching
  'B.Ed', 'M.Ed', 'D.El.Ed', 'B.P.Ed', 'NTT',
  // Design, hospitality & other vocational
  'B.Des', 'M.Des', 'B.Arch', 'M.Arch', 'BHM (Hotel Management)', 'MHM',
  'B.Sc - Hospitality', 'BLIS', 'B.Voc', 'D.Pharma',
  // Research
  'M.Phil', 'PhD', 'Post Doctoral',
];

/**
 * Searchable multi-select for education. Typing filters the whole catalogue on a
 * substring ("t" lists everything containing a t), and several qualifications can
 * be picked for one position.
 *
 * Stored as the same comma-joined string the field always held, so every page
 * that just prints `req_education` keeps working unchanged.
 */
export function EducationSelect({ value, onChange, exclude = [], placeholder = 'Search education — type to filter' }) {
  const [search, setSearch] = React.useState('');
  const [hi, setHi] = React.useState(-1);
  const [focused, setFocused] = React.useState(false);
  const [custom, setCustom] = React.useState([]);

  const selected = toList(value);
  const excl = exclude.flatMap(toList).map(e => e.toLowerCase());
  const trimmed = search.trim();

  const pool = [...new Set([...custom, ...EDUCATION_OPTIONS, ...selected])]
    .filter(o => !excl.includes(o.toLowerCase()));
  const q = trimmed.toLowerCase();
  const matches = (q ? pool.filter(o => o.toLowerCase().includes(q)) : pool)
    .sort((a, b) => {
      if (!q) return 0;
      const ai = a.toLowerCase().startsWith(q) ? 0 : 1;
      const bi = b.toLowerCase().startsWith(q) ? 0 : 1;
      return ai - bi || a.localeCompare(b);
    })
    .slice(0, 60);
  const canAdd = trimmed.length > 0
    && !pool.some(o => o.toLowerCase() === q)
    && !excl.includes(q);

  const commit = (list) => onChange(list.join(', '));
  const pick = (opt) => {
    if (!selected.some(v => v.toLowerCase() === opt.toLowerCase())) commit([...selected, opt]);
    setSearch(''); setHi(-1);
  };
  const remove = (opt) => commit(selected.filter(v => v !== opt));
  const addCustom = () => { if (!trimmed) return; setCustom(p => [...p, trimmed]); pick(trimmed); };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(i => Math.min(i + 1, matches.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (hi >= 0 && matches[hi]) pick(matches[hi]);
      else if (matches.length) pick(matches[0]);
      else if (canAdd) addCustom();
    } else if (e.key === 'Escape') setFocused(false);
    else if (e.key === 'Backspace' && !search && selected.length) remove(selected[selected.length - 1]);
  };

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={search}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => { setSearch(e.target.value); setHi(-1); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={onKeyDown}
          className="w-full h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
        />
        {focused && (matches.length > 0 || canAdd) && (
          <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
            {matches.map((opt, i) => {
              const picked = selected.some(v => v.toLowerCase() === opt.toLowerCase());
              return (
                <button key={opt} type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => (picked ? remove(opt) : pick(opt))}
                  className={`w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-2 text-left transition-colors ${
                    i === hi ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <span className="text-sm font-medium text-gray-800">{opt}</span>
                  {picked
                    ? <CheckCircle size={15} className="text-green-600 flex-shrink-0" />
                    : <Plus size={15} className="text-blue-500 flex-shrink-0" />}
                </button>
              );
            })}
            {canAdd && (
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={addCustom}
                className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-left border-t border-gray-100 hover:bg-blue-50">
                <Plus size={15} className="text-blue-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-blue-700">Add &ldquo;{trimmed}&rdquo;</span>
              </button>
            )}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map(opt => (
            <span key={opt}
              className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium">
              {opt}
              <button type="button" onClick={() => remove(opt)} className="hover:bg-blue-700 rounded-full p-0.5">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Single-select dropdown with a search box — for long option lists like CTC,
 * where typing "2" should narrow to every entry containing a 2.
 *
 * @param {{value: string|number, label: string}[]} options
 */
export function SearchSelect({ value, onChange, options, placeholder = 'Select', searchPlaceholder = 'Type to search…' }) {
  const [search, setSearch] = React.useState('');
  const [hi, setHi] = React.useState(-1);
  const [open, setOpen] = React.useState(false);
  const boxRef = React.useRef(null);

  const q = search.trim().toLowerCase();
  const matches = (q ? options.filter(o => String(o.label).toLowerCase().includes(q)
    || String(o.value).toLowerCase().includes(q)) : options).slice(0, 200);
  const current = options.find(o => String(o.value) === String(value));

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const choose = (opt) => { onChange(opt.value); setOpen(false); setSearch(''); setHi(-1); };

  return (
    <div className="relative" ref={boxRef}>
      <button type="button" onClick={() => { setOpen(o => !o); setSearch(''); setHi(-1); }}
        className="w-full h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 text-left text-sm bg-white flex items-center justify-between gap-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
        <span className={current ? 'text-gray-900' : 'text-gray-400'}>{current ? current.label : placeholder}</span>
        <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <input
            autoFocus type="text" value={search} placeholder={searchPlaceholder}
            onChange={(e) => { setSearch(e.target.value); setHi(-1); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setHi(i => Math.min(i + 1, matches.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(i => Math.max(i - 1, -1)); }
              else if (e.key === 'Enter') {
                e.preventDefault();
                const opt = hi >= 0 ? matches[hi] : matches[0];
                if (opt) choose(opt);
              } else if (e.key === 'Escape') setOpen(false);
            }}
            className="w-full h-9 px-3 border-b border-gray-200 text-sm outline-none"
          />
          <div className="max-h-56 overflow-y-auto">
            {matches.length === 0 && <p className="px-3 py-3 text-sm text-gray-400">No match</p>}
            {matches.map((opt, i) => (
              <button key={String(opt.value)} type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHi(i)}
                onClick={() => choose(opt)}
                className={`w-full px-3 sm:px-4 py-2 text-left text-sm transition-colors ${
                  String(opt.value) === String(value) ? 'font-semibold text-blue-700 bg-blue-50/60'
                    : i === hi ? 'bg-blue-50 text-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
