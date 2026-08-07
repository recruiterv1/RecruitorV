import React, { useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Bold, Italic, Underline, List, ListOrdered, Heading, Eraser } from 'lucide-react';

const RT_STYLE = `
.rt-view{color:#374151;font-size:0.95rem;line-height:1.6}
.rt-view ul{list-style:disc;padding-left:1.4rem;margin:6px 0}
.rt-view ol{list-style:decimal;padding-left:1.4rem;margin:6px 0}
.rt-view li{margin:3px 0}
.rt-view h3,.rt-view h4{font-weight:700;color:#111827;margin:14px 0 6px}
.rt-view h3{font-size:1.02rem}
.rt-view h4{font-size:0.95rem}
.rt-view h3:first-child,.rt-view h4:first-child{margin-top:0}
.rt-view p{margin:0 0 8px}
.rt-view strong,.rt-view b{font-weight:700;color:#1f2937}
`;

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Turn plain text (with newlines) into nicely-structured HTML: detect section
// headings, bullet lists, and "Label: value" lines. Conservative so normal
// prose stays as paragraphs.
const plainToHtml = (text) => {
  const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim());
  const nonEmpty = lines.filter(Boolean).length;
  // Next non-empty line after index i
  const nextOf = (i) => { for (let j = i + 1; j < lines.length; j++) if (lines[j]) return lines[j]; return ''; };
  let html = '', inList = false;
  const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
  lines.forEach((line, i) => {
    if (!line) { closeList(); return; }
    // Bullet markers
    const bm = line.match(/^[-•*▪●·]\s+(.*)/) || line.match(/^o\s+(.*)/) || line.match(/^\d+[.)]\s+(.*)/);
    if (bm) { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${escapeHtml(bm[1])}</li>`; return; }
    closeList();
    // "Label: value" — short label before a colon
    const kv = line.match(/^([A-Za-z][A-Za-z0-9 /&()+.-]{1,26}):\s+(.+)$/);
    if (kv && !/[.!?]$/.test(kv[1])) { html += `<p><strong>${escapeHtml(kv[1])}:</strong> ${escapeHtml(kv[2])}</p>`; return; }
    // Heading: a line ending with ":" OR a short title-like line that is
    // immediately followed by real prose (avoids promoting flat list items).
    const endsColon = line.endsWith(':') && line.length <= 60;
    const next = nextOf(i);
    const nextIsProse = next && next.length > 50 && /[.!?]$/.test(next);
    const shortTitle = nonEmpty > 1 && line.length <= 40 && line.split(/\s+/).length <= 6 &&
      !/[.!?,;]$/.test(line) && /^[A-Z0-9]/.test(line) && nextIsProse;
    if (endsColon) html += `<h4>${escapeHtml(line.replace(/:$/, ''))}</h4>`;
    else if (shortTitle) html += `<h4>${escapeHtml(line)}</h4>`;
    else html += `<p>${escapeHtml(line)}</p>`;
  });
  closeList();
  return html;
};

// Renders rich-text values: sanitized HTML when tags are present, otherwise
// plain text is beautified into headings / bullet lists / paragraphs.
export const RichTextView = ({ value, className = '' }) => {
  const v = (value || '').toString();
  if (!v.trim()) return null;
  const hasTags = /<[a-z][\s\S]*>/i.test(v);
  const html = hasTags ? DOMPurify.sanitize(v) : DOMPurify.sanitize(plainToHtml(v));
  return (
    <>
      <style>{RT_STYLE}</style>
      <div className={`rt-view ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
};

/**
 * Lightweight dependency-free rich text editor (contentEditable + execCommand).
 * Works with React 19 and the Capacitor Android WebView. Emits HTML via onChange.
 */
const Btn = ({ title, cmd, value, onCmd, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onMouseDown={(e) => { e.preventDefault(); onCmd(cmd, value); }}
    className="w-8 h-8 grid place-items-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
  >
    {children}
  </button>
);

const RichTextEditor = ({ value = '', onChange, placeholder = 'Start typing…', minHeight = 120 }) => {
  const ref = useRef(null);

  // Sync external value in only when it differs from the live DOM (avoids caret jumps).
  useEffect(() => {
    const el = ref.current;
    if (el && value !== el.innerHTML) el.innerHTML = value || '';
  }, [value]);

  const emit = () => { if (ref.current && onChange) onChange(ref.current.innerHTML); };
  const exec = (cmd, val) => { document.execCommand(cmd, false, val); ref.current?.focus(); emit(); };

  return (
    <div className="border-2 border-gray-200 rounded-lg sm:rounded-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all overflow-hidden bg-white">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 flex-wrap">
        <Btn title="Bold" cmd="bold" onCmd={exec}><Bold size={15} /></Btn>
        <Btn title="Italic" cmd="italic" onCmd={exec}><Italic size={15} /></Btn>
        <Btn title="Underline" cmd="underline" onCmd={exec}><Underline size={15} /></Btn>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <Btn title="Heading" cmd="formatBlock" value="<h3>" onCmd={exec}><Heading size={15} /></Btn>
        <Btn title="Bullet list" cmd="insertUnorderedList" onCmd={exec}><List size={15} /></Btn>
        <Btn title="Numbered list" cmd="insertOrderedList" onCmd={exec}><ListOrdered size={15} /></Btn>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <Btn title="Clear formatting" cmd="removeFormat" onCmd={exec}><Eraser size={15} /></Btn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder}
        className="rte-area px-3 sm:px-4 py-2.5 text-sm text-gray-800 outline-none leading-relaxed"
        style={{ minHeight }}
      />
      <style>{`
        .rte-area:empty:before { content: attr(data-placeholder); color: #9ca3af; }
        .rte-area ul { list-style: disc; padding-left: 1.4rem; margin: 4px 0; }
        .rte-area ol { list-style: decimal; padding-left: 1.4rem; margin: 4px 0; }
        .rte-area h3 { font-size: 1rem; font-weight: 700; margin: 8px 0 4px; }
        .rte-area:focus { outline: none; }
      `}</style>
    </div>
  );
};

// True when an HTML string has no visible text/content.
export const isHtmlEmpty = (html) => {
  if (!html) return true;
  const txt = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return txt.length === 0;
};

export default RichTextEditor;
