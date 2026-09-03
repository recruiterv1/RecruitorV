import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { ArrowRight, Clock, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

// Public eligibility check. Someone enters their details, picks a role, answers
// the MCQs against a timer, and is told whether they cleared the mark.
//
// The correct answers are never sent to the browser — the server grades the
// attempt on submit and returns only the outcome and the message.

const INK = '#0F1D3C';
const ORANGE = '#F47B20';

const ROLE_BLURB = {
  Coach: 'Lead a team of recruiters and guide them on live positions.',
  Expert: 'Bring deep domain knowledge to hiring for specialist roles.',
  Recruiter: 'Source, screen and submit candidates on live positions.',
};

const fmtClock = (secs) => {
  const s = Math.max(0, Math.floor(secs));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export default function CheckEligibility() {
  const [stage, setStage] = useState('form');      // form | test | result
  const [cfg, setCfg] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const [attempt, setAttempt] = useState(null);    // { attemptId, questions, timeLimitMinutes }
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState(0);             // seconds remaining
  const [result, setResult] = useState(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    axios.get('/api/eligibility/public/config')
      .then(r => setCfg(r.data))
      .catch(() => setCfg({ roles: ['Coach', 'Expert', 'Recruiter'], config: {} }));

    // Registration sends people here with their role and email already known,
    // so they do not retype them — and so the pass is recorded against the
    // same address they will register with.
    const p = new URLSearchParams(window.location.search);
    const role = p.get('role') || '';
    const email = p.get('email') || '';
    if (role || email) {
      setForm(f => ({
        ...f,
        role: ['Coach', 'Expert', 'Recruiter'].includes(role) ? role : f.role,
        email: email || f.email,
      }));
    }
  }, []);

  const submit = useCallback(async (timedOut = false) => {
    if (submittedRef.current || !attempt) return;
    submittedRef.current = true;
    setBusy(true); setErr('');
    try {
      const r = await axios.post('/api/eligibility/public/submit', {
        attemptId: attempt.attemptId, answers, timedOut,
      });
      setResult(r.data);
      setStage('result');
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not submit your answers. Please try again.');
      submittedRef.current = false;      // let them retry
    } finally { setBusy(false); }
  }, [attempt, answers]);

  // Countdown. Submits automatically when the time runs out.
  useEffect(() => {
    if (stage !== 'test') return;
    const t = setInterval(() => {
      setLeft(s => {
        if (s <= 1) { clearInterval(t); submit(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [stage, submit]);

  const start = async () => {
    setErr('');
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setErr('Please fill in your name, email and phone.'); return;
    }
    if (!form.role) { setErr('Please choose the role you are applying for.'); return; }
    setBusy(true);
    try {
      const r = await axios.post('/api/eligibility/public/start', form);
      setAttempt(r.data);
      setAnswers({});
      setLeft(r.data.timeLimitMinutes * 60);
      submittedRef.current = false;
      setStage('test');
      window.scrollTo({ top: 0 });
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not start the check. Please try again.');
    } finally { setBusy(false); }
  };

  const field = 'w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-orange-400 outline-none';
  const roles = cfg?.roles || ['Coach', 'Expert', 'Recruiter'];
  const answered = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* ── Details + role ─────────────────────────────────────────── */}
        {stage === 'form' && (
          <>
            <section style={{ background: INK }} className="px-4 py-14 sm:py-20">
              <div className="max-w-3xl mx-auto text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-3">
                  Eligibility Check
                </p>
                <h1 className="text-white font-bold text-[30px] sm:text-[42px] leading-tight">
                  See If You Qualify to Join RecruiterV
                </h1>
                <p className="mt-5 text-slate-300 text-[15px] leading-relaxed">
                  A short multiple-choice check. Answer within the time limit — you will see your
                  result as soon as you submit.
                </p>
              </div>
            </section>

            <section className="px-4 py-14">
              <div className="max-w-xl mx-auto">
                <h2 className="text-xl font-bold text-slate-900">Your details</h2>
                <div className="space-y-4 mt-5">
                  {[['name', 'Full name', 'text'], ['email', 'Email address', 'email'], ['phone', 'Phone number', 'tel']].map(([k, label, type]) => (
                    <div key={k}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                      <input type={type} className={field} value={form[k]}
                        onChange={(e) => setForm(f => ({ ...f, [k]: e.target.value }))} />
                    </div>
                  ))}
                </div>

                <h2 className="text-xl font-bold text-slate-900 mt-9">Which role are you applying for?</h2>
                <div className="grid sm:grid-cols-3 gap-3 mt-4">
                  {roles.map(r => {
                    const c = cfg?.config?.[r];
                    const ready = c ? c.ready : true;
                    const on = form.role === r;
                    return (
                      <button key={r} type="button" disabled={!ready}
                        onClick={() => setForm(f => ({ ...f, role: r }))}
                        className={`text-left rounded-2xl border p-4 transition disabled:opacity-50 ${
                          on ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <p className="font-bold text-slate-900">{r}</p>
                        <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">{ROLE_BLURB[r]}</p>
                        {c && ready && (
                          <p className="text-[11px] text-slate-500 mt-2.5">
                            {c.questionCount} questions · {c.timeLimitMinutes} min · pass {c.passPercent}%
                          </p>
                        )}
                        {!ready && <p className="text-[11px] text-slate-400 mt-2.5">Not available yet</p>}
                      </button>
                    );
                  })}
                </div>

                {err && (
                  <p className="flex items-center gap-2 text-sm text-red-600 mt-5">
                    <AlertCircle size={15} /> {err}
                  </p>
                )}

                <button onClick={start} disabled={busy}
                  className="mt-7 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg disabled:opacity-60"
                  style={{ background: ORANGE }}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                  {busy ? 'Starting…' : 'Start the Check'} {!busy && <ArrowRight size={16} />}
                </button>
                <p className="text-[12px] text-slate-500 mt-3">
                  The timer starts as soon as you begin, and the check submits itself when time runs out.
                </p>
              </div>
            </section>
          </>
        )}

        {/* ── The test ───────────────────────────────────────────────── */}
        {stage === 'test' && attempt && (
          <>
            <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
              <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
                <span className="text-[13px] font-semibold text-slate-700">
                  {form.role} check · {answered}/{attempt.questions.length} answered
                </span>
                <span className={`inline-flex items-center gap-1.5 text-[13px] font-bold px-3 py-1.5 rounded-lg ${
                  left <= 60 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                  <Clock size={14} /> {fmtClock(left)}
                </span>
              </div>
            </div>

            <section className="px-4 py-10">
              <div className="max-w-3xl mx-auto space-y-4">
                {attempt.questions.map((q, i) => (
                  <div key={q.id} className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900 text-[15px]">
                      <span className="text-slate-400 mr-2">{i + 1}.</span>{q.question}
                    </p>
                    <div className="mt-4 space-y-2">
                      {q.options.map((opt, oi) => {
                        const on = answers[q.id] === oi;
                        return (
                          <label key={oi}
                            className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                              on ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <input type="radio" name={q.id} checked={on} className="mt-0.5 accent-orange-500"
                              onChange={() => setAnswers(a => ({ ...a, [q.id]: oi }))} />
                            <span className="text-[14px] text-slate-700">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {err && (
                  <p className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle size={15} /> {err}
                  </p>
                )}

                <div className="flex items-center gap-4 flex-wrap pt-2">
                  <button onClick={() => submit(false)} disabled={busy}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg disabled:opacity-60"
                    style={{ background: ORANGE }}>
                    {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                    {busy ? 'Submitting…' : 'Submit Answers'}
                  </button>
                  {answered < attempt.questions.length && (
                    <span className="text-[13px] text-slate-500">
                      {attempt.questions.length - answered} unanswered — these count as wrong.
                    </span>
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── Result ─────────────────────────────────────────────────── */}
        {stage === 'result' && result && (
          <section className="px-4 py-16 sm:py-24">
            <div className="max-w-xl mx-auto text-center">
              <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center ${
                result.passed ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                {result.passed ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              </div>
              <h1 className="text-[26px] sm:text-[32px] font-bold text-slate-900 mt-6">
                {result.passed ? 'You’re eligible' : 'Not this time'}
              </h1>
              <p className="mt-4 text-[15px] text-slate-600 leading-relaxed">{result.message}</p>

              <div className="grid grid-cols-3 gap-3 mt-8">
                {[[`${result.percent}%`, 'Your score'], [`${result.correct}/${result.total}`, 'Correct'],
                  [`${result.passPercent}%`, 'Pass mark']].map(([v, l]) => (
                  <div key={l} className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-2xl font-bold text-slate-900">{v}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{l}</p>
                  </div>
                ))}
              </div>

              {result.timedOut && (
                <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-5">
                  Your time ran out, so the answers you had selected were submitted automatically.
                </p>
              )}

              {result.passed && (
                <>
                  <a href={`/reg?email=${encodeURIComponent(form.email.trim())}&role=${encodeURIComponent(form.role)}`}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg mt-8"
                    style={{ background: ORANGE }}>
                    Continue to Registration <ArrowRight size={16} />
                  </a>
                  <p className="text-[12px] text-slate-500 mt-3">
                    Register with <span className="font-semibold">{form.email.trim()}</span> — your pass is
                    recorded against this address.
                  </p>
                </>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
