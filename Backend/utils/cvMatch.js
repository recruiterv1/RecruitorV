/**
 * CV ↔ JD match evaluation using Claude.
 * Reads the candidate's CV (PDF) and scores it against the position JD (0-100),
 * stores the result on the candidate, and — when the score is <= 50 —
 * auto-rejects and emails the candidate.
 */
const Anthropic = require('@anthropic-ai/sdk');
const { db } = require('../router/firebase_ad');
const { sendEmailFull } = require('./email');

const MATCH_THRESHOLD = 50;        // <= this → auto reject
const REJECT_STATUS = 'Screen Reject';

const buildJd = (p = {}) => {
  const loc = Array.isArray(p.location) ? p.location.join(', ') : (p.location || '');
  return [
    `Position: ${p.position || ''}`,
    p.skill_category ? `Skill Category: ${p.skill_category}` : '',
    p.experience ? `Experience required: ${p.experience}` : '',
    loc ? `Location: ${loc}` : '',
    p.job_desc ? `Job Description / Summary:\n${p.job_desc}` : '',
    p.key_res ? `Key Responsibilities:\n${p.key_res}` : '',
    p.m_have ? `Must Have:\n${p.m_have}` : '',
    p.g_have ? `Good to Have:\n${p.g_have}` : '',
    p.compet ? `Competencies:\n${p.compet}` : '',
  ].filter(Boolean).join('\n').slice(0, 8000);
};

const MATCH_TOOL = {
  name: 'emit_match',
  description: 'Report how well the candidate CV matches the job description.',
  input_schema: {
    type: 'object',
    properties: {
      score: { type: 'integer', description: 'Overall match 0-100 (skills, experience, role fit).' },
      summary: { type: 'string', description: 'One or two sentences explaining the score.' },
      reasoning: {
        type: 'string',
        description: 'A detailed, point-by-point explanation of HOW the decision was reached. '
          + 'Cover, as separate short lines: (1) Required/must-have skills present in the CV vs. those missing; '
          + '(2) Candidate\'s years of relevant experience vs. the experience required by the JD; '
          + '(3) Role / domain fit; (4) Seniority alignment; (5) Any other notable gaps or strengths. '
          + 'End with a one-line conclusion stating why this led to the score. Use plain text with line breaks (no markdown).',
      },
    },
    required: ['score', 'summary', 'reasoning'],
  },
};

const PROMPT = (jd) => `Evaluate how well this candidate's CV matches the job below. Consider required skills, years of experience, role/domain fit, and seniority. Be objective and strict. Then call emit_match.\n\n=== JOB DESCRIPTION ===\n${jd}`;

// Marker error for transient failures (no credits, rate-limit, network, missing
// key). These must NOT permanently mark a candidate as evaluated, so the CV is
// retried automatically once the underlying problem is resolved.
class CvScoreServiceError extends Error {
  constructor(message) { super(message); this.name = 'CvScoreServiceError'; this.transient = true; }
}

// ── Hybrid scoring thresholds ────────────────────────────────────────────────
// The deterministic (free) heuristic decides on its own only when the result is
// clearly a pass or clearly junk. Anything in between goes to the AI, so AI is
// spent only where the reject decision is actually close. All tunable.
const HEUR_PASS   = 60;   // heuristic score >= → confident PASS, skip AI
const HEUR_REJECT = 25;   // heuristic score <= → confident REJECT, skip AI

// ── CV fetch + text extraction (NO AI) ───────────────────────────────────────
// Returns { buf, isPdf, isDocx } or null when the file is genuinely unreadable
// (404 / unsupported format). Throws CvScoreServiceError on a network failure.
const fetchCv = async (cvUrl) => {
  let resp;
  try { resp = await fetch(cvUrl); }
  catch (e) { throw new CvScoreServiceError(`CV fetch failed: ${e.message}`); }
  if (!resp.ok) return null;
  const ctype = (resp.headers.get('content-type') || '').toLowerCase();
  const buf = Buffer.from(await resp.arrayBuffer());
  const isPdf  = ctype.includes('pdf') || /\.pdf(\?|$)/i.test(cvUrl);
  const isDocx = ctype.includes('officedocument.wordprocessingml') || /\.docx(\?|$)/i.test(cvUrl);
  if (!isPdf && !isDocx) return null;   // .doc / images / other → unsupported
  return { buf, isPdf, isDocx };
};

const extractCvText = async ({ buf, isPdf, isDocx }) => {
  try {
    if (isPdf) {
      const pdfParse = require('pdf-parse');
      const parsed = await pdfParse(buf);
      return (parsed.text || '').trim();
    }
    if (isDocx) {
      const mammoth = require('mammoth');
      const r = await mammoth.extractRawText({ buffer: buf });
      return (r.value || '').trim();
    }
  } catch (e) { console.error('cv text extract failed:', e.message); }
  return '';
};

// ── Deterministic keyword/skill scorer (NO AI, NO cost) ───────────────────────
const STOP = new Set((
  'the and for with that this you your our will must have has had are was were ' +
  'from into out who whom they them then than over under more most such very ' +
  'years year experience experienced work working knowledge skills skill ability ' +
  'strong good excellent using use used team role job position description ' +
  'responsibilities responsibility candidate candidates require required requirements ' +
  'including include includes etc per across within about also able based new'
).split(/\s+/));

const kwList = (str) => {
  const seen = new Set();
  return (str || '').toLowerCase()
    .replace(/[^a-z0-9\s.#+]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w))
    .filter(w => (seen.has(w) ? false : (seen.add(w), true)));
};

const firstNum = (s) => { const m = (s || '').toString().match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; };

// Returns { score, summary, reasoning } or null when there isn't enough JD
// signal / CV text to score reliably (caller then falls back to AI).
const heuristicScore = (cvText, pos = {}, cand = {}) => {
  const text = (cvText || '').toLowerCase();
  if (text.length < 30) return null;                   // too little text → let AI read it
  const tokens = new Set(text.replace(/[^a-z0-9\s.#+]/g, ' ').split(/\s+/).filter(t => t.length > 2));
  const has = (w) => tokens.has(w) || text.includes(w);

  // Weighted JD keyword groups — must-haves and skill category dominate.
  const groups = [
    { weight: 3, words: kwList(pos.m_have) },
    { weight: 3, words: kwList(pos.skill_category) },
    { weight: 2, words: kwList(pos.position) },
    { weight: 1, words: kwList(pos.g_have) },
    { weight: 1, words: kwList([pos.key_res, pos.job_desc].filter(Boolean).join(' ')).slice(0, 40) },
  ];

  let totalW = 0, gotW = 0;
  const matched = [], missing = [];
  const counted = new Set();
  for (const g of groups) {
    for (const w of g.words) {
      if (counted.has(w)) continue;                    // a keyword counts once, at its highest weight
      counted.add(w);
      totalW += g.weight;
      if (has(w)) { gotW += g.weight; if (matched.length < 25) matched.push(w); }
      else if (missing.length < 25) missing.push(w);
    }
  }
  if (totalW < 6) return null;                         // JD too sparse to be meaningful → let AI decide

  let score = Math.round((gotW / totalW) * 100);

  // Light experience adjustment.
  const reqExp  = firstNum(pos.experience);
  const candExp = firstNum(cand.total_exp) ?? firstNum(cand.rel_exp);
  let expNote = '';
  if (reqExp != null && candExp != null) {
    if (candExp + 0.5 < reqExp) { score = Math.round(score * 0.85); expNote = `Experience ${candExp}y is below the required ~${reqExp}y.`; }
    else { expNote = `Experience ${candExp}y meets the required ~${reqExp}y.`; }
  }
  score = Math.max(0, Math.min(100, score));

  const totalKw = matched.length + missing.length;
  const summary = `Keyword match ${score}% — ${matched.length}/${totalKw} key skills found in the CV.`;
  const reasoning = [
    `Skills matched: ${matched.length ? matched.join(', ') : '(none)'}`,
    `Skills missing: ${missing.length ? missing.join(', ') : '(none)'}`,
    expNote,
    'Score = weighted coverage of must-have skills, skill category, title and JD keywords present in the CV text.',
  ].filter(Boolean).join('\n');

  return { score, summary, reasoning };
};

// ── AI scorer (used only for the borderline middle band) ──────────────────────
// Returns { score, summary, reasoning } or null if a non-PDF CV had no text.
// THROWS CvScoreServiceError for transient problems (no credits, rate-limit,
// network, missing key) so the caller can retry later.
const scoreCvAi = async ({ buf, isPdf }, position, cvText) => {
  if (!process.env.ANTHROPIC_API_KEY) throw new CvScoreServiceError('ANTHROPIC_API_KEY missing');

  let content;
  if (isPdf) {
    content = [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buf.toString('base64') } },
      { type: 'text', text: PROMPT(buildJd(position)) },
    ];
  } else {
    const text = (cvText || '').trim();
    if (!text) return null;
    content = [{ type: 'text', text: `Candidate CV:\n\n${text.slice(0, 24000)}\n\n${PROMPT(buildJd(position))}` }];
  }

  let msg;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    msg = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 800,
      tools: [MATCH_TOOL],
      tool_choice: { type: 'tool', name: 'emit_match' },
      messages: [{ role: 'user', content }],
    });
  } catch (e) {
    console.error('scoreCv API error:', e.message);
    throw new CvScoreServiceError(e.message);
  }

  const tool = (msg.content || []).find(b => b.type === 'tool_use');
  if (!tool || !tool.input) throw new CvScoreServiceError('model returned no tool result');
  let score = Math.round(Number(tool.input.score));
  if (isNaN(score)) throw new CvScoreServiceError('model returned a non-numeric score');
  score = Math.max(0, Math.min(100, score));
  return {
    score,
    summary: (tool.input.summary || '').slice(0, 500),
    reasoning: (tool.input.reasoning || '').slice(0, 2000),
  };
};

// Backward-compatible single-shot scorer (fetch → extract → AI). Returns
// { score, summary, reasoning } | null, or throws CvScoreServiceError.
const scoreCv = async (cvUrl, position) => {
  if (!cvUrl) return null;
  const fetched = await fetchCv(cvUrl);
  if (!fetched) return null;
  const cvText = await extractCvText(fetched);
  return scoreCvAi(fetched, position, cvText);
};

const rejectionEmailHtml = (name, position) => `
  <div style="font-family:Arial,sans-serif;color:#333;max-width:560px;margin:auto">
    <p>Dear ${name || 'Candidate'},</p>
    <p>Thank you for applying${position ? ` for the position of <strong>${position}</strong>` : ''} at RecruiterV.</p>
    <p>After reviewing your profile against the job requirements, we're sorry to share that your profile is not up to the mark as per the position's job description for this role.</p>
    <p>We have kept your resume on file and will reach out to you if any suitable position appears with us in the future.</p>
    <p>We wish you the very best in your job search.</p>
    <p style="margin-top:18px">Warm regards,<br/>Team RecruiterV</p>
  </div>`;

// Evaluate one candidate doc, persist result, auto-reject + email when score <= threshold.
// Pass either positionData or it will be fetched from pos_id.
const runMatchEvaluation = async ({ candidateId, candidate, position }) => {
  const cand = candidate || (await db.collection('candidate_db').doc(candidateId).get()).data();
  if (!cand) return { ok: false, reason: 'candidate-not-found' };

  let pos = position;
  if (!pos && cand.pos_id) {
    const ps = await db.collection('admin_AddPos').where('pos_id', '==', cand.pos_id).limit(1).get();
    pos = ps.empty ? {} : ps.docs[0].data();
  }
  pos = pos || {};

  const now = new Date();

  const markUnreadable = async () => {
    try {
      await db.collection('candidate_db').doc(candidateId).update({
        matchEvaluated: true, matchEvaluatedAt: now, matchNote: 'cv-not-readable',
      });
    } catch (e) { console.error('mark-attempted failed:', e.message); }
    return { ok: false, reason: 'no-score' };
  };

  const cvUrl = cand.cv_data || cand.cv_url;
  if (!cvUrl) return markUnreadable();           // no CV → nothing to read

  // ── 1) Fetch + extract once (no AI). Transient failures retry later. ──────
  let fetched, cvText;
  try {
    fetched = await fetchCv(cvUrl);
    if (!fetched) return markUnreadable();        // 404 / unsupported format
    cvText = await extractCvText(fetched);
  } catch (e) {
    if (e instanceof CvScoreServiceError || e.transient) {
      console.error('cv-match transient error (will retry):', e.message);
      return { ok: false, reason: 'service-error', transient: true, message: e.message };
    }
    throw e;
  }

  // ── 2) Deterministic heuristic score (free). ─────────────────────────────
  const heur = heuristicScore(cvText, pos, cand);

  // ── 3) Decide: trust heuristic on clear cases, else ask AI. ──────────────
  let result = null, method = null, confident = false;
  if (heur && (heur.score >= HEUR_PASS || heur.score <= HEUR_REJECT)) {
    result = heur; method = 'heuristic'; confident = true;   // clearly pass / clearly junk → no AI
  } else {
    // Borderline (or JD too sparse to score heuristically) → AI decides.
    let ai = null;
    try {
      ai = await scoreCvAi(fetched, pos, cvText);
    } catch (e) {
      if (e instanceof CvScoreServiceError || e.transient) {
        // AI unavailable (e.g. no credits). Degrade gracefully: keep the
        // heuristic score if we have one (flagged low-confidence), else retry.
        if (heur) { result = heur; method = 'heuristic-fallback'; confident = false; }
        else { console.error('cv-match transient error (will retry):', e.message);
               return { ok: false, reason: 'service-error', transient: true, message: e.message }; }
      } else throw e;
    }
    if (ai) { result = ai; method = 'ai'; confident = true; }
    else if (!result) {                            // AI couldn't read & no heuristic
      if (heur) { result = heur; method = 'heuristic-fallback'; confident = false; }
      else return markUnreadable();
    }
  }

  const update = {
    matchPercent: result.score,
    matchSummary: result.summary,
    matchReasoning: result.reasoning || '',
    matchMethod: method,
    matchEvaluated: true,
    matchEvaluatedAt: now,
    updatedAt: now,
  };

  // Auto-reject on any low score (<= threshold), regardless of how it was
  // scored. statusChangedBy records whether the AI or the keyword heuristic
  // produced the decision.
  let autoRejected = false;
  if (result.score <= MATCH_THRESHOLD) {
    update.statusa = REJECT_STATUS;
    update.statusaDate = now;
    update.statusChangedAt = now;
    update.statusChangedBy = method === 'ai' ? 'ai-screening' : 'auto-screening';
    update.statusChangedByName = method === 'ai' ? 'AI Screening' : 'Auto Screening';
    autoRejected = true;
  }
  await db.collection('candidate_db').doc(candidateId).update(update);

  // Email the candidate on auto-reject
  if (autoRejected) {
    const to = cand.emails || cand.email;
    if (to) {
      try {
        const { renderEmail } = require('./email');
        const _r = await renderEmail('aiAutoReject',
          { candidateName: cand.candidate || cand.name || 'Candidate', position: pos.position || '' },
          { subject: `Update on your application${pos.position ? ` — ${pos.position}` : ''}`, htmlContent: rejectionEmailHtml(cand.candidate || cand.name, pos.position) });
        await sendEmailFull({ to, subject: _r.subject, htmlContent: _r.htmlContent });
      } catch (e) { console.error('rejection email failed:', e.message); }
    }
  }

  return { ok: true, score: result.score, summary: result.summary, method, autoRejected };
};

module.exports = {
  scoreCv, scoreCvAi, heuristicScore, fetchCv, extractCvText,
  runMatchEvaluation, rejectionEmailHtml, REJECT_STATUS,
  MATCH_THRESHOLD, HEUR_PASS, HEUR_REJECT, CvScoreServiceError,
};
