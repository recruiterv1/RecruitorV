import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { Loader2, ExternalLink, Download } from 'lucide-react';
import { isNativeApp } from '../lib/apiBase';

const isDocx = (u) => /\.docx?(\?|$)/i.test(u || '');
const isPdf = (u) => /\.pdf(\?|$)/i.test(u || '');
const isDriveUrl = (u) => /drive\.google\.com|docs\.google\.com/i.test(u || '');

// Android's WebView has no built-in PDF/Office renderer, so a direct <iframe>
// to a .pdf/.docx URL shows up blank in the app. Google's hosted viewer renders
// any publicly reachable file (Firebase Storage download URLs qualify) as HTML.
const gview = (u) => `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(u)}`;

/**
 * In-app CV preview that works on both the website and the native app.
 *  - .docx → converted to HTML by the backend and rendered inline.
 *  - PDF   → direct iframe on the web; Google viewer inside the native app.
 *  - Google Drive links → shown via their /preview iframe.
 * A "Open / Download" link is always available as a fallback.
 */
const CvPreview = ({ url, height = '70vh' }) => {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!url || !isDocx(url)) return;
    let cancel = false;
    setLoading(true); setError(''); setHtml('');
    axios.get('/api/cv-match/preview', { params: { url }, withCredentials: true })
      .then(r => {
        if (cancel) return;
        if (r.data?.type === 'html') setHtml(DOMPurify.sanitize(r.data.html));
        else setError('Preview not available for this file.');
      })
      .catch(e => { if (!cancel) setError(e.response?.data?.message || 'Could not load CV.'); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [url]);

  if (!url) return null;

  const OpenBar = () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, padding: '8px 10px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
      <a href={url} target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563eb', fontWeight: 600, fontSize: 13 }}>
        <ExternalLink size={14} /> Open
      </a>
      <a href={url} target="_blank" rel="noopener noreferrer" download
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563eb', fontWeight: 600, fontSize: 13 }}>
        <Download size={14} /> Download
      </a>
    </div>
  );

  if (isDocx(url)) {
    return (
      <div style={{ height, overflow: 'auto', background: '#fff' }}>
        <style>{`
          .cv-doc img { max-width: 100%; height: auto; }
          .cv-doc table { border-collapse: collapse; width: 100%; margin: 8px 0; }
          .cv-doc td, .cv-doc th { border: 1px solid #e5e7eb; padding: 4px 8px; }
          .cv-doc p { margin: 0 0 8px; }
          .cv-doc h1, .cv-doc h2, .cv-doc h3 { margin: 14px 0 6px; }
          .cv-doc ul, .cv-doc ol { margin: 0 0 8px 22px; }
          .cv-doc a { color: #2563eb; }
        `}</style>
        <OpenBar />
        {loading && (
          <div style={{ padding: 50, textAlign: 'center', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Loader2 size={18} className="animate-spin" /> Loading CV…
          </div>
        )}
        {!loading && error && (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
            <p style={{ marginBottom: 12 }}>{error}</p>
            {/* Fallback: render the .docx through Google's viewer */}
            <iframe src={gview(url)} title="CV Preview" style={{ width: '100%', height: 360, border: '1px solid #e5e7eb', borderRadius: 8 }} />
          </div>
        )}
        {!loading && !error && (
          <div className="cv-doc"
            style={{ padding: '26px 30px', maxWidth: 840, margin: '0 auto', color: '#111827', fontSize: 14, lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    );
  }

  // PDF / images / Drive
  let src;
  if (isDriveUrl(url)) {
    src = url.replace(/\/view(\?.*)?$/, '/preview').replace(/\/edit(\?.*)?$/, '/preview');
  } else if (isNativeApp() && isPdf(url)) {
    // Direct PDF iframes render blank in the Android WebView — use Google's viewer.
    src = gview(url);
  } else {
    src = url;
  }

  return (
    <div style={{ height, display: 'flex', flexDirection: 'column', background: '#f3f4f6' }}>
      <OpenBar />
      <iframe src={src} title="CV Preview" style={{ width: '100%', flex: 1, border: 'none', display: 'block' }} allow="autoplay" />
    </div>
  );
};

export default CvPreview;
