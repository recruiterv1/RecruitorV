import React, { useEffect, useMemo, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import Sidebar from './Sidebar';
import ClientSpocSidebar from '../components/Dash_View_ClientSpocSidebar';
import Dash_Header from './Dash_Header';
import Footer from './Footer';
import { indiaStatesAndCities } from './Ad_Pos';
import { formatCommission } from '../lib/commission';

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIMENTAL layout for the position / JD-submission page. Isolated on its own
// route (/dash_view_v2/:pos_id) so the live dash_view is untouched. Design ported
// from recruiterv-jd-submission.html; JD view is fed by real position data.
// All CSS is scoped under `.jdv2-root` so it can't leak into the rest of the app.
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
.jdv2-root{--navy:#1e2d4e;--navy-light:#2c3f68;--orange:#f47b20;--orange-light:#fff1e5;--teal:#2ab5a5;--teal-light:#e7f7f5;--red:#d6455a;--red-light:#fdeced;--amber:#c98a1c;--amber-light:#fdf3e0;--bg:#f5f6f9;--card:#ffffff;--ink:#151b2c;--ink-soft:#4b5566;--ink-faint:#8892a3;--line:#e4e7ee;--radius:14px;--shadow:0 1px 2px rgba(20,25,45,0.04),0 8px 24px -12px rgba(20,25,45,0.10);background:var(--bg);color:var(--ink);font-family:'Inter',system-ui,sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased;}
.jdv2-root *{box-sizing:border-box;}
.jdv2-root h1,.jdv2-root h2,.jdv2-root h3,.jdv2-root h4{font-family:'Sora','Inter',sans-serif;}
.jdv2-root .mono{font-family:'JetBrains Mono',monospace;}
.jdv2-root .topbar{background:var(--navy);color:#fff;padding:14px 28px;display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:0 2px 12px rgba(0,0,0,0.15);}
.jdv2-root .brand{display:flex;align-items:center;gap:10px;font-family:'Sora',sans-serif;font-weight:700;font-size:16px;letter-spacing:0.2px;}
.jdv2-root .brand .dot{width:9px;height:9px;border-radius:50%;background:var(--orange);}
.jdv2-root .tabs{display:flex;gap:4px;background:rgba(255,255,255,0.08);padding:4px;border-radius:10px;}
.jdv2-root .tab-btn{border:none;background:transparent;color:rgba(255,255,255,0.7);font-family:'Sora',sans-serif;font-weight:600;font-size:13px;padding:8px 16px;border-radius:8px;cursor:pointer;transition:all .15s ease;}
.jdv2-root .tab-btn.active{background:var(--orange);color:#1a1300;}
.jdv2-root .tab-btn:not(.active):hover{color:#fff;}
.jdv2-root .wrap{max-width:1180px;margin:0 auto;padding:28px 24px 80px;}
.jdv2-root .view{display:none;}
.jdv2-root .view.active{display:block;}
.jdv2-root .jd-header{background:var(--navy);color:#fff;border-radius:var(--radius);padding:28px 32px;margin-bottom:20px;position:relative;overflow:hidden;}
.jdv2-root .jd-header::after{content:"";position:absolute;right:-60px;top:-60px;width:220px;height:220px;background:radial-gradient(circle,rgba(244,123,32,0.28),transparent 70%);}
.jdv2-root .badge{display:inline-flex;align-items:center;gap:6px;background:rgba(244,123,32,0.18);color:var(--orange);border:1px solid rgba(244,123,32,0.4);font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;border-radius:999px;margin-bottom:14px;}
.jdv2-root .jd-title{font-size:26px;font-weight:800;margin:0 0 6px;letter-spacing:-0.01em;}
.jdv2-root .jd-sub{color:rgba(255,255,255,0.65);font-size:14px;margin:0 0 22px;}
.jdv2-root .jd-meta{display:flex;flex-wrap:wrap;gap:28px;position:relative;z-index:1;}
.jdv2-root .jd-meta div{display:flex;flex-direction:column;gap:3px;}
.jdv2-root .jd-meta span.label{font-size:10.5px;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.5);font-weight:600;}
.jdv2-root .jd-meta span.val{font-size:15px;font-weight:700;font-family:'Sora',sans-serif;}
.jdv2-root .grid{display:grid;grid-template-columns:1.55fr 1fr;gap:20px;align-items:start;}
@media (max-width:880px){.jdv2-root .grid{grid-template-columns:1fr;}}
.jdv2-root .card{background:var(--card);border-radius:var(--radius);padding:24px 26px;box-shadow:var(--shadow);border:1px solid var(--line);margin-bottom:20px;}
.jdv2-root .card h2{font-size:15px;margin:0 0 4px;color:var(--navy);}
.jdv2-root .card .card-sub{font-size:12.5px;color:var(--ink-faint);margin:0 0 18px;}
.jdv2-root .filter-card{border-left:4px solid var(--orange);}
.jdv2-root .filter-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px dashed var(--line);gap:16px;}
.jdv2-root .filter-row:last-child{border-bottom:none;}
.jdv2-root .filter-name{display:flex;align-items:center;gap:10px;font-size:13.5px;font-weight:600;color:var(--ink);}
.jdv2-root .filter-icon{width:20px;height:20px;border-radius:6px;background:var(--orange-light);color:var(--orange);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;}
.jdv2-root .filter-val{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:var(--navy);text-align:right;}
.jdv2-root .skill-groups{display:flex;flex-direction:column;gap:16px;}
.jdv2-root .skill-group-label{font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;margin-bottom:9px;display:flex;align-items:center;gap:6px;}
.jdv2-root .chip-row{display:flex;flex-wrap:wrap;gap:8px;}
.jdv2-root .chip{padding:6px 12px;border-radius:8px;font-size:12.5px;font-weight:600;border:1px solid transparent;}
.jdv2-root .chip.must{background:var(--teal-light);color:#116a5f;border-color:rgba(42,181,165,0.35);}
.jdv2-root .chip.good{background:#f1f2f6;color:var(--ink-soft);border-color:var(--line);}
.jdv2-root .resp-list{margin:0;padding-left:18px;font-size:13.5px;line-height:1.85;color:var(--ink-soft);}
.jdv2-root .stat-strip{display:flex;gap:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;}
.jdv2-root .stat-strip div{flex:1;padding:14px 16px;text-align:center;border-right:1px solid var(--line);}
.jdv2-root .stat-strip div:last-child{border-right:none;}
.jdv2-root .stat-num{font-family:'Sora',sans-serif;font-weight:800;font-size:20px;color:var(--navy);}
.jdv2-root .stat-lbl{font-size:11px;color:var(--ink-faint);margin-top:2px;}
.jdv2-root .top-reason{background:var(--red-light);color:#a02f42;font-size:12px;font-weight:600;padding:10px 14px;border-radius:8px;margin-top:12px;}
.jdv2-root .side-block{font-size:13px;color:var(--ink-soft);line-height:1.7;}
.jdv2-root .side-row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px;}
.jdv2-root .side-row:last-child{border-bottom:none;}
.jdv2-root .side-row span:first-child{color:var(--ink-faint);}
.jdv2-root .side-row span:last-child{font-weight:600;color:var(--ink);text-align:right;}
.jdv2-root .cta-big{width:100%;background:var(--orange);color:#1a1300;border:none;border-radius:10px;padding:14px;font-family:'Sora',sans-serif;font-weight:700;font-size:14.5px;cursor:pointer;box-shadow:0 8px 18px -8px rgba(244,123,32,0.6);transition:transform .12s ease;}
.jdv2-root .cta-big:hover{transform:translateY(-1px);}
.jdv2-root .cta-hint{font-size:11.5px;color:var(--ink-faint);text-align:center;margin-top:8px;}
.jdv2-root .form-shell{display:grid;grid-template-columns:1fr 320px;gap:24px;align-items:start;}
@media (max-width:960px){.jdv2-root .form-shell{grid-template-columns:1fr;}}
.jdv2-root .stepper{display:flex;gap:6px;margin-bottom:22px;flex-wrap:wrap;}
.jdv2-root .step-pill{flex:1;min-width:120px;padding:10px 12px;border-radius:9px;background:var(--card);border:1px solid var(--line);font-size:11.5px;font-weight:700;color:var(--ink-faint);display:flex;align-items:center;gap:8px;cursor:pointer;transition:all .15s ease;}
.jdv2-root .step-pill .num{width:18px;height:18px;border-radius:50%;background:var(--line);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;}
.jdv2-root .step-pill.active{border-color:var(--navy);color:var(--navy);background:#fff;box-shadow:var(--shadow);}
.jdv2-root .step-pill.active .num{background:var(--navy);}
.jdv2-root .step-pill.done .num{background:var(--teal);}
.jdv2-root .step-pill.done{color:var(--teal);}
.jdv2-root .fieldset{display:none;}
.jdv2-root .fieldset.active{display:block;}
.jdv2-root .field-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
@media (max-width:600px){.jdv2-root .field-grid{grid-template-columns:1fr;}}
.jdv2-root .field{margin-bottom:16px;}
.jdv2-root .field.full{grid-column:1/-1;}
.jdv2-root label{display:block;font-size:12px;font-weight:700;color:var(--ink-soft);margin-bottom:6px;letter-spacing:0.01em;}
.jdv2-root label .req{color:var(--orange);}
.jdv2-root input[type=text],.jdv2-root input[type=email],.jdv2-root input[type=tel],.jdv2-root input[type=date],.jdv2-root input[type=number],.jdv2-root textarea,.jdv2-root select{width:100%;padding:10px 12px;border:1.5px solid var(--line);border-radius:8px;font-family:'Inter',sans-serif;font-size:13.5px;color:var(--ink);background:#fff;transition:border-color .12s ease;}
.jdv2-root input:focus,.jdv2-root select:focus,.jdv2-root textarea:focus{outline:none;border-color:var(--navy);}
.jdv2-root textarea{resize:vertical;line-height:1.6;}
.jdv2-root .duo{display:flex;gap:8px;}
.jdv2-root .duo select{flex:1;}
.jdv2-root .check-row{display:flex;align-items:flex-start;gap:9px;font-size:13px;color:var(--ink-soft);margin-bottom:14px;line-height:1.5;}
.jdv2-root .check-row input{margin-top:3px;}
.jdv2-root .option-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;}
.jdv2-root .option-card{border:1.5px solid var(--line);border-radius:9px;padding:10px 12px;font-size:12.5px;font-weight:600;color:var(--ink-soft);cursor:pointer;transition:all .12s ease;}
.jdv2-root .option-card:hover{border-color:var(--navy-light);}
.jdv2-root .option-card.selected{border-color:var(--navy);background:var(--navy);color:#fff;}
.jdv2-root .warn-banner{display:none;align-items:flex-start;gap:10px;padding:11px 13px;border-radius:9px;font-size:12.5px;font-weight:600;margin-top:-6px;margin-bottom:16px;line-height:1.5;}
.jdv2-root .warn-banner.show{display:flex;}
.jdv2-root .warn-banner.amber{background:var(--amber-light);color:#8a5c0e;border:1px solid rgba(201,138,28,0.3);}
.jdv2-root .warn-banner.red{background:var(--red-light);color:#a02f42;border:1px solid rgba(214,69,90,0.3);}
.jdv2-root .step-nav{display:flex;justify-content:space-between;margin-top:22px;}
.jdv2-root .btn{border:none;border-radius:9px;padding:11px 20px;font-family:'Sora',sans-serif;font-weight:700;font-size:13px;cursor:pointer;transition:transform .12s ease;}
.jdv2-root .btn:hover{transform:translateY(-1px);}
.jdv2-root .btn-ghost{background:#fff;border:1.5px solid var(--line);color:var(--ink-soft);}
.jdv2-root .btn-primary{background:var(--navy);color:#fff;}
.jdv2-root .btn-submit{background:var(--orange);color:#1a1300;box-shadow:0 8px 18px -8px rgba(244,123,32,0.6);}
.jdv2-root .btn-submit:disabled,.jdv2-root .btn-primary:disabled{opacity:0.45;cursor:not-allowed;transform:none;}
.jdv2-root .match-panel{position:sticky;top:78px;}
.jdv2-root .match-score-ring{width:132px;height:132px;margin:6px auto 4px;position:relative;}
.jdv2-root .match-score-ring svg{transform:rotate(-90deg);}
.jdv2-root .match-score-ring .center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.jdv2-root .match-score-ring .num{font-family:'Sora',sans-serif;font-weight:800;font-size:28px;color:var(--navy);}
.jdv2-root .match-score-ring .lbl{font-size:10px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.06em;}
.jdv2-root .match-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line);font-size:12px;}
.jdv2-root .match-row:last-child{border-bottom:none;}
.jdv2-root .match-row .m-name{color:var(--ink-soft);font-weight:600;display:flex;align-items:center;}
.jdv2-root .m-dot{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:8px;}
.jdv2-root .m-dot.ok{background:var(--teal);}
.jdv2-root .m-dot.warn{background:var(--amber);}
.jdv2-root .m-dot.bad{background:var(--red);}
.jdv2-root .m-dot.pending{background:var(--line);}
.jdv2-root .m-status{font-weight:700;font-size:11px;}
.jdv2-root .m-status.ok{color:#116a5f;}
.jdv2-root .m-status.warn{color:#8a5c0e;}
.jdv2-root .m-status.bad{color:#a02f42;}
.jdv2-root .m-status.pending{color:var(--ink-faint);}
.jdv2-root .exp-banner{max-width:1180px;margin:16px auto 0;padding:8px 24px;font-size:12px;color:#8a5c0e;background:var(--amber-light);border:1px solid rgba(201,138,28,0.3);border-radius:10px;text-align:center;font-weight:600;}
.jdv2-root .file-drop{display:flex;align-items:center;gap:10px;border:1.5px dashed var(--line);border-radius:8px;padding:9px 12px;cursor:pointer;transition:border-color .12s ease;background:#fff;}
.jdv2-root .file-drop:hover{border-color:var(--navy);}
.jdv2-root .file-btn{background:var(--navy);color:#fff;border-radius:7px;padding:7px 14px;font-family:'Sora',sans-serif;font-weight:700;font-size:12px;flex-shrink:0;}
.jdv2-root .file-name{font-size:12.5px;color:var(--ink-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.jdv2-root .file-name.ok{color:#116a5f;font-weight:600;}
.jdv2-root .parent-pill{display:inline-block;background:#f1f2f6;border:1.5px solid var(--line);border-radius:8px;padding:9px 12px;font-size:13px;font-weight:700;color:var(--ink);}
.jdv2-root .parent-pill span{font-weight:500;color:var(--ink-faint);font-size:11.5px;margin-left:6px;}
.jdv2-root .skill-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;}
.jdv2-root .skill-chip{border:1.5px solid var(--line);background:#fff;color:var(--ink-soft);border-radius:999px;padding:7px 14px;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .12s ease;font-family:'Inter',system-ui,sans-serif;}
.jdv2-root .skill-chip:hover{border-color:var(--navy);}
.jdv2-root .skill-chip.on{background:var(--navy);border-color:var(--navy);color:#fff;}
.jdv2-root .skill-chip.sub.on{background:var(--teal);border-color:var(--teal);color:#fff;}
.jdv2-root .skill-empty{font-size:12.5px;color:var(--ink-faint);font-style:italic;margin-top:6px;}
.jdv2-root .exp-card{border:1.5px solid var(--line);border-radius:10px;padding:12px;background:#fafbfc;}
.jdv2-root .exp-card .exp-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.jdv2-root .exp-card .exp-name{font-size:13px;font-weight:700;color:var(--navy);}
.jdv2-root .exp-card .exp-parent{font-size:11px;font-weight:500;color:var(--ink-faint);margin-left:6px;}
.jdv2-root .exp-card .exp-x{background:none;border:none;color:var(--red);font-weight:800;cursor:pointer;font-size:14px;line-height:1;}
.jdv2-root .ss-wrap{position:relative;}
.jdv2-root .ss-wrap input:disabled{background:#f7f8fa;color:var(--ink-faint);cursor:not-allowed;}
.jdv2-root .ss-list{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1.5px solid var(--line);border-radius:8px;max-height:220px;overflow-y:auto;z-index:40;box-shadow:0 12px 28px -10px rgba(20,25,45,0.25);}
.jdv2-root .ss-item{padding:9px 12px;font-size:13px;color:var(--ink);cursor:pointer;border-bottom:1px solid #f2f3f7;}
.jdv2-root .ss-item:last-child{border-bottom:none;}
.jdv2-root .ss-item:hover{background:var(--orange-light);}
.jdv2-root .ss-item.sel{background:var(--navy);color:#fff;}
.jdv2-root .ss-empty{padding:10px 12px;font-size:12.5px;color:var(--ink-faint);}
.jdv2-root .ms-wrap{position:relative;outline:none;}
.jdv2-root .ms-control{min-height:40px;width:100%;border:1.5px solid var(--line);border-radius:8px;padding:8px 34px 8px 10px;background:#fff;cursor:pointer;display:flex;align-items:center;position:relative;transition:border-color .12s ease;}
.jdv2-root .ms-wrap:focus-within .ms-control{border-color:var(--navy);}
.jdv2-root .ms-placeholder{font-size:13.5px;color:var(--ink-faint);}
.jdv2-root .ms-chips{display:flex;flex-wrap:wrap;gap:6px;}
.jdv2-root .ms-chip{display:inline-flex;align-items:center;gap:5px;background:var(--orange-light);color:var(--orange);border:1px solid rgba(244,123,32,0.35);border-radius:6px;padding:3px 6px 3px 9px;font-size:12px;font-weight:700;}
.jdv2-root .ms-chip button{border:none;background:transparent;color:inherit;cursor:pointer;font-size:14px;line-height:1;padding:0;display:flex;}
.jdv2-root .ms-caret{position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--ink-faint);}
.jdv2-root .ms-item{display:flex;align-items:center;gap:9px;}
.jdv2-root .ms-item input{margin:0;flex-shrink:0;}
.jdv2-root .ms-search{padding:8px;border-bottom:1px solid var(--line);position:sticky;top:0;background:#fff;}
.jdv2-root .ms-search input{width:100%;}
`;

// ── helpers ───────────────────────────────────────────────────────────────────
const arr = (v) => Array.isArray(v) ? v.filter(Boolean) : (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []);
const fmtCtc = (v) => { const n = parseFloat(String(v || '').replace(/[^\d.]/g, '')); if (!n) return '—'; return n >= 100000 ? `₹${Math.round(n / 100000)}L` : `₹${n}`; };
const fmtDate = (ts) => { const s = ts?._seconds || ts?.seconds; if (!s) return ''; return new Date(s * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };
// Split rich text / list content into discrete items (for chips / list rows).
const splitItems = (v) => {
  if (!v) return [];
  const text = String(v).replace(/<\/(li|p|div|br)>/gi, '\n').replace(/<[^>]+>/g, '');
  return text.split(/\n|,|;|•|•/).map(s => s.trim()).filter(s => s.length > 1).slice(0, 24);
};

// JD prose fields (Job Summary / Company Overview / Candidate Instructions) may be
// old rich-text HTML or new plain text — render as readable plain text either way.
const jdText = (v) => String(v || '')
  .replace(/<li[^>]*>/gi, '• ')
  .replace(/<\/(li|p|div|br)\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\n{3,}/g, '\n\n').trim();

// Searchable dropdown (combobox) styled to the v2 design. Type to filter,
// click to select. Module-level so the input keeps focus across re-renders.
const SearchSelect = ({ value, onChange, options, placeholder, disabled, allowAdd = false, onAdd }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = q ? options.filter(o => o.toLowerCase().includes(q)) : options;
  // Offer "Add" when typing something that doesn't exactly match any option.
  const exact = options.find(o => o.toLowerCase() === q);
  const canAdd = allowAdd && q.length > 1 && !exact;
  const pick = (val) => { onChange(val); setQuery(''); setOpen(false); };
  const addNew = () => {
    const name = query.trim();
    if (!name) return;
    const match = options.find(o => o.toLowerCase() === name.toLowerCase());
    if (match) { pick(match); return; }        // duplicate-safe: select the existing one
    if (onAdd) onAdd(name);
    pick(name);
  };
  return (
    <div className="ss-wrap">
      <input
        type="text"
        disabled={disabled}
        placeholder={placeholder}
        value={open ? query : (value || '')}
        onFocus={() => { setOpen(true); setQuery(''); }}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={e => { if (e.key === 'Enter' && canAdd) { e.preventDefault(); addNew(); } }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && !disabled && (
        <div className="ss-list">
          {shown.map(o => (
            <div key={o} className={`ss-item${o === value ? ' sel' : ''}`}
              onMouseDown={() => pick(o)}>
              {o}
            </div>
          ))}
          {canAdd && (
            <div className="ss-item" style={{ color: 'var(--orange)', fontWeight: 700 }}
              onMouseDown={addNew}>
              + Add “{query.trim()}” as a new city
            </div>
          )}
          {shown.length === 0 && !canAdd && <div className="ss-empty">No match found</div>}
        </div>
      )}
    </div>
  );
};

const EDUCATION_OPTIONS = [
  'Graduate', 'B.E', 'B.Tech', 'BCA', 'MCA', 'M.Tech', 'BBA', 'B.Com', 'BA',
  'M.Com', 'MBA', 'B.Sc', 'M.Sc', 'MA', 'Diploma', 'Post Graduate',
  // Marketing
  'BBA (Marketing)', 'MBA (Marketing)', 'PGDM (Marketing)',
  // Banking & Finance
  'B.Com (Banking & Insurance)', 'MBA (Finance)', 'MBA (Banking & Finance)',
  'CA', 'CS', 'CMA', 'CFA', 'JAIIB', 'CAIIB',
  // HR
  'MBA (HR)',
  'Other',
];

// Multi-select dropdown: click to open, checkbox per option, selected values
// shown as removable chips. Stores/returns a comma-joined string so it stays
// compatible with the existing single-string highest_education field.
const MultiSelect = ({ value, onChange, options, placeholder, allowAdd = false, onAdd }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
  const q = query.trim().toLowerCase();
  const shown = q ? options.filter(o => o.toLowerCase().includes(q)) : options;
  // Duplicate-safe: an exact case-insensitive match already exists, so no "Add" offered.
  const exact = options.find(o => o.toLowerCase() === q);
  const canAdd = allowAdd && q.length > 1 && !exact;
  const toggle = (opt) => {
    const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
    onChange(next.join(', '));
  };
  const remove = (opt) => onChange(selected.filter(s => s !== opt).join(', '));
  const addNew = () => {
    const name = query.trim();
    if (!name) return;
    // If it matches an existing option (any case), just select that one instead
    // of creating a near-duplicate entry.
    const match = options.find(o => o.toLowerCase() === name.toLowerCase());
    const final = match || name;
    if (!match && onAdd) onAdd(name);
    if (!selected.includes(final)) onChange([...selected, final].join(', '));
    setQuery('');
  };
  return (
    <div className="ms-wrap" ref={wrapRef} tabIndex={0}
      onBlur={(e) => {
        // Only close when focus truly leaves the component — moving focus to
        // the search box or a checkbox inside it (e.g. via autoFocus) also
        // fires this blur, but shouldn't collapse the dropdown.
        if (wrapRef.current && !wrapRef.current.contains(e.relatedTarget)) {
          setTimeout(() => setOpen(false), 150);
        }
      }}>
      <div className="ms-control" onClick={() => setOpen(o => !o)}>
        {selected.length === 0
          ? <span className="ms-placeholder">{placeholder}</span>
          : (
            <div className="ms-chips">
              {selected.map(s => (
                <span key={s} className="ms-chip">
                  {s}
                  <button type="button" onMouseDown={e => { e.preventDefault(); remove(s); }}>×</button>
                </span>
              ))}
            </div>
          )}
        <span className="ms-caret">▾</span>
      </div>
      {open && (
        <div className="ss-list">
          {allowAdd && (
            <div className="ms-search">
              <input
                type="text"
                autoFocus
                placeholder="Search or add new…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && canAdd) { e.preventDefault(); addNew(); } }}
              />
            </div>
          )}
          {shown.map(o => (
            <div key={o} className={`ss-item ms-item${selected.includes(o) ? ' sel' : ''}`}
              onMouseDown={() => toggle(o)}>
              <input type="checkbox" readOnly checked={selected.includes(o)} />
              <span>{o}</span>
            </div>
          ))}
          {canAdd && (
            <div className="ss-item" style={{ color: 'var(--orange)', fontWeight: 700 }}
              onMouseDown={addNew}>
              + Add “{query.trim()}”
            </div>
          )}
          {shown.length === 0 && !canAdd && <div className="ss-empty">No match found</div>}
        </div>
      )}
    </div>
  );
};

const YEARS = Array.from({ length: 31 }, (_, i) => i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i);
const STEP_NAMES = ['Identity', 'Experience', 'Compensation', 'Location', 'Notice', 'Stability', 'Client Req'];

function DashViewV2Inner() {
  const { pos_id } = useParams();
  const [view, setView] = useState('jd');
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);

  // form/match state
  const [relYrs, setRelYrs] = useState('');
  const [currentCTC, setCurrentCTC] = useState('');
  const [expectedCTC, setExpectedCTC] = useState('');
  const [offer, setOffer] = useState('');
  const [relocation, setRelocation] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [notice, setNotice] = useState('');
  const [skillEvidence, setSkillEvidence] = useState('');
  const [selfRating, setSelfRating] = useState('');
  const [noticeProof, setNoticeProof] = useState('');
  const [dupChecked, setDupChecked] = useState(false);
  const [showDup, setShowDup] = useState(false);
  const [toast, setToast] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoRequired, setPhotoRequired] = useState(false);
  const [access, setAccess] = useState(null);       // null = checking; { hasAccess, status }
  const [requesting, setRequesting] = useState(false);
  const [signal, setSignal] = useState(null);       // { submitted, rejected, inProcess, topReasons }
  // ── Skill selection (same rules as the live dash_view form) ────────────────
  // Parent category comes from the position; recruiter picks up to 2 of the
  // position's children and up to 2 sub-children under each, with experience.
  const MAX_CHILDREN = 2;
  const MAX_SUBS_PER_CHILD = 2;
  const [skillHierarchy, setSkillHierarchy] = useState([]);
  const [selChildren, setSelChildren] = useState([]);
  const [selSubs, setSelSubs] = useState({});          // { [child]: string[] }
  const [subExp, setSubExp] = useState({});            // { 'child||sub': 'experience' }

  // ── Matching coaches/experts (same skill category, active in last 48h) ────────
  const { user: teamUser } = useContext(UserStateContext);
  const [teamCoaches, setTeamCoaches] = useState([]);
  const [teamReqStatus, setTeamReqStatus] = useState({}); // email(lc) -> status
  const [teamSending, setTeamSending] = useState({});
  const [teamIdx, setTeamIdx] = useState(0);              // carousel window start (2 at a time)

  useEffect(() => {
    if (!teamUser?.email) return;
    const recCats = (Array.isArray(teamUser.skillCategory) ? teamUser.skillCategory : (teamUser.skillCategory ? [teamUser.skillCategory] : []))
      .map(c => String(c).toLowerCase().trim());
    const FORTY_EIGHT = 48 * 60 * 60 * 1000, now = Date.now();
    axios.get('/api/coach-expert/team/available-coaches?scope=all', { withCredentials: true })
      .then(r => {
        const all = r.data?.coaches || [];
        const list = all.filter(c => {
          const ms = c.lastActiveDate ? new Date(c.lastActiveDate).getTime() : 0;
          if (!ms || now - ms > FORTY_EIGHT) return false;            // active in last 48h
          const cCats = (Array.isArray(c.skillCategory) ? c.skillCategory : (c.skillCategory ? [c.skillCategory] : []))
            .map(x => String(x).toLowerCase().trim());
          if (recCats.length && !cCats.some(x => recCats.includes(x))) return false; // same skill category
          return true;
        });
        setTeamCoaches(list);
        const req = {};
        all.forEach(c => { if (c.alreadyRequested) req[(c.email || '').toLowerCase()] = 'pending'; });
        setTeamReqStatus(prev => ({ ...prev, ...req }));
      })
      .catch(() => {});
    axios.get('/api/coach-expert/team/recruiter-my-requests', { withCredentials: true })
      .then(r => {
        const m = {};
        (r.data?.requests || []).forEach(q => { if (q.coachEmail) m[q.coachEmail.toLowerCase()] = q.status; });
        setTeamReqStatus(prev => ({ ...prev, ...m }));
      })
      .catch(() => {});
  }, [teamUser?.email, teamUser?.skillCategory]);

  const sendTeamRequest = async (coach) => {
    const key = (coach.email || '').toLowerCase();
    if (teamSending[key]) return;
    setTeamSending(s => ({ ...s, [key]: true }));
    try {
      await axios.post('/api/coach-expert/team/recruiter-join-request',
        { coachEmail: coach.email, coachRole: coach.role }, { withCredentials: true });
      setTeamReqStatus(prev => ({ ...prev, [key]: 'pending' }));
      setToast('Join request sent!');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to send request');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setTeamSending(s => ({ ...s, [key]: false }));
    }
  };

  useEffect(() => {
    axios.get('/candidate/skill-categories-hierarchical')
      .then(r => { if (r.data?.success) setSkillHierarchy(r.data.categories || []); })
      .catch(() => {});
  }, []);

  const toList = (v) => Array.isArray(v)
    ? v.map(x => String(x).trim()).filter(Boolean)
    : String(v || '').split(',').map(x => x.trim()).filter(Boolean);

  const skillParent = job?.skill_category || '';
  const posChildren = toList(job?.skill_sub_category);
  const parentObj = skillHierarchy.find(c => c.parent === skillParent);
  const childOptions = (parentObj?.children || []).filter(ch =>
    posChildren.some(pc => pc.toLowerCase() === String(ch.name || '').toLowerCase())
  );

  const toggleChild = (name) => {
    setSelChildren(prev => {
      if (prev.includes(name)) {
        setSelSubs(s => { const n = { ...s }; delete n[name]; return n; });
        setSubExp(e => {
          const n = { ...e };
          Object.keys(n).forEach(k => { if (k.startsWith(name + '||')) delete n[k]; });
          return n;
        });
        return prev.filter(c => c !== name);
      }
      if (prev.length >= MAX_CHILDREN) { setToast(`⚠ You can select up to ${MAX_CHILDREN} sub-categories only`); setTimeout(() => setToast(''), 3000); return prev; }
      return [...prev, name];
    });
  };

  const toggleSub = (child, sub) => {
    setSelSubs(prev => {
      const cur = prev[child] || [];
      if (cur.includes(sub)) {
        setSubExp(e => { const n = { ...e }; delete n[`${child}||${sub}`]; return n; });
        return { ...prev, [child]: cur.filter(s => s !== sub) };
      }
      if (cur.length >= MAX_SUBS_PER_CHILD) { setToast(`⚠ You can select up to ${MAX_SUBS_PER_CHILD} skills under "${child}"`); setTimeout(() => setToast(''), 3000); return prev; }
      return { ...prev, [child]: [...cur, sub] };
    });
  };

  const selectedSubList = selChildren.flatMap(ch => (selSubs[ch] || []).map(sub => ({ child: ch, sub })));

  // Client-requirement questions from the company profile (+ position's own).
  // Answered by the recruiter in the "Client Req" step of the submit form.
  const [companyQuestions, setCompanyQuestions] = useState([]);
  const [clientAnswers, setClientAnswers] = useState({});   // { [qIndex]: string | string[] }
  useEffect(() => {
    const client = job?.client;
    if (!client) { setCompanyQuestions([]); return; }
    let live = true;
    axios.get(`/addit/overview/${encodeURIComponent(client)}`)
      .then(r => { if (live && r.data?.found) setCompanyQuestions(Array.isArray(r.data.data.questions) ? r.data.data.questions : []); })
      .catch(() => {});
    return () => { live = false; };
  }, [job?.client]);

  // Company questions first, then any set on the position itself.
  const clientRequirements = [
    ...companyQuestions,
    ...(Array.isArray(job?.client_questions) ? job.client_questions : []),
  ];
  const setAnswer = (i, val) => setClientAnswers(a => ({ ...a, [i]: val }));
  const toggleAnswerOption = (i, opt) => setClientAnswers(a => {
    const cur = Array.isArray(a[i]) ? a[i] : [];
    return { ...a, [i]: cur.includes(opt) ? cur.filter(o => o !== opt) : [...cur, opt] };
  });
  // Remaining form fields (identity / experience / location / notice / stability)
  const [form, setForm] = useState({
    candidate: '', mob: '', emails: '', dob: '', pan_number: '', curr_emp: '', highest_education: '',
    totalYrs: '', totalMos: '0', relMos: '0', curr_state: '', joinDate: '',
    avgTenure: '', empGaps: '', employerTier: '', industryMatch: '', internshipExcluded: false,
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [submitting, setSubmitting] = useState(false);
  // Cities added by the user (per state) when not found in the built-in list.
  const [customCities, setCustomCities] = useState({});
  // Education qualifications added by the user when not found in the built-in list.
  const [customEducation, setCustomEducation] = useState([]);

  useEffect(() => {
    let live = true;
    if (!pos_id) { setLoading(false); return; }
    axios.get(`/candidate/position/${pos_id}`)
      .then(r => { if (live) setJob(r.data); })
      .catch(() => {})
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [pos_id]);

  // Submission stats + top rejection reasons for the Submission Signal card.
  useEffect(() => {
    if (!pos_id) return;
    let live = true;
    axios.get(`/candidate/position/${pos_id}/signal`)
      .then(r => { if (live && r.data?.success) setSignal(r.data); })
      .catch(() => {});
    return () => { live = false; };
  }, [pos_id]);

  // Is this position assigned to the logged-in recruiter? Same access flow as
  // the live dash_view (/api/position-access). Drives Assign Me vs Submit.
  useEffect(() => {
    if (!pos_id) return;
    let live = true;
    axios.get(`/api/position-access/check/${pos_id}`, { withCredentials: true })
      .then(r => { if (live) setAccess(r.data?.data || { hasAccess: false }); })
      .catch(() => { if (live) setAccess({ hasAccess: false }); });
    return () => { live = false; };
  }, [pos_id]);

  const hasAccess = access?.hasAccess === true;
  const isPendingAccess = !hasAccess && access?.status === 'pending';

  const requestAssign = async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      await axios.post('/api/position-access/request', { positionId: pos_id }, { withCredentials: true });
      const r = await axios.get(`/api/position-access/check/${pos_id}`, { withCredentials: true });
      const a = r.data?.data || { hasAccess: false, status: 'pending' };
      setAccess(a);
      setToast(a.hasAccess ? '✓ Position assigned to you — you can now submit candidates' : 'Request sent — pending approval');
    } catch (e) {
      const msg = e.response?.data?.message || 'Could not send the assign request';
      if (msg.includes('already have a')) { setAccess(a => ({ ...(a || {}), status: 'pending' })); setToast('Request already sent — pending approval'); }
      else setToast('⚠ ' + msg);
    } finally {
      setRequesting(false);
      setTimeout(() => setToast(''), 3500);
    }
  };

  // Label + click behaviour for the Submit tab / CTA, based on assignment state.
  const submitLabel = access === null ? 'Submit Candidate'
    : hasAccess ? 'Submit Candidate'
    : requesting ? 'Requesting…'
    : isPendingAccess ? 'Request Pending' : 'Assign Me';
  const handleSubmitEntry = () => {
    if (access === null) return;                 // still checking
    if (hasAccess) { setView('form'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (!isPendingAccess) requestAssign();       // pending → nothing to do
  };

  // If access resolves as not-assigned while the form is open, snap back to the JD.
  useEffect(() => {
    if (view === 'form' && access !== null && !hasAccess) setView('jd');
  }, [view, access, hasAccess]);

  // Does this position's company require a candidate photo? (same rule as the
  // live "Use your own" form — driven by Company_Overview.photoRequired)
  useEffect(() => {
    const client = job?.client;
    if (!client) { setPhotoRequired(false); return; }
    let live = true;
    axios.get(`/clientspoc/company-settings?name=${encodeURIComponent(client)}`)
      .then(r => { if (live) setPhotoRequired(r.data?.photoRequired === true); })
      .catch(() => { if (live) setPhotoRequired(false); });
    return () => { live = false; };
  }, [job?.client]);

  // ── derived JD fields ──
  const jd = useMemo(() => {
    const j = job || {};
    const loc = arr(j.location).join(' / ');
    const exp = j.experience || [j.min_exp, j.max_exp].filter(v => v !== undefined && v !== '' && v !== null).join('–') + (j.min_exp || j.max_exp ? ' Yrs' : '');
    return {
      title: j.position || 'Position',
      sub: [j.client, j.clientspoc_name ? `Client SPOC: ${j.clientspoc_name}` : '', j.datePosted ? `Posted ${fmtDate(j.datePosted)}` : ''].filter(Boolean).join(' · '),
      location: loc || '—',
      ctc: (j.ctcStart || j.ctcEnd) ? `${fmtCtc(j.ctcStart)} – ${fmtCtc(j.ctcEnd)}` : '—',
      commission: j.commison ? formatCommission(j.commison, j.commission_type) : '—',
      openings: j.no_of_positions || 1,
      experience: exp || '—',
      minExp: j.min_exp, maxExp: j.max_exp,
      reqEducation: j.req_education || 'Graduate mandatory',
      mustSkills: splitItems(j.m_have),
      goodSkills: splitItems(j.g_have),
      responsibilities: splitItems(j.key_res),
      competencies: splitItems(j.compet),
      jobSummary: j.job_desc || '',
      companyOverview: j.comp_view || '',
      candidateInstructions: j.candidate_instructions || '',
      employment: [j.employment_type, j.work_mode].filter(Boolean).join(', ') || '—',
      budget: [j.budget_type, j.variable_freq].filter(Boolean).join(', ') || '—',
      joiningBonus: j.joining_bonus || 'No',
      teamHandling: j.team_handling || 'No',
      interviewMode: j.interview_mode || '—',
    };
  }, [job]);

  // ── live match logic ──
  const expState = useMemo(() => {
    const rel = relYrs === '' ? -1 : parseInt(relYrs, 10);
    const min = parseInt(jd.minExp, 10) || 7;
    const max = (parseInt(jd.maxExp, 10) || 10) * 1.2;
    if (rel < 0) return ['pending', 'Pending'];
    if (rel < min) return ['bad', 'Below Min'];
    if (rel > max) return ['warn', 'Above Range'];
    return ['ok', 'Within Range'];
  }, [relYrs, jd.minExp, jd.maxExp]);

  const hikePct = useMemo(() => {
    const c = parseFloat(currentCTC), e = parseFloat(expectedCTC);
    if (!c || !e) return null;
    return ((e - c) / c) * 100;
  }, [currentCTC, expectedCTC]);
  const hikeState = useMemo(() => {
    if (hikePct === null) return ['pending', 'Pending'];
    if (hikePct > 35 && offer !== 'yes') return ['warn', 'High Hike'];
    if (hikePct > 35 && offer === 'yes') return ['ok', 'OK (Offer in Hand)'];
    return ['ok', 'Within Range'];
  }, [hikePct, offer]);

  const locState = useMemo(() => {
    const city = (currentCity || '').toLowerCase().trim();
    // Match against the position's actual JD cities (aliases for the metro twins).
    const alias = { gurgaon: 'gurugram', gurugram: 'gurgaon', bangalore: 'bengaluru', bengaluru: 'bangalore' };
    const jdCities = arr(job?.location).map(c => c.toLowerCase().trim());
    const inJd = !!city && jdCities.some(c => c.includes(city) || city.includes(c) ||
      (alias[city] && (c.includes(alias[city]) || alias[city].includes(c))));
    if (!relocation) return ['pending', 'Pending'];
    if (jdCities.length === 0) return ['warn', 'Verify'];   // JD has no location set
    if (relocation === 'no_relocate' && !inJd) return ['bad', 'Not Accepted'];
    if (relocation === 'relocate') return ['bad', 'Blocked'];
    if (inJd) return ['ok', 'Matches JD'];
    return ['warn', 'Verify'];
  }, [relocation, currentCity, job?.location]);

  const noticeState = useMemo(() => {
    if (notice === '') return ['pending', 'Pending'];
    if (notice === 'serving') return ['warn', 'Verify Proof'];
    const d = parseInt(notice, 10);
    if (d > 25) return ['bad', 'Exceeds Cap'];
    return ['ok', 'Within Cap'];
  }, [notice]);

  const ringPct = useMemo(() => {
    const map = { ok: 1, warn: 0.5, bad: 0 };
    const vals = [expState[0], hikeState[0], locState[0], noticeState[0]].filter(s => s !== 'pending').map(s => map[s]);
    if (!vals.length) return 0;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100);
  }, [expState, hikeState, locState, noticeState]);
  const ringColor = ringPct >= 75 ? '#2ab5a5' : ringPct >= 40 ? '#c98a1c' : '#d6455a';
  const ringOffset = 352 - (352 * ringPct / 100);

  // ── Per-step mandatory-field validation ─────────────────────────────────────
  // Returns null when the step is complete, else the message to show.
  const validateStep = (i) => {
    if (i === 0) {
      if (!form.candidate.trim()) return 'Candidate Name is required';
      if (!/^\d{10}$/.test(form.mob.trim())) return 'Contact Number must be a 10-digit mobile';
      if (!/^\S+@\S+\.\S+$/.test(form.emails.trim())) return 'A valid Email is required';
      if (!form.dob) return 'Date of Birth is required';
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(form.pan_number.trim())) return 'A valid PAN Number is required (e.g. ABCDE1234F)';
      if (!form.highest_education.trim()) return 'Highest Education is required';
      if (!cvFile) return 'Please upload the candidate CV';
      if (photoRequired && !photoFile) return 'This client requires a candidate photo';
      return null;
    }
    if (i === 1) {
      if (form.totalYrs === '') return 'Total Experience is required';
      if (relYrs === '') return 'Relevant Experience is required';
      if (!skillEvidence) return 'Please select Skill Evidence';
      // Skill selection — only enforced when the position actually has categories set
      if (childOptions.length > 0) {
        if (selChildren.length === 0) return 'Please select at least one sub-category';
        for (const ch of selChildren) {
          const subs = (childOptions.find(c => c.name === ch)?.subChildren) || [];
          if (subs.length > 0 && (selSubs[ch] || []).length === 0) return `Please select at least one skill under "${ch}"`;
        }
        for (const { child, sub } of selectedSubList) {
          if (!String(subExp[`${child}||${sub}`] || '').trim()) return `Please enter experience for "${sub}"`;
        }
      }
      return null;
    }
    if (i === 2) {
      if (!currentCTC) return 'Current CTC is required';
      if (!expectedCTC) return 'Expected CTC is required';
      if (!offer) return 'Please select Offer In Hand';
      return null;
    }
    if (i === 3) {
      if (!currentCity.trim()) return 'Current City is required';
      if (!form.curr_state.trim()) return 'Current State is required';
      if (!relocation) return 'Please select Relocation Willingness';
      return null;
    }
    if (i === 4) {
      if (notice === '') return 'Notice Period is required';
      if (!noticeProof) return 'Please select Notice Proof Status';
      return null;
    }
    if (i === 5) {
      if (!form.avgTenure) return 'Average Tenure is required';
      if (!form.empGaps) return 'Employment Gaps is required';
      if (!form.employerTier) return 'Employer Verification Tier is required';
      if (!form.industryMatch) return 'Industry Match is required';
      if (!selfRating) return 'Self Rating is required';
      return null;
    }
    if (i === 6) {
      // Every client requirement must be answered before submitting.
      for (let k = 0; k < clientRequirements.length; k++) {
        const q = clientRequirements[k];
        const a = clientAnswers[k];
        if (q.type === 'multiselect') {
          if (!Array.isArray(a) || a.length === 0) return `Please answer: "${q.question}"`;
        } else if (!String(a || '').trim()) {
          return `Please answer: "${q.question}"`;
        }
      }
      return null;
    }
    return null;
  };

  const flagInvalid = (msg) => { setToast('⚠ ' + msg); setTimeout(() => setToast(''), 3500); };

  // Next only advances when the current step's mandatory fields are filled;
  // jumping ahead via the step pills validates every step in between too.
  const goToStep = (i) => {
    if (i > step) {
      for (let k = step; k < i; k++) {
        const err = validateStep(k);
        if (err) { setStep(k); flagInvalid(err); return; }
      }
    }
    setStep(i);
  };

  const trySubmit = async () => {
    // Validate every step; jump to the first incomplete one.
    for (let k = 0; k < STEP_NAMES.length; k++) {
      const err = validateStep(k);
      if (err) { setStep(k); flagInvalid(err); return; }
    }
    if (!dupChecked) { setShowDup(true); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      // 1) Duplicate check (email / phone / PAN) — same as the live form.
      try {
        const chk = await axios.post('/addit/data/check', {
          emails: form.emails.trim().toLowerCase(),
          mob: form.mob.trim(),
          pan_number: form.pan_number.trim().toUpperCase(),
        }, { withCredentials: true });
        if (chk.data?.exists) {
          const which = [];
          if (chk.data.emailExists) which.push('email');
          if (chk.data.phoneExists) which.push('phone');
          if (chk.data.panExists) which.push('PAN');
          flagInvalid(`Candidate already exists in the system (matched ${which.join(', ') || 'details'})`);
          setSubmitting(false);
          return;
        }
      } catch (_) { /* check failure → let the submit endpoint enforce */ }

      // 2) Upload CV + photo via the backend (works for JWT-authenticated recruiters).
      const toB64 = (file) => new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result.split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const uploadFile = async (file, prefix) => {
        const res = await axios.post('/api/direct-apply/upload-cv', {
          filename: `${prefix}${file.name}`,
          contentType: file.type || 'application/octet-stream',
          base64: await toB64(file),
        });
        if (!res.data?.success || !res.data.url) throw new Error(res.data?.message || 'Upload failed');
        return res.data.url;
      };
      const cv_url = await uploadFile(cvFile, '');
      let photo_url = '';
      if (photoFile) photo_url = await uploadFile(photoFile, 'photo_');

      // 3) Build the payload with the SAME field names as the live form so every
      //    value lands in its existing candidate_db field.
      const noticeLabel = notice === '0' ? 'Immediate' : notice === 'serving' ? 'Serving Notice' : `${notice} Days`;
      const payload = {
        pos_id: job?.pos_id || pos_id,
        pos_name: job?.position || '',
        hr_name: job?.hr_name || '',
        clientspoc: job?.clientspoc || '',
        client: job?.client || '',
        candidate: form.candidate.trim(),
        mob: form.mob.trim(),
        emails: form.emails.trim().toLowerCase(),
        dob: form.dob,
        pan_number: form.pan_number.trim().toUpperCase(),
        curr_emp: form.curr_emp.trim(),
        highest_education: form.highest_education.trim(),
        total_exp: `${form.totalYrs}Y ${form.totalMos || 0}M`,
        rel_exp: `${relYrs}Y ${form.relMos || 0}M`,
        current_ctc: `${currentCTC} LPA`,
        exp_ctc: `${expectedCTC} LPA`,
        notice_period: noticeLabel,
        last_day: form.joinDate || '',
        curr_state: form.curr_state.trim(),
        curr_loc: currentCity.trim(),
        pref_state: '',
        pref_loc: '',
        offer_hand: offer === 'yes' ? 'Yes' : 'No',
        offer_amt: '',
        self_rate: selfRating,
        // Skill selection — mapped onto the same fields the live dash_view form uses
        skill_type: 'tech',
        tech_category: skillParent || '',
        tech_subcategory: selChildren.join(', '),
        tech_skill: JSON.stringify(selectedSubList.map(x => x.sub)),
        tech_exp: JSON.stringify(selectedSubList.map(x => subExp[`${x.child}||${x.sub}`] || '')),
        nontech_category: '', nontech_subcategory: '', nontech_skill: '[]', nontech_exp: '[]',
        // Recruiter's answers to the client-requirement questions
        client_answers: clientRequirements.map((q, i) => ({
          question: q.question,
          type: q.type || 'subjective',
          answer: clientAnswers[i] ?? (q.type === 'multiselect' ? [] : ''),
        })),
        cv_url,
        photo_url,
        jr_number: '',
        rh_id: '',
        // v2 screening extras — stored on the candidate in their own fields
        skill_evidence: skillEvidence,
        relocation_willingness: relocation,
        notice_proof: noticeProof,
        avg_tenure: form.avgTenure,
        employment_gaps: form.empGaps,
        employer_tier: form.employerTier,
        industry_match: form.industryMatch,
        computed_hike_pct: hikePct === null ? '' : hikePct.toFixed(1),
        match_fit_pct: ringPct,
      };

      await axios.post('/addit/data/candi', payload, { withCredentials: true });

      setToast('✓ Candidate submitted successfully!');
      setTimeout(() => setToast(''), 4000);
      // Reset the form for the next candidate.
      setForm({ candidate: '', mob: '', emails: '', dob: '', pan_number: '', curr_emp: '', highest_education: '',
        totalYrs: '', totalMos: '0', relMos: '0', curr_state: '', joinDate: '',
        avgTenure: '', empGaps: '', employerTier: '', industryMatch: '', internshipExcluded: false });
      setRelYrs(''); setCurrentCTC(''); setExpectedCTC(''); setOffer(''); setRelocation('');
      setCurrentCity(''); setNotice(''); setSkillEvidence(''); setSelfRating(''); setNoticeProof('');
      setDupChecked(false); setCvFile(null); setPhotoFile(null); setStep(0);
      setSelChildren([]); setSelSubs({}); setSubExp({}); setClientAnswers({});
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Submission failed. Please try again.';
      flagInvalid(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const OptionGrid = ({ value, onChange, options, cols }) => (
    <div className="option-grid" style={cols ? { gridTemplateColumns: `repeat(${cols},1fr)` } : undefined}>
      {options.map(o => (
        <div key={o.val} className={`option-card${value === o.val ? ' selected' : ''}`}
          style={o.center ? { textAlign: 'center' } : undefined}
          onClick={() => onChange(o.val)}>{o.label}</div>
      ))}
    </div>
  );

  const Dot = ({ s }) => <span className={`m-dot ${s[0]}`} />;
  const Status = ({ s }) => <span className={`m-status ${s[0]}`}>{s[1]}</span>;

  return (
    <div className="jdv2-root">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');${CSS}`}</style>

      <div className="topbar">
        <div className="brand" style={{ minWidth: 0, flex: 1 }}>
          <span className="dot" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {loading ? 'Loading…' : (jd.title || 'Position')}
          </span>
        </div>
        <div className="tabs">
          <button className={`tab-btn${view === 'jd' ? ' active' : ''}`} onClick={() => { setView('jd'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>JD Detail</button>
          <button className={`tab-btn${view === 'form' ? ' active' : ''}`}
            style={isPendingAccess ? { opacity: 0.6, cursor: 'default' } : undefined}
            onClick={handleSubmitEntry}>{submitLabel}</button>
        </div>
      </div>

      <div className="exp-banner">Experimental layout preview — this is a test page. The live position page is unchanged.</div>

      <div className="wrap">
        {/* ===================== JD VIEW ===================== */}
        <div className={`view${view === 'jd' ? ' active' : ''}`}>
          <div className="jd-header">
            <span className="badge">● {loading ? 'Loading…' : 'Requirement'}</span>
            <h1 className="jd-title">{jd.title}</h1>
            <p className="jd-sub">{jd.sub || (loading ? 'Loading position…' : '')}</p>
            <div className="jd-meta">
              <div><span className="label">Location</span><span className="val">{jd.location}</span></div>
              <div><span className="label">CTC Range</span><span className="val">{jd.ctc}</span></div>
              <div><span className="label">Commission</span><span className="val">{jd.commission}</span></div>
              <div><span className="label">Openings</span><span className="val">{jd.openings}</span></div>
              <div><span className="label">Experience</span><span className="val">{jd.experience}</span></div>
            </div>
          </div>

          <div className="grid">
            <div>
              <div className="card filter-card">
                <h2>Must Match — auto-checked at submission</h2>
                <p className="card-sub">These are hard filters. The submission form validates against them live.</p>
                <div className="filter-row"><div className="filter-name"><span className="filter-icon">Y</span>Min. relevant experience</div><div className="filter-val">{jd.minExp ? `${jd.minExp} yrs` : '—'}</div></div>
                <div className="filter-row"><div className="filter-name"><span className="filter-icon">Y</span>Max. experience accepted</div><div className="filter-val">{jd.maxExp ? `~${Math.round(jd.maxExp * 1.2)} yrs (${jd.maxExp} + 20%)` : '—'}</div></div>
                <div className="filter-row"><div className="filter-name"><span className="filter-icon">N</span>Notice period accepted</div><div className="filter-val">Immediate – 25 days</div></div>
                <div className="filter-row"><div className="filter-name"><span className="filter-icon">L</span>Location accepted</div><div className="filter-val">{jd.location}</div></div>
                <div className="filter-row"><div className="filter-name"><span className="filter-icon">₹</span>Max acceptable hike</div><div className="filter-val">35% (unless offer in hand)</div></div>
                <div className="filter-row"><div className="filter-name"><span className="filter-icon">E</span>Education</div><div className="filter-val">{jd.reqEducation}</div></div>
              </div>

              <div className="card">
                <h2>Skills</h2>
                <p className="card-sub">Must-have skills need evidence in the CV — projects and responsibilities, not just keywords.</p>
                <div className="skill-groups">
                  <div>
                    <div className="skill-group-label" style={{ color: '#116a5f' }}>● Must-Have — needs evidence</div>
                    <div className="chip-row">
                      {jd.mustSkills.length ? jd.mustSkills.map((s, i) => <span key={i} className="chip must">{s}</span>) : <span className="chip good">Not specified</span>}
                    </div>
                  </div>
                  <div>
                    <div className="skill-group-label" style={{ color: 'var(--ink-faint)' }}>● Good-to-Have</div>
                    <div className="chip-row">
                      {jd.goodSkills.length ? jd.goodSkills.map((s, i) => <span key={i} className="chip good">{s}</span>) : <span className="chip good">—</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2>Key Responsibilities</h2>
                <ul className="resp-list">
                  {jd.responsibilities.length ? jd.responsibilities.map((r, i) => <li key={i}>{r}</li>) : <li>Not specified</li>}
                </ul>
              </div>

              {/* Competencies — shown only when provided */}
              {jd.competencies.length > 0 && (
                <div className="card">
                  <h2>Competencies</h2>
                  <ul className="resp-list">
                    {jd.competencies.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}

              {/* Job Summary — shown only when provided */}
              {jdText(jd.jobSummary) && (
                <div className="card">
                  <h2>Job Summary</h2>
                  <p className="card-sub" style={{ whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>{jdText(jd.jobSummary)}</p>
                </div>
              )}

              {/* Company Overview — shown only when provided */}
              {jdText(jd.companyOverview) && (
                <div className="card">
                  <h2>Company Overview</h2>
                  <p className="card-sub" style={{ whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>{jdText(jd.companyOverview)}</p>
                </div>
              )}

              {/* Candidate Instructions — shown only when provided */}
              {jdText(jd.candidateInstructions) && (
                <div className="card">
                  <h2>Candidate Instructions</h2>
                  <p className="card-sub" style={{ whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>{jdText(jd.candidateInstructions)}</p>
                </div>
              )}
            </div>

            <div>
              <div className="card">
                <h2>Submission Signal</h2>
                <p className="card-sub">Based on prior activity on this JD</p>
                <div className="stat-strip">
                  <div><div className="stat-num">{signal ? signal.submitted : '—'}</div><div className="stat-lbl">Submitted</div></div>
                  <div><div className="stat-num">{signal ? signal.rejected : '—'}</div><div className="stat-lbl">Rejected</div></div>
                  <div><div className="stat-num">{signal ? signal.inProcess : '—'}</div><div className="stat-lbl">In Process</div></div>
                </div>
                {signal?.topReasons?.length > 0 && (
                  <div>
                    {signal.topReasons.map((r, i) => (
                      <div key={i} className="top-reason" style={i === 0 ? undefined : { background: '#f7f8fa', color: 'var(--ink-soft)' }}>
                        {i === 0 ? 'Top rejection reason: ' : ''}{r.label}
                      </div>
                    ))}
                  </div>
                )}
                {signal && signal.rejected > 0 && (!signal.topReasons || signal.topReasons.length === 0) && (
                  <div className="top-reason" style={{ background: '#f7f8fa', color: 'var(--ink-soft)' }}>
                    No rejection reasons recorded yet for this position.
                  </div>
                )}
              </div>

              <div className="card">
                <h2>Coach / Expert</h2>
                <p className="card-sub">Coaches & Experts in your skill category, active in the last 48 hours. Send a request to join their team.</p>
                {teamCoaches.length === 0 ? (
                  <div className="side-block">No matching coach/expert is active right now. Check back later, or find one from the Join Team page.</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
                    {teamCoaches.length > 2 && (
                      <button onClick={() => setTeamIdx(i => Math.max(0, i - 2))} disabled={teamIdx === 0}
                        aria-label="Previous"
                        style={{ flex: '0 0 auto', width: 28, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: teamIdx === 0 ? 'default' : 'pointer', opacity: teamIdx === 0 ? 0.4 : 1, fontWeight: 700, color: '#334155' }}>‹</button>
                    )}
                    <div style={{ flex: 1, display: 'flex', gap: 12, minWidth: 0 }}>
                    {teamCoaches.slice(teamIdx, teamIdx + 2).map((c) => {
                      const key = (c.email || '').toLowerCase();
                      const status = teamReqStatus[key];
                      const busy = !!teamSending[key];
                      return (
                        <div key={c.id || key} style={{ flex: 1, minWidth: 0, border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, background: '#fff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: c.role === 'Expert' ? '#ede9fe' : '#ffedd5', color: c.role === 'Expert' ? '#6d28d9' : '#c2410c', display: 'grid', placeItems: 'center', fontWeight: 700, flexShrink: 0 }}>
                              {(c.name || '?')[0].toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name || '—'}</div>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: c.role === 'Expert' ? '#ede9fe' : '#ffedd5', color: c.role === 'Expert' ? '#6d28d9' : '#c2410c' }}>{c.role}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.7 }}>
                            <div>💼 {c.yearsOfExperience ? `${c.yearsOfExperience} yrs exp` : 'Experience —'}</div>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>✉️ {c.email || '—'}</div>
                            <div>📞 {c.phone || '—'}</div>
                          </div>
                          <div style={{ marginTop: 10 }}>
                            {status === 'approved' ? (
                              <button disabled style={{ width: '100%', padding: '7px 0', borderRadius: 8, border: 'none', background: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: 12 }}>✓ In your team</button>
                            ) : status === 'pending' ? (
                              <button disabled style={{ width: '100%', padding: '7px 0', borderRadius: 8, border: 'none', background: '#fef9c3', color: '#854d0e', fontWeight: 700, fontSize: 12 }}>⏳ Requested</button>
                            ) : (
                              <button onClick={() => sendTeamRequest(c)} disabled={busy}
                                style={{ width: '100%', padding: '7px 0', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
                                {busy ? 'Sending…' : 'Join Team'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                    {teamCoaches.length > 2 && (
                      <button onClick={() => setTeamIdx(i => Math.min(Math.max(0, teamCoaches.length - 2), i + 2))} disabled={teamIdx + 2 >= teamCoaches.length}
                        aria-label="Next"
                        style={{ flex: '0 0 auto', width: 28, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: teamIdx + 2 >= teamCoaches.length ? 'default' : 'pointer', opacity: teamIdx + 2 >= teamCoaches.length ? 0.4 : 1, fontWeight: 700, color: '#334155' }}>›</button>
                    )}
                  </div>
                )}
                {teamCoaches.length > 2 && (
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                    Showing {teamIdx + 1}–{Math.min(teamIdx + 2, teamCoaches.length)} of {teamCoaches.length}
                  </div>
                )}
              </div>

              <div className="card">
                <h2>Position Details</h2>
                <div className="side-row"><span>Employment type</span><span>{jd.employment}</span></div>
                <div className="side-row"><span>Budget type</span><span>{jd.budget}</span></div>
                <div className="side-row"><span>Joining bonus</span><span>{jd.joiningBonus}</span></div>
                <div className="side-row"><span>Team handling</span><span>{jd.teamHandling}</span></div>
                <div className="side-row"><span>Interview mode</span><span>{jd.interviewMode}</span></div>
              </div>

              <button className="cta-big" onClick={handleSubmitEntry}
                style={isPendingAccess ? { opacity: 0.6, cursor: 'default' } : undefined}>
                {submitLabel}{hasAccess ? ' →' : ''}
              </button>
              <div className="cta-hint">
                {hasAccess ? 'Form validates live against the filters above'
                  : isPendingAccess ? 'Your assign request is awaiting approval'
                  : 'Get this position assigned to you to submit candidates'}
              </div>
            </div>
          </div>
        </div>

        {/* ===================== FORM VIEW ===================== */}
        <div className={`view${view === 'form' ? ' active' : ''}`}>
          <div className="stepper">
            {STEP_NAMES.map((name, i) => (
              <div key={i} className={`step-pill${step === i ? ' active' : ''}${i < step ? ' done' : ''}`} onClick={() => goToStep(i)}>
                <span className="num">{i + 1}</span>{name}
              </div>
            ))}
          </div>

          <div className="form-shell">
            <div>
              {/* Step 1 - Identity */}
              <div className={`fieldset${step === 0 ? ' active' : ''}`}>
                <div className="card">
                  <h2>Candidate Identity</h2><p className="card-sub">Section 1 of 7</p>
                  <div className="field-grid">
                    <div className="field"><label>Candidate Name <span className="req">*</span></label><input type="text" placeholder="Full name as per ID" value={form.candidate} onChange={e => upd('candidate', e.target.value)} /></div>
                    <div className="field"><label>Contact Number <span className="req">*</span></label><input type="tel" placeholder="10-digit mobile" maxLength={10} value={form.mob} onChange={e => upd('mob', e.target.value.replace(/[^\d]/g, ''))} /></div>
                    <div className="field"><label>Email <span className="req">*</span></label><input type="email" placeholder="name@email.com" value={form.emails} onChange={e => upd('emails', e.target.value)} /></div>
                    <div className="field"><label>Date of Birth <span className="req">*</span></label><input type="date" value={form.dob} onChange={e => upd('dob', e.target.value)} /></div>
                    <div className="field"><label>PAN Number <span className="req">*</span></label><input type="text" placeholder="ABCDE1234F" maxLength={10} style={{ textTransform: 'uppercase' }} value={form.pan_number} onChange={e => upd('pan_number', e.target.value)} /></div>
                    <div className="field"><label>Current Employer</label><input type="text" placeholder="Company name" value={form.curr_emp} onChange={e => upd('curr_emp', e.target.value)} /></div>
                    <div className="field"><label>Highest Education <span className="req">*</span></label>
                      <MultiSelect value={form.highest_education} onChange={v => upd('highest_education', v)}
                        options={[...EDUCATION_OPTIONS, ...customEducation]}
                        placeholder="Select highest education"
                        allowAdd
                        onAdd={(name) => setCustomEducation(ce => ce.some(c => c.toLowerCase() === name.toLowerCase()) ? ce : [...ce, name])} />
                    </div>
                    <div className="field"><label>Upload CV <span className="req">*</span></label>
                      <label className="file-drop">
                        <span className="file-btn">Choose File</span>
                        <span className={`file-name${cvFile ? ' ok' : ''}`}>{cvFile ? cvFile.name : 'PDF / DOC / DOCX'}</span>
                        <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                          onChange={e => setCvFile(e.target.files[0] || null)} />
                      </label>
                    </div>
                    {photoRequired && (
                      <div className="field"><label>Candidate Photo <span className="req">*</span> <span style={{ fontWeight: 500, color: 'var(--ink-faint)' }}>(required by this client)</span></label>
                        <label className="file-drop" style={{ borderColor: photoFile ? 'rgba(42,181,165,0.6)' : 'rgba(244,123,32,0.55)', background: photoFile ? 'var(--teal-light)' : 'var(--orange-light)' }}>
                          <span className="file-btn" style={{ background: 'var(--orange)', color: '#1a1300' }}>Upload Photo</span>
                          <span className={`file-name${photoFile ? ' ok' : ''}`}>{photoFile ? photoFile.name : 'JPG / PNG — passport style'}</span>
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => setPhotoFile(e.target.files[0] || null)} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2 - Experience */}
              <div className={`fieldset${step === 1 ? ' active' : ''}`}>
                <div className="card">
                  <h2>Experience</h2><p className="card-sub">Section 2 of 7 · JD requires {jd.minExp || 7} yrs relevant experience minimum</p>
                  <div className="field-grid">
                    <div className="field"><label>Total Experience <span className="req">*</span></label>
                      <div className="duo"><select value={form.totalYrs} onChange={e => upd('totalYrs', e.target.value)}><option value="">Yrs</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select><select value={form.totalMos} onChange={e => upd('totalMos', e.target.value)}><option value="">Mos</option>{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                    </div>
                    <div className="field"><label>Relevant Experience <span className="req">*</span></label>
                      <div className="duo"><select value={relYrs} onChange={e => setRelYrs(e.target.value)}><option value="">Yrs</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select><select value={form.relMos} onChange={e => upd('relMos', e.target.value)}><option value="">Mos</option>{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                    </div>
                  </div>
                  <div className="check-row"><input type="checkbox" checked={form.internshipExcluded} onChange={e => upd('internshipExcluded', e.target.checked)} /><span>Confirm: internship period excluded from experience above</span></div>
                  <div className={`warn-banner amber${expState[0] === 'bad' ? ' show' : ''}`}>⚠ Below client's minimum of {jd.minExp || 7} yrs relevant experience — high rejection risk. You can continue, but flag this to your coach.</div>
                  <div className={`warn-banner amber${expState[0] === 'warn' ? ' show' : ''}`}>⚠ Exceeds client's accepted range — client may still consider, but note it in your pitch.</div>
                  <div className="field full"><label>Skill Evidence <span className="req">*</span></label>
                    <OptionGrid value={skillEvidence} onChange={setSkillEvidence} options={[
                      { val: 'clear', label: 'Clearly Demonstrated' }, { val: 'partial', label: 'Partially Demonstrated' },
                      { val: 'keyword', label: 'Mentioned Only as Keywords' }, { val: 'none', label: 'Not Mentioned' },
                    ]} />
                  </div>

                  {/* ── Skill Category → sub-category → skills (from this position) ── */}
                  <div className="field full" style={{ marginTop: 18 }}>
                    <label>Skill Category <span className="req">*</span></label>
                    <div className="parent-pill">
                      {skillParent || '—'}<span>(from this position)</span>
                    </div>
                  </div>

                  <div className="field full" style={{ marginTop: 14 }}>
                    <label>Sub-Category <span className="req">*</span> <span style={{ fontWeight: 500, color: 'var(--ink-faint)' }}>(select up to {MAX_CHILDREN})</span></label>
                    {childOptions.length === 0 ? (
                      <p className="skill-empty">No sub-categories are configured for this position.</p>
                    ) : (
                      <div className="skill-row">
                        {childOptions.map(ch => (
                          <button key={ch.name} type="button"
                            className={`skill-chip${selChildren.includes(ch.name) ? ' on' : ''}`}
                            onClick={() => toggleChild(ch.name)}>
                            {ch.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selChildren.map(childName => {
                    const subs = (childOptions.find(c => c.name === childName)?.subChildren) || [];
                    const chosen = selSubs[childName] || [];
                    return (
                      <div className="field full" key={childName} style={{ marginTop: 14 }}>
                        <label>{childName} — Skills <span className="req">*</span> <span style={{ fontWeight: 500, color: 'var(--ink-faint)' }}>(select up to {MAX_SUBS_PER_CHILD})</span></label>
                        {subs.length === 0 ? (
                          <p className="skill-empty">No skills are configured under {childName}.</p>
                        ) : (
                          <div className="skill-row">
                            {subs.map(sub => (
                              <button key={sub} type="button"
                                className={`skill-chip sub${chosen.includes(sub) ? ' on' : ''}`}
                                onClick={() => toggleSub(childName, sub)}>
                                {sub}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {selectedSubList.length > 0 && (
                    <div className="field full" style={{ marginTop: 14 }}>
                      <label>Experience <span className="req">*</span></label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
                        {selectedSubList.map(({ child, sub }) => (
                          <div className="exp-card" key={`${child}||${sub}`}>
                            <div className="exp-head">
                              <span className="exp-name">{sub}<span className="exp-parent">({child})</span></span>
                              <button type="button" className="exp-x" onClick={() => toggleSub(child, sub)}>✕</button>
                            </div>
                            <input type="text" placeholder={`Experience in ${sub}`}
                              value={subExp[`${child}||${sub}`] || ''}
                              onChange={e => setSubExp(s => ({ ...s, [`${child}||${sub}`]: e.target.value }))} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3 - Compensation */}
              <div className={`fieldset${step === 2 ? ' active' : ''}`}>
                <div className="card">
                  <h2>Compensation</h2><p className="card-sub">Section 3 of 7 · Client typically approves up to 35% hike without a competing offer</p>
                  <div className="field-grid">
                    <div className="field"><label>Current CTC <span className="req">*</span></label>
                      <select value={currentCTC} onChange={e => setCurrentCTC(e.target.value)}><option value="">Select</option>{Array.from({ length: 99 }, (_, i) => i + 1).map(v => <option key={v} value={v}>₹{v} LPA</option>)}</select>
                    </div>
                    <div className="field"><label>Expected CTC <span className="req">*</span></label>
                      <select value={expectedCTC} onChange={e => setExpectedCTC(e.target.value)}><option value="">Select</option>{Array.from({ length: 99 }, (_, i) => i + 1).map(v => <option key={v} value={v}>₹{v} LPA</option>)}</select>
                    </div>
                  </div>
                  <div className="field full"><label>Computed Hike %</label>
                    <input type="text" readOnly value={hikePct === null ? '—' : hikePct.toFixed(1) + '%'} style={{ background: '#f7f8fa', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: 'var(--navy)' }} />
                  </div>
                  <div className={`warn-banner amber${(hikePct !== null && hikePct > 35 && offer !== 'yes') ? ' show' : ''}`}>⚠ Exceeds the client's typical 35% approval threshold — confirm the candidate holds a competing offer.</div>
                  <div className="field full"><label>Offer In Hand <span className="req">*</span></label>
                    <OptionGrid value={offer} onChange={setOffer} cols={2} options={[{ val: 'yes', label: 'Yes' }, { val: 'no', label: 'No' }]} />
                  </div>
                </div>
              </div>

              {/* Step 4 - Location */}
              <div className={`fieldset${step === 3 ? ' active' : ''}`}>
                <div className="card">
                  <h2>Location</h2><p className="card-sub">Section 4 of 7 · JD accepts the listed cities only, no relocation consideration</p>
                  <div className="field-grid">
                    <div className="field"><label>Current State <span className="req">*</span></label>
                      <SearchSelect value={form.curr_state} options={Object.keys(indiaStatesAndCities)}
                        placeholder="Search state…"
                        onChange={v => { upd('curr_state', v); setCurrentCity(''); }} />
                    </div>
                    <div className="field"><label>Current City <span className="req">*</span></label>
                      <SearchSelect value={currentCity}
                        options={[...(customCities[form.curr_state] || []), ...(indiaStatesAndCities[form.curr_state] || [])]}
                        placeholder={form.curr_state ? 'Search or add a city…' : 'Select state first'}
                        disabled={!form.curr_state}
                        allowAdd
                        onAdd={(name) => setCustomCities(cc => ({
                          ...cc,
                          [form.curr_state]: [...(cc[form.curr_state] || []), name],
                        }))}
                        onChange={setCurrentCity} />
                    </div>
                  </div>
                  <div className="field full"><label>Relocation Willingness <span className="req">*</span></label>
                    <OptionGrid value={relocation} onChange={setRelocation} options={[
                      { val: 'same_city', label: 'Same City as Job Location' }, { val: 'same_state', label: 'Same State' },
                      { val: 'relocate', label: 'Different State, Ready to Relocate' }, { val: 'no_relocate', label: 'Different State, Not Willing' },
                    ]} />
                  </div>
                  <div className={`warn-banner red${relocation === 'relocate' ? ' show' : ''}`}>⛔ Client is not considering candidates open to relocation for this role — submission will likely be blocked.</div>
                </div>
              </div>

              {/* Step 5 - Notice */}
              <div className={`fieldset${step === 4 ? ' active' : ''}`}>
                <div className="card">
                  <h2>Notice Period &amp; Verification</h2><p className="card-sub">Section 5 of 7 · JD accepts Immediate to 25 days only</p>
                  <div className="field-grid">
                    <div className="field"><label>Notice Period <span className="req">*</span></label>
                      <select value={notice} onChange={e => setNotice(e.target.value)}>
                        <option value="">Select</option><option value="0">Immediate</option><option value="7">7 Days</option><option value="15">15 Days</option>
                        <option value="30">30 Days</option><option value="45">45 Days</option><option value="60">60 Days</option><option value="90">90 Days</option><option value="serving">Serving Notice</option>
                      </select>
                    </div>
                    <div className="field"><label>Earliest Joining Date</label><input type="date" value={form.joinDate} onChange={e => upd('joinDate', e.target.value)} /></div>
                  </div>
                  <div className={`warn-banner amber${noticeState[0] === 'bad' ? ' show' : ''}`}>⚠ Exceeds the client's 25-day cap for this role — client needs faster joiners.</div>
                  <div className="field full"><label>Notice Proof Status <span className="req">*</span></label>
                    <OptionGrid value={noticeProof} onChange={setNoticeProof} options={[
                      { val: 'resigned', label: 'Resigned, Proof Available' }, { val: 'serving_proof', label: 'Serving Notice, Proof Available' },
                      { val: 'serving_noproof', label: 'Serving Notice, Proof Not Available' }, { val: 'not_serving', label: 'Not Serving Notice' },
                    ]} />
                  </div>
                </div>
              </div>

              {/* Step 6 - Stability */}
              <div className={`fieldset${step === 5 ? ' active' : ''}`}>
                <div className="card">
                  <h2>Stability &amp; Background</h2><p className="card-sub">Section 6 of 7</p>
                  <div className="field-grid">
                    <div className="field"><label>Average Tenure <span className="req">*</span></label><select value={form.avgTenure} onChange={e => upd('avgTenure', e.target.value)}><option value="">Select</option><option>3+ Yrs</option><option>2–3 Yrs</option><option>1–2 Yrs</option><option>Below 1 Yr</option></select></div>
                    <div className="field"><label>Employment Gaps <span className="req">*</span></label><select value={form.empGaps} onChange={e => upd('empGaps', e.target.value)}><option value="">Select</option><option>No Gap</option><option>1 Gap</option><option>2 Gaps</option><option>3 Gaps</option><option>More than 3</option></select></div>
                    <div className="field"><label>Employer Verification Tier <span className="req">*</span></label><select value={form.employerTier} onChange={e => upd('employerTier', e.target.value)}><option value="">Select</option><option>Well-Known Brand</option><option>Established Organization</option><option>Small Registered Company</option><option>Startup / Limited Info</option><option>Not Verified</option></select></div>
                    <div className="field"><label>Industry Match <span className="req">*</span></label><select value={form.industryMatch} onChange={e => upd('industryMatch', e.target.value)}><option value="">Select</option><option>Same Industry</option><option>Similar Industry</option><option>Transferable Industry</option><option>Completely Different</option></select></div>
                  </div>
                  <div className="field full"><label>Self Rating <span className="req">*</span></label>
                    <OptionGrid value={selfRating} onChange={setSelfRating} cols={5} options={[1, 2, 3, 4, 5].map(n => ({ val: String(n), label: String(n), center: true }))} />
                  </div>
                  <div className="check-row"><input type="checkbox" checked={dupChecked} onChange={e => setDupChecked(e.target.checked)} /><span>I have checked this candidate is not already submitted for this position (duplicate check)</span></div>
                </div>
              </div>

              {/* Step 7 - Client Requirements */}
              <div className={`fieldset${step === 6 ? ' active' : ''}`}>
                <div className="card">
                  <h2>Client Requirements</h2>
                  <p className="card-sub">Section 7 of 7 · Answer the client's questions for this position</p>
                  {clientRequirements.length === 0 ? (
                    <p className="skill-empty">No client requirements for this position — you can submit directly.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {clientRequirements.map((q, i) => (
                        <div className="field full" key={i}>
                          <label>{i + 1}. {q.question} <span className="req">*</span></label>

                          {q.type === 'yesno' && (
                            <OptionGrid value={clientAnswers[i] || ''} onChange={v => setAnswer(i, v)} cols={2}
                              options={[{ val: 'Yes', label: 'Yes', center: true }, { val: 'No', label: 'No', center: true }]} />
                          )}

                          {q.type === 'multiselect' && (
                            <div className="skill-row">
                              {(q.options || []).map(opt => {
                                const on = Array.isArray(clientAnswers[i]) && clientAnswers[i].includes(opt);
                                return (
                                  <button key={opt} type="button"
                                    className={`skill-chip sub${on ? ' on' : ''}`}
                                    onClick={() => toggleAnswerOption(i, opt)}>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {(!q.type || q.type === 'subjective') && (
                            <textarea rows={2} value={clientAnswers[i] || ''} placeholder="Your answer"
                              onChange={e => setAnswer(i, e.target.value)} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="step-nav">
                <button className="btn btn-ghost" style={{ visibility: step === 0 ? 'hidden' : 'visible' }} onClick={() => setStep(s => Math.max(0, s - 1))}>← Back</button>
                {step < STEP_NAMES.length - 1
                  ? <button className="btn btn-primary" onClick={() => goToStep(step + 1)}>Next →</button>
                  : <button className="btn btn-submit" disabled={submitting} onClick={trySubmit}>{submitting ? 'Submitting…' : 'Submit Candidate'}</button>}
              </div>
            </div>

            {/* Match panel */}
            <div className="match-panel">
              <div className="card">
                <h2 style={{ textAlign: 'center' }}>Live Match Score</h2>
                <p className="card-sub" style={{ textAlign: 'center' }}>Against this JD's hard filters</p>
                <div className="match-score-ring">
                  <svg width="132" height="132">
                    <circle cx="66" cy="66" r="56" stroke="#e4e7ee" strokeWidth="12" fill="none" />
                    <circle cx="66" cy="66" r="56" stroke={ringColor} strokeWidth="12" fill="none" strokeLinecap="round"
                      strokeDasharray="352" strokeDashoffset={ringOffset} style={{ transition: 'stroke-dashoffset .4s ease, stroke .3s' }} />
                  </svg>
                  <div className="center"><div className="num">{ringPct}%</div><div className="lbl">Fit</div></div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div className="match-row"><span className="m-name"><Dot s={expState} />Experience</span><Status s={expState} /></div>
                  <div className="match-row"><span className="m-name"><Dot s={hikeState} />Compensation</span><Status s={hikeState} /></div>
                  <div className="match-row"><span className="m-name"><Dot s={locState} />Location</span><Status s={locState} /></div>
                  <div className="match-row"><span className="m-name"><Dot s={noticeState} />Notice Period</span><Status s={noticeState} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Duplicate-check modal */}
      {showDup && (
        <div className="duplicate-modal-bg show" style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(15,20,35,0.55)', zIndex: 100, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--red-light)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, margin: '0 auto 14px' }}>!</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, color: 'var(--navy)' }}>Confirm duplicate check</h3>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 18px' }}>Tick the duplicate-check box before submitting. This candidate must be verified as not already submitted for this position.</p>
            <button className="btn btn-primary" onClick={() => setShowDup(false)}>Got it</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--navy)', color: '#fff', padding: '14px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: '0 12px 30px -8px rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)' }} />{toast}
        </div>
      )}
    </div>
  );
}

// ── Shell: same sidebar / header / footer as the live dash_view ───────────────
const ShellContent = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  return (
    <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      </header>
      <main className="min-h-screen">
        <DashViewV2Inner />
      </main>
      <Footer />
    </div>
  );
};

export default function DashViewV2() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useContext(UserStateContext);
  const isClientSpoc = user?.roleCategory?.toLowerCase() === 'clientspoc';
  const renderSidebar = () => (isClientSpoc ? <ClientSpocSidebar /> : <Sidebar />);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 relative">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          {renderSidebar()}
        </aside>

        {/* Sidebar — mobile overlay */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64">{renderSidebar()}</aside>
          </div>
        )}

        <ShellContent isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      </div>
    </SidebarProvider>
  );
}
