// ─────────────────────────────────────────────────────────────────────────────
// RippleHire duplicate-candidate check (server-side, headless).
//
// Why server-side: RippleHire sets `frame-ancestors`, so their page cannot be
// embedded in our modal, and the same-origin policy stops us scripting their
// login form from the browser. Running it on the server is the only way the
// recruiter never sees a login screen. The vendor credentials live in Firebase
// secrets — they are never shipped to the frontend.
//
// How RippleHire actually validates duplicates: /vendor/agency#apply/job/<jobId>
// is a submission form (First/Middle/Last name, Phone, Email, DOB, PAN). You fill
// the identity fields and press "Continue" — that step is where it reports an
// existing/duplicate candidate. So we fill exactly those fields, press Continue
// once, read the verdict, and STOP. We never complete a submission.
//
// Session handling: one shared vendor account must not be re-authenticated on
// every check, so cookies are cached in Firestore and reused until they expire.
//
// Config lives in Firestore `app_config/ripplehire`:
//   { enabled, baseUrl, jobPath, sessionTtlMinutes, duplicateHints:[], selectors:{} }
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULTS = {
  baseUrl: 'https://ltimindtreeapp.ripplehire.com',
  loginPath: '/auth/login',
  jobPath: '/vendor/agency?rv={ts}#apply/job/{jobId}',
  sessionTtlMinutes: 45,
  // Text that indicates the candidate is already in their system.
  duplicateHints: [
    'already', 'duplicate', 'exists', 'previously submitted',
    'cannot be submitted', 'is in process', 'submitted by',
  ],
  selectors: {
    userInput: '#userId, input[name="userId"], #username',
    passInput: '#password, input[type="password"]:not([name="fakepasswordremembered"])',
    submitBtn: '#login_form button[type="submit"], #loginform button[type="submit"], button#loginbtn',
  },
};

const SESSION_DOC = 'ripplehire_session';
const cfgRef = () => require('../router/firebase_ad').db.collection('app_config');

async function getConfig() {
  try {
    const doc = await cfgRef().doc('ripplehire').get();
    const c = doc.exists ? doc.data() : {};
    return { ...DEFAULTS, ...c, selectors: { ...DEFAULTS.selectors, ...(c.selectors || {}) } };
  } catch (_) { return DEFAULTS; }
}

async function getCachedCookies() {
  try {
    const doc = await cfgRef().doc(SESSION_DOC).get();
    if (!doc.exists) return null;
    const d = doc.data();
    const saved = d.savedAt?.toMillis ? d.savedAt.toMillis() : new Date(d.savedAt).getTime();
    if (Date.now() - saved > (d.ttlMinutes || DEFAULTS.sessionTtlMinutes) * 60000) return null;
    return Array.isArray(d.cookies) ? d.cookies : null;
  } catch (_) { return null; }
}

async function saveCookies(cookies, ttlMinutes) {
  try {
    await cfgRef().doc(SESSION_DOC).set(
      { cookies, savedAt: new Date(), ttlMinutes: ttlMinutes || DEFAULTS.sessionTtlMinutes },
      { merge: true });
  } catch (_) { /* non-fatal */ }
}

async function launchBrowser() {
  const puppeteer = require('puppeteer-core');
  let chromium = null;
  try { chromium = require('@sparticuz/chromium'); } catch (_) { /* local dev */ }
  if (chromium) {
    return puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-dev-shm-usage'],
      defaultViewport: { width: 1400, height: 1000 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  return puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1400, height: 1000 },
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
}

async function login(page, cfg) {
  const user = process.env.RIPPLEHIRE_USER;
  const pass = process.env.RIPPLEHIRE_PASS;
  if (!user || !pass) throw new Error('RippleHire credentials are not configured (RIPPLEHIRE_USER / RIPPLEHIRE_PASS).');

  await page.goto(cfg.baseUrl + cfg.loginPath, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForSelector(cfg.selectors.userInput, { timeout: 20000 });
  await page.type(cfg.selectors.userInput, user, { delay: 20 });
  await page.type(cfg.selectors.passInput, pass, { delay: 20 });
  await Promise.all([
    page.click(cfg.selectors.submitBtn).catch(() => page.keyboard.press('Enter')),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {}),
  ]);
  if (/\/auth\/login/i.test(page.url())) throw new Error('RippleHire login failed — check the stored credentials.');
  return page.cookies();
}

// Fill the identity fields by matching their visible labels (First name, Phone No,
// Email ID, PAN Card …). Label-matching survives markup/id changes far better than
// hard-coded selectors, which matters for a form we don't control.
const FILL_IN_PAGE = (data) => {
  const norm = (s) => (s || '').replace(/[\s*:]+/g, ' ').trim().toLowerCase();

  // Every labelled control on the form: [{ label, el }]
  const fields = [];
  document.querySelectorAll('input, select').forEach(el => {
    if (el.type === 'hidden' || el.disabled) return;
    let label = '';
    // 1) explicit <label for>
    if (el.id) { const l = document.querySelector(`label[for="${el.id}"]`); if (l) label = l.innerText; }
    // 2) nearest row/cell text to the left
    if (!label) {
      let node = el.closest('tr, .form-group, .row, div');
      for (let i = 0; node && i < 3 && !label; i++, node = node.parentElement) {
        const txt = (node.innerText || '').split('\n').map(norm).filter(Boolean);
        const hit = txt.find(t => /name|phone|email|birth|pan|day|month|year/.test(t));
        if (hit) label = hit;
      }
    }
    fields.push({ label: norm(label), el, placeholder: norm(el.placeholder) });
  });

  const setVal = (el, value) => {
    const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  };

  const find = (re, kind) => fields.find(f =>
    f.el.tagName.toLowerCase() === (kind || f.el.tagName.toLowerCase()) &&
    (re.test(f.label) || re.test(f.placeholder)));

  const filled = {};
  const put = (key, re, value, kind) => {
    if (!value) return;
    const f = find(re, kind);
    if (f) { setVal(f.el, value); filled[key] = value; }
  };

  put('firstName', /first name/, data.firstName, 'input');
  put('lastName', /last name/, data.lastName, 'input');
  put('phone', /phone/, data.phone, 'input');
  put('email', /email/, data.email, 'input');
  put('pan', /pan/, data.pan, 'input');

  // Date of birth is three selects (Day / Month / Year).
  if (data.dobDay && data.dobMonth && data.dobYear) {
    const selects = fields.filter(f => f.el.tagName.toLowerCase() === 'select');
    const pick = (sel, wanted) => {
      const opts = [...sel.options];
      const w = String(wanted).toLowerCase();
      const o = opts.find(o => o.value.toLowerCase() === w)
        || opts.find(o => o.text.trim().toLowerCase() === w)
        || opts.find(o => o.text.trim().toLowerCase().startsWith(w.slice(0, 3)))
        || opts.find(o => String(parseInt(o.value, 10)) === String(parseInt(wanted, 10)));
      if (o) { sel.value = o.value; sel.dispatchEvent(new Event('change', { bubbles: true })); return true; }
      return false;
    };
    const day = selects.find(s => /day/.test(s.label) || [...s.el.options].some(o => o.text.trim() === 'Day'));
    const mon = selects.find(s => /month/.test(s.label) || [...s.el.options].some(o => o.text.trim() === 'Month'));
    const yr = selects.find(s => /year/.test(s.label) || [...s.el.options].some(o => o.text.trim() === 'Year'));
    if (day && pick(day.el, data.dobDay)) filled.dobDay = data.dobDay;
    if (mon && pick(mon.el, data.dobMonth)) filled.dobMonth = data.dobMonth;
    if (yr && pick(yr.el, data.dobYear)) filled.dobYear = data.dobYear;
  }

  return { filled, fieldCount: fields.length };
};

// Click the form's Continue/Submit button.
const CLICK_CONTINUE = () => {
  const btns = [...document.querySelectorAll('button, input[type="submit"], a.btn')];
  const b = btns.find(x => /continue|submit|next|proceed/i.test(x.innerText || x.value || ''));
  if (b) { b.click(); return true; }
  return false;
};

/**
 * Check a candidate against a RippleHire job.
 * Fills the identity fields, presses Continue once and reads the verdict.
 * @returns {{ ok, duplicate, message, jobId, checkedAt, filled, url }}
 */
async function checkDuplicate({ jobId, email, phone, name, pan, dob }) {
  const cfg = await getConfig();
  if (cfg.enabled === false) return { ok: false, disabled: true, message: 'RippleHire check is disabled.' };
  if (!jobId) return { ok: false, message: 'No RippleHire Job ID is set on this position.' };
  if (!email && !phone && !pan) return { ok: false, message: 'Need an email, phone or PAN to check.' };

  // Split the candidate name and normalise the DOB (accepts YYYY-MM-DD).
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || '';
  const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
  let dobDay = '', dobMonth = '', dobYear = '';
  const m = String(dob || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) { dobYear = m[1]; dobMonth = String(parseInt(m[2], 10)); dobDay = String(parseInt(m[3], 10)); }

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36');

    const cached = await getCachedCookies();
    if (cached) { try { await page.setCookie(...cached); } catch (_) {} }

    const jobUrl = cfg.baseUrl + cfg.jobPath
      .replace('{ts}', String(Date.now()))
      .replace('{jobId}', encodeURIComponent(jobId));

    await page.goto(jobUrl, { waitUntil: 'networkidle2', timeout: 45000 });
    if (/\/auth\/login/i.test(page.url())) {
      const cookies = await login(page, cfg);
      await saveCookies(cookies, cfg.sessionTtlMinutes);
      await page.goto(jobUrl, { waitUntil: 'networkidle2', timeout: 45000 });
    }

    await page.waitForSelector('input', { timeout: 20000 });
    await new Promise(r => setTimeout(r, 1200));   // let their Angular form settle

    const before = await page.evaluate(() => document.body.innerText || '');
    const fill = await page.evaluate(FILL_IN_PAGE, {
      firstName, lastName, phone: phone || '', email: email || '', pan: pan || '',
      dobDay, dobMonth, dobYear,
    });

    if (!fill.filled || Object.keys(fill.filled).length === 0) {
      return {
        ok: false, jobId, url: page.url(),
        message: 'Reached the job page but could not match its form fields. The form layout may have changed.',
      };
    }

    const clicked = await page.evaluate(CLICK_CONTINUE);
    if (!clicked) return { ok: false, jobId, url: page.url(), message: 'Could not find the Continue button.' };

    await new Promise(r => setTimeout(r, 4000));   // wait for their validation
    const after = await page.evaluate(() => document.body.innerText || '');

    // Anything new on the page after Continue is the verdict.
    const added = after.replace(before, '').replace(/\s+/g, ' ').trim();
    const haystack = (added || after).toLowerCase();
    const hint = (cfg.duplicateHints || DEFAULTS.duplicateHints).find(h => haystack.includes(h.toLowerCase()));

    // Pull the sentence containing the hint so the recruiter sees RippleHire's own words.
    let message = '';
    if (hint) {
      const sentences = (added || after).split(/[\n.]/).map(s => s.trim()).filter(Boolean);
      message = sentences.find(s => s.toLowerCase().includes(hint)) || added.slice(0, 300);
    }

    return {
      ok: true, jobId, duplicate: !!hint,
      message: message || (hint ? 'Candidate appears to already exist on this job.' : 'No duplicate reported by RippleHire.'),
      filled: fill.filled, checkedAt: new Date().toISOString(), url: page.url(),
    };
  } catch (e) {
    return { ok: false, jobId, message: e.message };
  } finally {
    if (browser) { try { await browser.close(); } catch (_) {} }
  }
}

module.exports = { checkDuplicate, getConfig };
