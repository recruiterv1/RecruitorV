import React, { useState } from 'react';
import { Info } from 'lucide-react';

/**
 * Small "i" icon shown after a candidate's status when the AI made a screening
 * decision based on the CV↔JD match. On hover it reveals the detailed reasoning
 * (which skills matched/were missing, experience vs. required, role fit, etc.).
 *
 * Props:
 *  - percent:   match percentage (number | null)
 *  - reasoning: detailed explanation (string)
 *  - summary:   short fallback explanation (string)
 *  - rejected:  whether the AI auto-rejected (controls colour/wording)
 */
const AiMatchInfo = ({ percent, reasoning, summary, rejected = false }) => {
  const [show, setShow] = useState(false);
  const text = (reasoning || summary || '').trim();
  if (!text) return null;

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info size={14} style={{ color: rejected ? '#dc2626' : '#6366f1', cursor: 'help' }} title="CV–JD match decision — hover for details" />
      {show && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '150%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 4000,
            width: 320,
            maxWidth: '80vw',
            background: '#111827',
            color: '#fff',
            padding: '11px 13px',
            borderRadius: 10,
            fontSize: 12,
            lineHeight: 1.55,
            fontWeight: 400,
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}
        >
          <strong style={{ display: 'block', marginBottom: 5, color: rejected ? '#fca5a5' : '#c7d2fe' }}>
            {rejected ? 'Auto-rejected — below match threshold' : 'Passed screening'}{(percent !== null && percent !== undefined) ? ` · Match ${percent}%` : ''}
          </strong>
          {text}
          <span
            style={{
              position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
              borderWidth: 6, borderStyle: 'solid', borderColor: '#111827 transparent transparent transparent',
            }}
          />
        </span>
      )}
    </span>
  );
};

export default AiMatchInfo;
