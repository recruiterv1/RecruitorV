import React from 'react';

// Public-facing renderer + answer collector for client-requirement questions on
// the candidate apply forms (/apply, /smart-apply). Question shape:
//   { type: 'subjective' | 'yesno' | 'multiselect', question, options: [] }
// Answers are held by the parent as an object keyed by question index:
//   subjective -> string, yesno -> 'Yes'|'No', multiselect -> string[]

export const buildClientAnswers = (questions = [], answers = {}) =>
  (questions || []).map((q, i) => ({
    question: q.question,
    type: q.type || 'subjective',
    answer: answers[i] ?? (q.type === 'multiselect' ? [] : ''),
  }));

// Returns an error message if any question is unanswered, else null.
export const validateClientAnswers = (questions = [], answers = {}) => {
  for (let i = 0; i < (questions || []).length; i++) {
    const q = questions[i];
    const a = answers[i];
    if (q.type === 'multiselect') {
      if (!Array.isArray(a) || a.length === 0) return `Please answer: "${q.question}"`;
    } else if (!a || !String(a).trim()) {
      return `Please answer: "${q.question}"`;
    }
  }
  return null;
};

export default function ClientQuestions({ questions, answers, setAnswers, accent = 'orange' }) {
  if (!Array.isArray(questions) || questions.length === 0) return null;

  const set = (i, val) => setAnswers(prev => ({ ...prev, [i]: val }));
  const toggle = (i, opt) => setAnswers(prev => {
    const cur = Array.isArray(prev[i]) ? prev[i] : [];
    return { ...prev, [i]: cur.includes(opt) ? cur.filter(o => o !== opt) : [...cur, opt] };
  });

  const ring = accent === 'orange' ? 'focus:ring-orange-400' : 'focus:ring-blue-400';
  const acc  = accent === 'orange' ? 'accent-orange-500' : 'accent-blue-600';

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={i}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {i + 1}. {q.question} <span className="text-red-500">*</span>
          </label>

          {q.type === 'yesno' && (
            <div className="flex gap-4">
              {['Yes', 'No'].map(opt => (
                <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" name={`cq_${i}`} className={acc}
                    checked={answers[i] === opt} onChange={() => set(i, opt)} />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {q.type === 'multiselect' && (
            <div className="flex flex-wrap gap-2">
              {(q.options || []).map((opt, oi) => {
                const checked = Array.isArray(answers[i]) && answers[i].includes(opt);
                return (
                  <label key={oi}
                    className={`inline-flex items-center gap-2 text-sm border rounded-lg px-3 py-1.5 cursor-pointer transition-all ${
                      checked ? 'border-orange-400 bg-orange-50 text-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}>
                    <input type="checkbox" className={acc} checked={checked} onChange={() => toggle(i, opt)} />
                    {opt}
                  </label>
                );
              })}
            </div>
          )}

          {(!q.type || q.type === 'subjective') && (
            <textarea rows={2} value={answers[i] || ''} onChange={e => set(i, e.target.value)}
              placeholder="Your answer"
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ring} resize-vertical`} />
          )}
        </div>
      ))}
    </div>
  );
}
