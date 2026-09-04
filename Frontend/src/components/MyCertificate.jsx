import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Download, Loader2 } from 'lucide-react';

// The certificate card on a user's own dashboard. Shows nothing at all unless
// they have a standing to show, so it can sit on any dashboard unconditionally.
export default function MyCertificate({ compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/eligibility/my-certification', { withCredentials: true })
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return compact ? null : (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
        <Loader2 size={13} className="animate-spin" /> Checking your certification…
      </div>
    );
  }
  if (!data?.tier || data.tier === 'not_qualified') return null;

  if (data.tier === 'conditional') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-800">Conditional standing</p>
        <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">
          You are on the probationary pipeline
          {data.positionCap ? `, capped at ${data.positionCap} active positions` : ''}. Clear the
          assessment at 80% or above on your next attempt to become Certified.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
      <div className="flex items-start gap-4 flex-wrap">
        <span className="h-11 w-11 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
          <Award size={22} />
        </span>
        <div className="flex-1 min-w-[200px]">
          <p className="font-bold text-amber-900">You are Certified</p>
          <p className="text-[13px] text-amber-800 mt-0.5 leading-relaxed">
            Certified {data.role || 'member'}{data.skillCategory ? ` · ${data.skillCategory}` : ''}
            {data.certificateId ? <> · ID <span className="font-mono">{data.certificateId}</span></> : null}
          </p>
        </div>
        {data.certificateUrl ? (
          <a href={data.certificateUrl} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold">
            <Download size={15} /> Download certificate
          </a>
        ) : (
          <span className="text-[12px] text-amber-700">Your certificate was emailed to you.</span>
        )}
      </div>
    </div>
  );
}
