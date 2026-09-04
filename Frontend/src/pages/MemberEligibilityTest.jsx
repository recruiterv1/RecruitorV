import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Clock, Award, Loader2, AlertCircle, Download, RefreshCw } from 'lucide-react';
import DashShell from '../components/DashShell';
import CertifiedCelebration from '../components/CertifiedCelebration';

// The assessment for someone already on the platform. They are signed in, so
// the server takes their details and track from the session and hands back the
// questions directly — no application form, and nothing about their existing
// access changes. Passing earns them the badge and certificate.

const fmtClock = (secs) => {
  const s = Math.max(0, Math.floor(secs));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

function MemberTestInner() {
  const [stage, setStage] = useState('intro');     // intro | test | result
  const [standing, setStanding] = useState(null);  // existing certification, if any
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [err, setErr] = useState('');
  const [blocked, setBlocked] = useState(null);    // already certified / retake locked

  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    axios.get('/api/eligibility/my-certification', { withCredentials: true })
      .then(r => setStanding(r.data))
      .catch(() => setStanding(null))
      .finally(() => setLoading(false));
  }, []);

  const submit = useCallback(async (timedOut = false) => {
    if (submittedRef.current || !attempt) return;
    submittedRef.current = true;
    setBusy(true); setErr('');
    try {
      const r = await axios.post('/api/eligibility/public/submit',
        { attemptId: attempt.attemptId, answers, timedOut }, { withCredentials: true });
      setResult(r.data);
      setStage('result');
      window.scrollTo({ top: 0 });
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not submit your answers. Please try again.');
      submittedRef.current = false;
    } finally { setBusy(false); }
  }, [attempt, answers]);

  useEffect(() => {
    if (stage !== 'test') return;
    const t = setInterval(() => {
      setLeft(s => { if (s <= 1) { clearInterval(t); submit(true); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [stage, submit]);

  const start = async () => {
    setStarting(true); setErr(''); setBlocked(null);
    try {
      const r = await axios.post('/api/eligibility/my/start', {}, { withCredentials: true });
      setAttempt(r.data);
      setAnswers({});
      setLeft(r.data.timeLimitMinutes * 60);
      submittedRef.current = false;
      setStage('test');
      window.scrollTo({ top: 0 });
    } catch (e) {
      const d = e.response?.data;
      if (d?.alreadyCertified || d?.retakeLocked) setBlocked(d);
      else setErr(d?.message || 'Could not start the assessment.');
    } finally { setStarting(false); }
  };

  if (loading) {
    return <div className="p-10 flex items-center justify-center gap-2 text-gray-500 text-sm">
      <Loader2 size={16} className="animate-spin" /> Loading…
    </div>;
  }

  /* ── Result ─────────────────────────────────────────────────────── */
  if (stage === 'result' && result) {
    if (result.tier === 'certified') {
      return (
        <div className="p-4 sm:p-8">
          <CertifiedCelebration
            name={attempt?.name}
            role={attempt?.role}
            skillCategory={attempt?.skillCategory}
            percent={result.percent}
            certificateId={result.certificateId}
            certificateUrl={result.certificateUrl}
            registerHref={null}          /* already registered */
          />
        </div>
      );
    }
    return (
      <div className="p-4 sm:p-8">
        <div className="max-w-xl mx-auto text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
            <RefreshCw size={30} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-6">{result.tierLabel}</p>
          <h1 className="text-[24px] font-bold text-slate-900 mt-1">Not certified this time</h1>
          <p className="mt-4 text-[15px] text-slate-600 leading-relaxed">{result.message}</p>
          <div className="grid grid-cols-2 gap-3 mt-8">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-2xl font-bold text-slate-900">{result.percent}%</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Your score</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-2xl font-bold text-slate-900">{result.correct}/{result.total}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Correct</p>
            </div>
          </div>
          <p className="text-[13px] text-slate-500 mt-5">
            Your account and access are unchanged — this assessment is only about earning the badge.
          </p>
        </div>
      </div>
    );
  }

  /* ── The questions ──────────────────────────────────────────────── */
  if (stage === 'test' && attempt) {
    const answered = Object.keys(answers).length;
    return (
      <div>
        <div className="sticky top-16 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <span className="text-[13px] font-semibold text-gray-700">
              {attempt.role} assessment · {answered}/{attempt.questions.length} answered
            </span>
            <span className={`inline-flex items-center gap-1.5 text-[13px] font-bold px-3 py-1.5 rounded-lg ${
              left <= 60 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              <Clock size={14} /> {fmtClock(left)}
            </span>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          {attempt.questions.map((q, i) => (
            <div key={q.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="font-semibold text-gray-900 text-[15px] whitespace-pre-wrap">
                <span className="text-gray-400 mr-2">{i + 1}.</span>{q.question}
              </p>
              <div className="mt-4 space-y-2">
                {q.options.map((opt, oi) => {
                  const on = answers[q.id] === oi;
                  return (
                    <label key={oi}
                      className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                        on ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name={q.id} checked={on} className="mt-0.5 accent-orange-500"
                        onChange={() => setAnswers(a => ({ ...a, [q.id]: oi }))} />
                      <span className="text-[14px] text-gray-700">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {err && <p className="flex items-center gap-2 text-sm text-red-600"><AlertCircle size={15} /> {err}</p>}

          <div className="flex items-center gap-4 flex-wrap pt-2">
            <button onClick={() => submit(false)} disabled={busy}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold text-sm shadow-lg">
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              {busy ? 'Submitting…' : 'Submit Answers'}
            </button>
            {answered < attempt.questions.length && (
              <span className="text-[13px] text-gray-500">
                {attempt.questions.length - answered} unanswered — these count as wrong.
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Intro ──────────────────────────────────────────────────────── */
  const alreadyCertified = standing?.certified;

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl"><Award size={22} /></div>
          <div>
            <h2 className="text-xl font-bold">Earn Your Certification</h2>
            <p className="text-orange-50 text-sm">
              Take the assessment for your track and earn the Certified badge and certificate.
            </p>
          </div>
        </div>
      </div>

      {alreadyCertified ? (
        <div className="bg-white border border-amber-300 rounded-2xl p-6 mt-4">
          <div className="flex items-start gap-4 flex-wrap">
            <span className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Award size={24} />
            </span>
            <div className="flex-1 min-w-[220px]">
              <p className="font-bold text-amber-900">You are already Certified</p>
              <p className="text-[13px] text-gray-600 mt-1">
                {standing.skillCategory ? `${standing.skillCategory} · ` : ''}
                {standing.certificateId ? <>Certificate <span className="font-mono">{standing.certificateId}</span></> : null}
              </p>
            </div>
            {standing.certificateUrl && (
              <a href={standing.certificateUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold">
                <Download size={15} /> Download certificate
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-4">
          <h3 className="font-bold text-gray-900">Before you begin</h3>
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            {[['One sitting', 'The clock starts as soon as you begin and cannot be paused.'],
              ['Scenario questions', 'Real sourcing, screening and client calls — not textbook theory.'],
              ['80% to be Certified', 'Below that your account is unaffected; you keep working as you are.']]
              .map(([t, b]) => (
              <div key={t} className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <p className="font-semibold text-gray-900 text-[14px]">{t}</p>
                <p className="text-[12.5px] text-gray-600 mt-1 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>

          {standing?.assessment && standing.assessment.canTake && standing.assessment.maxAttempts && (
            <p className="text-[13px] text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mt-4">
              Attempt {(standing.assessment.attemptsUsed ?? 0) + 1} of {standing.assessment.maxAttempts}.
              {standing.assessment.attemptsUsed > 0
                ? ` You have ${standing.assessment.attemptsLeft} attempt${standing.assessment.attemptsLeft === 1 ? '' : 's'} left, with a 10-day gap between each.`
                : ' You get three attempts in total, with a 10-day gap between each.'}
            </p>
          )}
          {standing?.assessment && !standing.assessment.canTake && standing.assessment.message && (
            <p className="text-[13px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4">
              {standing.assessment.message}
            </p>
          )}
          {standing?.tier === 'conditional' && (
            <p className="text-[13px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4">
              You currently hold Conditional standing. Score 80% or above to become Certified.
            </p>
          )}

          {blocked && (
            <p className="text-[13px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4">
              {blocked.message}
            </p>
          )}
          {err && (
            <p className="flex items-center gap-2 text-sm text-red-600 mt-4"><AlertCircle size={15} /> {err}</p>
          )}

          <button onClick={start} disabled={starting || standing?.assessment?.canTake === false}
            className="mt-5 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold text-sm shadow-lg">
            {starting ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
            {starting ? 'Starting…' : 'Start the assessment'}
          </button>
          <p className="text-[12px] text-gray-500 mt-3">
            Taking this never affects your existing access — it only decides whether you earn the badge.
          </p>
        </div>
      )}
    </div>
  );
}

export default function MemberEligibilityTest() {
  return <DashShell><MemberTestInner /></DashShell>;
}
