import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, Info, X, FileText, CheckCircle2, Loader2 } from 'lucide-react';

// Two-step "Upload Resume" modal for Refer & Earn, matching the approved design.
//   Step 1 — Resume File   : drag/drop or browse (PDF, DOC, DOCX — max 10 MB)
//   Step 2 — Candidate Details : details + the mandatory consent confirmation
//
// Submission uses the same endpoints as the original referral form
// (/api/direct-apply/upload-cv then /api/referral/submit), so behaviour and the
// stored record are unchanged — only the interface is new.

const MAX_MB = 10;
const OK_EXT = ['pdf', 'doc', 'docx'];

// Defined at module scope on purpose. Declaring this inside the component would
// give it a new identity on every render, so React would unmount/remount the
// input on each keystroke and the field would lose focus after one character.
const Field = ({ label, req, type = 'text', ph, value, onChange, onBlur }) => (
  <div className="ru-f">
    <label>{label}{req && <span className="ru-req"> *</span>}</label>
    <input type={type} value={value} placeholder={ph || ''} onChange={onChange} onBlur={onBlur} />
  </div>
);

const ReferralUploadModal = ({ onClose, onSubmitted }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedCount, setParsedCount] = useState(0);
  const [dup, setDup] = useState(null);   // { message } when this candidate was already referred
  const inputRef = useRef(null);

  // Field set mirrors the design exactly (label + order).
  const [f, setF] = useState({
    candidate: '', mob: '', emails: '', total_exp: '', curr_emp: '',
    designation: '', current_ctc: '', exp_ctc: '', notice_period: '', pref_loc: '',
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const [skills, setSkills] = useState([]);
  const [skillDraft, setSkillDraft] = useState('');
  const addSkill = () => {
    const v = skillDraft.trim();
    if (!v) return;
    if (!skills.some(x => x.toLowerCase() === v.toLowerCase())) setSkills(p => [...p, v]);
    setSkillDraft('');
  };

  const takeFile = (fl) => {
    setErr('');
    if (!fl) return;
    const ext = (fl.name.split('.').pop() || '').toLowerCase();
    if (!OK_EXT.includes(ext)) { setErr('Only PDF, DOC or DOCX files are allowed.'); return; }
    if (fl.size > MAX_MB * 1024 * 1024) { setErr(`File is too large — maximum ${MAX_MB} MB.`); return; }
    setFile(fl);
    parseResume(fl);
  };

  // Read the resume and pre-fill whatever we can. Purely a convenience — a
  // failure here never blocks the user, they just fill the fields manually.
  const parseResume = async (fl) => {
    setParsing(true); setParsedCount(0);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(fl);
      });
      const r = await axios.post('/api/direct-apply/parse-resume', {
        filename: fl.name, contentType: fl.type || 'application/octet-stream', base64,
      }, { withCredentials: true });
      const info = r.data?.info || {};
      const keys = Object.keys(info).filter(k => info[k]);
      if (keys.length) {
        // Map parser output onto the design's field names.
        const mapped = { ...info };
        if (info.total_exp_year) mapped.total_exp = `${info.total_exp_year} Years`;
        if (info.curr_loc) mapped.pref_loc = info.curr_loc;
        delete mapped.total_exp_year; delete mapped.total_exp_months;
        delete mapped.curr_loc; delete mapped.dob; delete mapped.highest_education;
        let n = 0;
        setF(prev => {
          const next = { ...prev };
          Object.entries(mapped).forEach(([k, v]) => {
            if (v && k in next && !String(next[k] || '').trim()) { next[k] = v; n++; }
          });
          return next;
        });
        setParsedCount(n);
      }
      // Flag a duplicate as early as possible — before the user fills the form.
      const em = (info.emails || '').trim().toLowerCase();
      const ph = String(info.mob || '').trim();
      if (em || ph) checkDuplicate(em, ph);
    } catch (_) { /* parsing is best-effort */ }
    finally { setParsing(false); }
  };

  // Has this candidate already been referred (by anyone)?
  const checkDuplicate = async (em, ph) => {
    try {
      const r = await axios.post('/addit/data/check',
        { emails: em, mob: ph }, { withCredentials: true });
      if (r.data?.exists && r.data?.match?.source === 'referred') {
        setDup({ message: 'This candidate has already been referred. Duplicate referrals are not accepted.' });
      } else {
        setDup(null);
      }
    } catch (_) { setDup(null); }
  };

  const submit = async () => {
    if (!f.candidate.trim() || !f.emails.trim() || !f.mob.trim()) {
      setErr('Candidate name, email and phone are required.'); return;
    }
    if (!consent) { setErr('Please confirm the candidate has been informed.'); return; }
    if (dup) { setErr(dup.message); return; }
    setBusy(true); setErr('');
    try {
      // 1) Upload the resume
      let cv_url = '';
      if (file) {
        const base64 = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result.split(',')[1]);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        const up = await axios.post('/api/direct-apply/upload-cv', {
          filename: file.name, contentType: file.type || 'application/octet-stream', base64,
        }, { withCredentials: true });
        if (up.data?.success) cv_url = up.data.url;
      }

      // 2) Create the referral — same payload shape as the original form
      const payload = {
        candidate: f.candidate.trim(), mob: f.mob.trim(), emails: f.emails.trim().toLowerCase(),
        dob: '', curr_emp: f.curr_emp, highest_education: '',
        current_ctc: f.current_ctc, exp_ctc: f.exp_ctc,
        total_exp: f.total_exp, rel_exp: '',
        notice_period: f.notice_period,
        curr_state: '', curr_loc: f.pref_loc, pref_state: '', pref_loc: f.pref_loc,
        skill_type: '', tech_category: f.designation, tech_subcategory: '',
        tech_skill: JSON.stringify(skills), tech_exp: '[]',
        nontech_category: '', nontech_subcategory: '', nontech_skill: '[]', nontech_exp: '[]',
        self_rate: '', cv_url,
      };
      const res = await axios.post('/api/referral/submit', payload, { withCredentials: true });
      if (res.data?.success) {
        setDone(true);
        onSubmitted && onSubmitted();
      } else {
        setErr(res.data?.message || 'Submission failed.');
      }
    } catch (e) {
      const d = e.response?.data;
      if (e.response?.status === 409 && d?.duplicate) {
        setDup({ message: d.message });
        setErr(d.message);
      } else {
        setErr(d?.message || 'Submission failed. Please try again.');
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="ru-back" onClick={onClose}>
      <style>{CSS}</style>
      <div className="ru-box" onClick={e => e.stopPropagation()}>
        <div className="ru-head">
          <div>
            <h3>Upload Resume</h3>
            <p>{done ? 'Done' : `Step ${step} of 2 — ${step === 1 ? 'Resume File' : 'Candidate Details'}`}</p>
          </div>
          <button className="ru-x" onClick={onClose}><X size={17} /></button>
        </div>

        <div className="ru-bar"><span style={{ width: done ? '100%' : step === 1 ? '50%' : '100%' }} /></div>

        <div className="ru-body">
          {done ? (
            <div className="ru-done">
              <CheckCircle2 size={44} />
              <h4>Resume referred successfully</h4>
              <p>It is now in your referral pool. You can track its progress under <b>My Referrals</b>.</p>
              <button className="ru-btn" onClick={onClose}>Close</button>
            </div>
          ) : step === 1 ? (
            <>
              <div
                className={`ru-drop${drag ? ' on' : ''}${file ? ' has' : ''}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); takeFile(e.dataTransfer.files?.[0]); }}
              >
                <div className="ru-drop-i">{file ? <FileText size={21} /> : <UploadCloud size={21} />}</div>
                {file ? (
                  <>
                    <div className="ru-drop-t">{file.name}</div>
                    <div className="ru-drop-s">{(file.size / 1024 / 1024).toFixed(2)} MB · click to replace</div>
                  </>
                ) : (
                  <>
                    <div className="ru-drop-t">Drop resume here or click to browse</div>
                    <div className="ru-drop-s">PDF, DOC, DOCX — max {MAX_MB} MB</div>
                  </>
                )}
                <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" hidden
                  onChange={e => takeFile(e.target.files?.[0])} />
              </div>

              {file && (parsing || parsedCount > 0) && (
                <div className="ru-note ru-parse">
                  {parsing
                    ? <><Loader2 size={15} className="ru-spin" /><span>Reading resume — pre-filling candidate details…</span></>
                    : <><CheckCircle2 size={15} /><span>Details read from the resume. Review and complete them on the next step.</span></>}
                </div>
              )}

              <div className="ru-note">
                <Info size={15} />
                <span>Candidate consent is required. A consent checkbox will appear on the next step.</span>
              </div>

              {dup && <div className="ru-err">⚠ {dup.message}</div>}
              {err && !dup && <div className="ru-err">{err}</div>}

              <div className="ru-foot">
                <button className="ru-btn" disabled={!file || !!dup}
                  onClick={() => { setErr(''); setStep(2); }}>Continue</button>
              </div>
            </>
          ) : (
            <>
              {parsedCount > 0 && (
                <div className="ru-note ru-parse" style={{ marginTop: 0, marginBottom: 14 }}>
                  <CheckCircle2 size={15} />
                  <span>Pre-filled from the uploaded resume — please check each field and fill anything left blank.</span>
                </div>
              )}

              <div className="ru-grid">
                <Field label="Candidate Name" req ph="Arjun Mehta"
                  value={f.candidate} onChange={e => set('candidate', e.target.value)} />
                <Field label="Mobile Number" req ph="+91 98765 43210"
                  value={f.mob} onChange={e => { set('mob', e.target.value); setDup(null); }}
                  onBlur={() => checkDuplicate(f.emails.trim().toLowerCase(), f.mob.trim())} />
                <Field label="Email" req type="email" ph="arjun.mehta@email.com"
                  value={f.emails} onChange={e => { set('emails', e.target.value); setDup(null); }}
                  onBlur={() => checkDuplicate(f.emails.trim().toLowerCase(), f.mob.trim())} />
                <Field label="Total Experience" ph="7 Years"
                  value={f.total_exp} onChange={e => set('total_exp', e.target.value)} />
                <Field label="Current Company" ph="Infosys Ltd."
                  value={f.curr_emp} onChange={e => set('curr_emp', e.target.value)} />
                <Field label="Current Designation" ph="Senior Java Developer"
                  value={f.designation} onChange={e => set('designation', e.target.value)} />
                <Field label="Current CTC" ph="18 LPA"
                  value={f.current_ctc} onChange={e => set('current_ctc', e.target.value)} />
                <Field label="Expected CTC" ph="24 LPA"
                  value={f.exp_ctc} onChange={e => set('exp_ctc', e.target.value)} />
                <Field label="Notice Period" ph="30 Days"
                  value={f.notice_period} onChange={e => set('notice_period', e.target.value)} />
                <Field label="Preferred Locations" ph="Bangalore, Hyderabad"
                  value={f.pref_loc} onChange={e => set('pref_loc', e.target.value)} />
              </div>

              {/* Skills — chip input */}
              <div className="ru-skills">
                <label>Skills</label>
                {skills.length > 0 && (
                  <div className="ru-chips">
                    {skills.map((sk, i) => (
                      <span className="ru-chip" key={i}>
                        {sk}
                        <button type="button" onClick={() => setSkills(p => p.filter((_, j) => j !== i))}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  value={skillDraft}
                  placeholder="Add skill..."
                  onChange={e => setSkillDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); } }}
                  onBlur={addSkill}
                />
              </div>

              <label className="ru-consent">
                <input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); setErr(''); }} />
                <span>I confirm that the candidate has provided consent to share their resume on the
                  RecruiterV marketplace. Consent timestamp will be recorded.<span className="ru-req"> *</span></span>
              </label>

              {dup && <div className="ru-err">⚠ {dup.message}</div>}
              {err && !dup && <div className="ru-err">{err}</div>}

              <div className="ru-foot">
                <button className="ru-btn ghost" onClick={() => { setErr(''); setStep(1); }}>← Back</button>
                <button className="ru-btn" disabled={busy || !!dup} onClick={submit}>
                  {busy ? <><Loader2 size={14} className="ru-spin" /> Publishing…</> : 'Publish to Marketplace'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CSS = `
.ru-back{position:fixed;inset:0;z-index:10000;background:rgba(5,8,14,.72);display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto;font-family:'Inter',system-ui,sans-serif;}
.ru-box{width:100%;max-width:640px;background:#151b26;border:1px solid #232b3a;border-radius:15px;color:#e8ecf3;overflow:hidden;box-shadow:0 24px 60px -12px rgba(0,0,0,.6);}
.ru-head{display:flex;align-items:flex-start;justify-content:space-between;padding:18px 20px 14px;}
.ru-head h3{margin:0;font-size:18px;font-weight:800;}
.ru-head p{margin:3px 0 0;font-size:12px;color:#68758a;font-family:ui-monospace,monospace;}
.ru-x{background:#1a2130;border:1px solid #232b3a;color:#9aa6b8;border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;}
.ru-x:hover{color:#e8ecf3;}
.ru-bar{height:3px;background:#1a2130;margin:0 20px;border-radius:20px;overflow:hidden;}
.ru-bar span{display:block;height:100%;background:linear-gradient(90deg,#6366f1,#818cf8);transition:width .25s ease;}
.ru-body{padding:20px;}
.ru-drop{border:1.6px dashed #2d3648;border-radius:12px;padding:34px 20px;text-align:center;cursor:pointer;transition:all .15s ease;background:#121826;}
.ru-drop:hover,.ru-drop.on{border-color:#6366f1;background:#161d2e;}
.ru-drop.has{border-style:solid;border-color:#34d399;}
.ru-drop-i{width:44px;height:44px;border-radius:50%;background:#1e263a;color:#818cf8;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;}
.ru-drop.has .ru-drop-i{color:#34d399;}
.ru-drop-t{font-size:14.5px;font-weight:700;}
.ru-drop-s{font-size:11.5px;color:#68758a;margin-top:4px;font-family:ui-monospace,monospace;}
.ru-note{display:flex;gap:9px;align-items:flex-start;background:#121826;border:1px solid #232b3a;border-radius:10px;padding:12px 14px;margin-top:14px;font-size:12.5px;color:#9aa6b8;line-height:1.5;}
.ru-note svg{color:#818cf8;flex-shrink:0;margin-top:1px;}
.ru-parse{border-color:rgba(52,211,153,.3);}
.ru-parse svg{color:#34d399;}
.ru-err{margin-top:12px;background:rgba(214,69,90,.12);border:1px solid rgba(214,69,90,.35);color:#f2879a;border-radius:9px;padding:10px 13px;font-size:12.5px;}
.ru-foot{display:flex;justify-content:flex-end;gap:9px;margin-top:18px;}
.ru-btn{display:inline-flex;align-items:center;gap:7px;background:#6366f1;color:#fff;border:none;border-radius:9px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:filter .13s ease;}
.ru-btn:hover:not(:disabled){filter:brightness(1.1);}
.ru-btn:disabled{opacity:.4;cursor:not-allowed;}
.ru-btn.ghost{background:transparent;border:1px solid #232b3a;color:#9aa6b8;}
.ru-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px;}
@media(max-width:560px){.ru-grid{grid-template-columns:1fr;}}
.ru-f label{display:block;font-size:12px;font-weight:600;color:#9aa6b8;margin-bottom:5px;}
.ru-f input{width:100%;background:#121826;border:1.5px solid #232b3a;border-radius:8px;padding:9px 11px;color:#e8ecf3;font-size:13px;font-family:inherit;}
.ru-f input:focus{outline:none;border-color:#6366f1;}
.ru-f input::placeholder{color:#4d5a70;}
.ru-duo{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.ru-req{color:#f2879a;}
.ru-skills{margin-top:16px;}
.ru-skills label{display:block;font-size:12px;font-weight:600;color:#9aa6b8;margin-bottom:5px;}
.ru-skills input{width:100%;background:#121826;border:1.5px solid #232b3a;border-radius:8px;padding:9px 11px;color:#e8ecf3;font-size:13px;font-family:inherit;}
.ru-skills input:focus{outline:none;border-color:#6366f1;}
.ru-skills input::placeholder{color:#4d5a70;}
.ru-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;}
.ru-chip{display:inline-flex;align-items:center;gap:6px;background:#1e2535;color:#94a3b8;border:1px solid #1e2a40;border-radius:6px;padding:4px 9px;font-size:12px;}
.ru-chip button{background:none;border:none;color:#64748b;cursor:pointer;font-size:14px;line-height:1;padding:0;}
.ru-chip button:hover{color:#f2879a;}
.ru-consent{display:flex;gap:10px;align-items:flex-start;margin-top:16px;background:#121826;border:1px solid #232b3a;border-radius:10px;padding:13px 14px;cursor:pointer;font-size:12.5px;color:#9aa6b8;line-height:1.55;}
.ru-consent input{width:17px;height:17px;accent-color:#6366f1;flex-shrink:0;margin-top:1px;cursor:pointer;}
.ru-done{text-align:center;padding:26px 10px 10px;}
.ru-done svg{color:#34d399;}
.ru-done h4{margin:14px 0 6px;font-size:17px;font-weight:800;}
.ru-done p{margin:0 auto 20px;font-size:13px;color:#9aa6b8;max-width:390px;line-height:1.6;}
.ru-spin{animation:ruspin 1s linear infinite;}
@keyframes ruspin{to{transform:rotate(360deg);}}
`;

export default ReferralUploadModal;
