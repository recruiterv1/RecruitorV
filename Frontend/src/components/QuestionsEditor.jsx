import React, { useState } from 'react';

// Reusable editor for client-requirement questions.
// Question shape: { type: 'subjective' | 'yesno' | 'multiselect', question: string, options: string[] }
// Used in Add Company, Edit Company and the Add Position "Client Requirements" step.

export const QUESTION_TYPES = [
  { value: 'subjective', label: 'Subjective' },
  { value: 'yesno', label: 'Yes / No' },
  { value: 'multiselect', label: 'Multiple Select' },
];

export const typeLabel = (t) => (QUESTION_TYPES.find(q => q.value === t)?.label || t || '—');

// Validate a list of questions; returns an error string or null.
export const validateQuestions = (questions) => {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.question.trim()) return `Question ${i + 1}: text is required`;
    if (!q.type) return `Question ${i + 1}: select a type`;
    if (q.type === 'multiselect' && (!Array.isArray(q.options) || q.options.filter(o => o.trim()).length < 2)) {
      return `Question ${i + 1}: multiple-select needs at least 2 options`;
    }
  }
  return null;
};

const OptionChips = ({ options, onChange }) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (options.some(o => o.toLowerCase() === v.toLowerCase())) { setDraft(''); return; }
    onChange([...options, v]);
    setDraft('');
  };
  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {options.map((o, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-1 text-xs font-medium">
            {o}
            <button type="button" onClick={() => onChange(options.filter((_, idx) => idx !== i))}
              className="text-indigo-400 hover:text-indigo-700 font-bold leading-none">×</button>
          </span>
        ))}
        {options.length === 0 && <span className="text-xs text-gray-400 italic">No options yet — add at least 2</span>}
      </div>
      <div className="flex gap-2">
        <input type="text" value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Type an option and press Enter"
          className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-400 outline-none bg-white" />
        <button type="button" onClick={add}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold">Add</button>
      </div>
    </div>
  );
};

export default function QuestionsEditor({ questions, onChange, compact = false }) {
  const upd = (i, key, val) => onChange(questions.map((q, idx) => idx === i ? { ...q, [key]: val } : q));
  const remove = (i) => onChange(questions.filter((_, idx) => idx !== i));
  const add = () => onChange([...questions, { type: 'subjective', question: '', options: [] }]);

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={i} className={`border-2 border-gray-200 rounded-xl ${compact ? 'p-3' : 'p-4'} bg-white`}>
          <div className="flex items-start gap-2">
            <span className="mt-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex-shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex gap-2 flex-wrap">
                <select value={q.type} onChange={e => upd(i, 'type', e.target.value)}
                  className="border-2 border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:border-indigo-400 outline-none bg-white">
                  {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {q.type === 'yesno' && <span className="text-xs text-gray-400 self-center">Answer will be Yes or No</span>}
                {q.type === 'subjective' && <span className="text-xs text-gray-400 self-center">Free-text answer</span>}
              </div>
              <input type="text" value={q.question} onChange={e => upd(i, 'question', e.target.value)}
                placeholder="Type the question…"
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 outline-none" />
              {q.type === 'multiselect' && (
                <OptionChips options={q.options || []} onChange={(opts) => upd(i, 'options', opts)} />
              )}
            </div>
            <button type="button" onClick={() => remove(i)} title="Remove question"
              className="mt-2 w-7 h-7 flex items-center justify-center rounded-lg border-2 border-red-200 text-red-500 hover:bg-red-50 font-bold flex-shrink-0">×</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all">
        + Add question
      </button>
    </div>
  );
}

// Read-only display used on the position pages ("Client Requirements" section).
export function QuestionsList({ questions, emptyText = 'No client requirements specified.' }) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return <p className="text-sm text-gray-400 italic">{emptyText}</p>;
  }
  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="mt-0.5 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0">{i + 1}</span>
          <div className="min-w-0">
            <p className="text-sm text-gray-800 font-medium">{q.question}</p>
            <span className="inline-block mt-1 text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{typeLabel(q.type)}</span>
            {q.type === 'multiselect' && Array.isArray(q.options) && q.options.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {q.options.map((o, oi) => (
                  <span key={oi} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-0.5">{o}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
