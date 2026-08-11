import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Autocomplete, TextField } from '@mui/material';

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

// ── Education dropdown with add-custom + de-duplication ────────────────────────
export const EDUCATION_OPTIONS = [
  'Any Graduate', '10th', '12th', 'Diploma',
  'B.Tech / B.E.', 'B.Sc', 'B.Com', 'BA', 'BBA', 'BCA', 'B.Pharm', 'LLB',
  'MBA / PGDM', 'M.Tech / M.E.', 'M.Sc', 'M.Com', 'MA', 'MCA', 'M.Pharm', 'LLM',
  'CA', 'CS', 'ICWA', 'PhD',
];

export function EducationSelect({ value, onChange, exclude = [], placeholder = 'Select education' }) {
  const excl = exclude.filter(Boolean).map(e => e.toLowerCase());
  // Build option list: predefined + current value (if custom), minus excluded.
  const base = [...EDUCATION_OPTIONS];
  if (value && !base.some(o => o.toLowerCase() === value.toLowerCase())) base.push(value);
  const options = base.filter(o => !excl.includes(o.toLowerCase()));

  return (
    <Autocomplete
      freeSolo
      selectOnFocus
      handleHomeEndKeys
      value={value || null}
      options={options}
      onChange={(_, v) => onChange((v || '').trim())}
      filterOptions={(opts, params) => {
        const input = params.inputValue.trim();
        const filtered = opts.filter(o => o.toLowerCase().includes(input.toLowerCase()));
        // Offer to add a new custom value if it isn't already an option (case-insensitive).
        if (input && !opts.some(o => o.toLowerCase() === input.toLowerCase()) && !excl.includes(input.toLowerCase())) {
          filtered.push(`Add "${input}"`);
        }
        return filtered;
      }}
      onInputChange={(_, v, reason) => { if (reason === 'clear') onChange(''); }}
      getOptionLabel={(o) => (typeof o === 'string' && o.startsWith('Add "') ? o.slice(5, -1) : (o || ''))}
      renderInput={(params) => <TextField {...params} placeholder={placeholder} size="small" />}
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
    />
  );
}
