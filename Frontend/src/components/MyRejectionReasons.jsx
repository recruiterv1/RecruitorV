import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Lightbulb } from 'lucide-react';

// Why this recruiter's CVs get turned down, with the guidance the reasons list
// already carries. A rejection on its own only stings; the guidance is what
// makes the next submission better.
export default function MyRejectionReasons() {
  const [d, setD] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    axios.get('/api/coach-bin/my-rejection-reasons', { withCredentials: true })
      .then(r => { if (r.data?.success) setD(r.data); })
      .catch(() => {});
  }, []);

  if (!d || !d.reasons?.length) return null;

  return (
    <div className="mb-5 rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Lightbulb size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-900 text-[15px]">Why your CVs came back</p>
          <p className="text-[13px] text-gray-700 mt-0.5">
            {d.rejected} of your {d.submitted} reviewed submissions were turned down.
            Checking these before you submit is the quickest way to change that.
          </p>

          <div className="mt-3 space-y-2">
            {d.reasons.map(r => (
              <div key={r.label} className="rounded-xl bg-white border border-blue-200 overflow-hidden">
                <button onClick={() => setOpen(open === r.label ? null : r.label)}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left">
                  <span className="text-[13px] font-semibold text-gray-900">{r.label}</span>
                  <span className="text-[12px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded flex-shrink-0">
                    {r.count}×
                  </span>
                </button>
                {open === r.label && r.guidance && (
                  <p className="px-3.5 pb-3 text-[12.5px] text-gray-700 leading-relaxed">{r.guidance}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
