/**
 * AI Report Generator (SuperAdmin only).
 *
 * SuperAdmin types a natural-language request; Claude converts it into a
 * VALIDATED JSON query plan (dataset + filters + columns + sort + limit) — never
 * executable code. The plan is validated against a whitelist of datasets/fields
 * and executed against Firestore in memory. The frontend renders a table and
 * exports to Excel.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Anthropic = require('@anthropic-ai/sdk');

const { db } = require('./firebase_ad');
const adminVerify = require('../model_fire/adminCF');
const recruiterF = require('../model_fire/recruiterF');
const adminModel = require('../model_fire/adminF');

// ── SuperAdmin auth ────────────────────────────────────────────────────────
const superAdminAuth = async (req, res, next) => {
  const token = req.cookies.__session;
  if (!token) return res.status(401).json({ success: false, message: 'No session' });
  try {
    const decoded = jwt.verify(token, process.env.SECKEY);
    const result = await adminVerify.checkData(decoded.email);
    let isSuper = false;
    if (result.success) {
      const a = result.admin || {};
      isSuper = a.role === 'Super Admin' || a.roleCategory === 'SuperAdmin';
    }
    if (!isSuper) {
      const rec = await recruiterF.findRecruiterByEmail(decoded.email);
      if (rec && (rec.role === 'Super Admin' || rec.roleCategory === 'SuperAdmin')) isSuper = true;
    }
    if (!isSuper) return res.status(403).json({ success: false, message: 'Super admin access required' });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────
const toDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (v._seconds !== undefined) return new Date(v._seconds * 1000);
  if (v.toDate) { try { return v.toDate(); } catch { /* ignore */ } }
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};
const fmtDate = (d) => d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const lc = (s) => (s == null ? '' : String(s)).toLowerCase();

// Cache collection maps within a single request
const loadAll = async (col) => (await db.collection(col).get()).docs.map(d => ({ _id: d.id, ...d.data() }));

const REJECTION = adminModel.REJECTION_STATUSES || [];
const INITIAL_CAND_STATUSES = ['Submitted', 'Applied'];

// ── Dataset registry ───────────────────────────────────────────────────────
// Each dataset: { label, collection, dateFields, columns: [labels], build(ctx) -> rows }
// `build` returns an array of plain objects keyed by the column label.
const buildContext = async (needs) => {
  const ctx = {};
  if (needs.positions || needs.spocs) {
    const posDocs = await loadAll('admin_AddPos');
    ctx.posMap = {};
    posDocs.forEach(p => { if (p.pos_id) ctx.posMap[p.pos_id] = p; });
    ctx.positions = posDocs;
  }
  if (needs.spocs) {
    const spocDocs = await loadAll('admin_db');
    ctx.spocMap = {};
    spocDocs.forEach(s => { if (s.email) ctx.spocMap[lc(s.email)] = s; });
    ctx.spocs = spocDocs;
  }
  if (needs.recruiters) {
    const recDocs = await loadAll('recruiter_db');
    ctx.recMap = {};
    recDocs.forEach(r => { if (r.email) ctx.recMap[lc(r.email)] = r; });
    ctx.recruiters = recDocs;
  }
  return ctx;
};

const DATASETS = {
  candidates: {
    label: 'Candidates',
    description: 'Every candidate submitted by recruiters, joined with their position and ClientSPOC.',
    columns: ['Candidate', 'Recruiter Name', 'Recruiter Email', 'Position ID', 'Position Name', 'Client', 'Candidate Status', 'Position Status', 'ClientSPOC', 'Submitted On', 'Status Changed On', 'Changed By'],
    dateFields: ['Submitted On', 'Status Changed On'],
    needs: { positions: true, spocs: true, recruiters: true },
    build: async (ctx) => {
      const cands = await loadAll('candidate_db');
      return cands.map(c => {
        const pos = ctx.posMap[c.pos_id] || {};
        const status = c.statusa || 'Submitted';
        let changedBy = c.statusChangedByName || c.statusChangedBy || '';
        if (!changedBy && !INITIAL_CAND_STATUSES.includes(status)) {
          const spoc = ctx.spocMap[lc(pos.clientspoc)];
          changedBy = (spoc && spoc.name) || pos.clientspoc || '';
        }
        const rec = ctx.recMap[lc(c.recEmail)];
        return {
          'Candidate': c.candidate || c.name || '',
          'Recruiter Name': c.recName || (rec && rec.name) || '',
          'Recruiter Email': c.recEmail || '',
          'Position ID': c.pos_id || '',
          'Position Name': pos.position || c.pos_name || '',
          'Client': pos.client || c.client || '',
          'Candidate Status': status,
          'Position Status': lc(pos.status) === 'paused' ? 'Paused' : 'Active',
          'ClientSPOC': (ctx.spocMap[lc(pos.clientspoc)] && ctx.spocMap[lc(pos.clientspoc)].name) || pos.clientspoc || '',
          'Submitted On': toDate(c.datePosted),
          'Status Changed On': toDate(c.statusChangedAt || c.statusaDate || c.updatedAt),
          'Changed By': changedBy,
        };
      });
    },
  },

  positions: {
    label: 'Positions',
    description: 'All positions created in the system.',
    columns: ['Position ID', 'Position Name', 'Client', 'Status', 'Commission %', 'CTC Start', 'CTC End', 'Location', 'Experience', 'Category', 'ClientSPOC', 'Posted On', 'Max Candidates'],
    dateFields: ['Posted On'],
    needs: { spocs: true },
    build: async (ctx) => {
      const positions = ctx.positions || await loadAll('admin_AddPos');
      return positions.map(p => ({
        'Position ID': p.pos_id || '',
        'Position Name': p.position || '',
        'Client': p.client || '',
        'Status': lc(p.status) === 'paused' ? 'Paused' : 'Active',
        'Commission %': p.commison ?? '',
        'CTC Start': p.ctcStart ?? '',
        'CTC End': p.ctcEnd ?? '',
        'Location': Array.isArray(p.location) ? p.location.join(', ') : (p.location || ''),
        'Experience': p.experience || '',
        'Category': p.pos_cat || '',
        'ClientSPOC': (ctx.spocMap[lc(p.clientspoc)] && ctx.spocMap[lc(p.clientspoc)].name) || p.clientspoc || '',
        'Posted On': toDate(p.datePosted),
        'Max Candidates': p.maxCandidate ?? '',
      }));
    },
  },

  recruiters: {
    label: 'Recruiters',
    description: 'All recruiter accounts.',
    columns: ['Name', 'Email', 'Plan', 'Max Positions', 'Phone', 'Registered On', 'Role'],
    dateFields: ['Registered On'],
    needs: {},
    build: async () => {
      const recs = await loadAll('recruiter_db');
      return recs.map(r => ({
        'Name': r.name || r.firstName || '',
        'Email': r.email || '',
        'Plan': r.planType === 0 ? 'Free' : 'Paid',
        'Max Positions': r.maxPositions ?? '',
        'Phone': r.phone || r.mobile || '',
        'Registered On': toDate(r.registrationDate || r.createdAt),
        'Role': r.roleCategory || r.role || 'Recruiter',
      }));
    },
  },

  clientspocs: {
    label: 'ClientSPOCs',
    description: 'ClientSPOC / admin accounts.',
    columns: ['Name', 'Email', 'Role'],
    dateFields: [],
    needs: {},
    build: async () => {
      const docs = await loadAll('admin_db');
      return docs.map(s => ({
        'Name': s.name || '',
        'Email': s.email || '',
        'Role': s.roleCategory || s.role || 'ClientSPOC',
      }));
    },
  },

  accessRequests: {
    label: 'Access / Assign Requests',
    description: 'Recruiter access/assign requests for positions (status: pending/approved/rejected/released).',
    columns: ['Recruiter Email', 'Position ID', 'Position Name', 'Type', 'Status', 'Requested On', 'Released On'],
    dateFields: ['Requested On', 'Released On'],
    needs: { positions: true },
    build: async (ctx) => {
      const reqs = await loadAll('position_access_requests');
      return reqs.map(r => {
        const pos = ctx.posMap[r.positionId] || {};
        return {
          'Recruiter Email': r.recruiterEmail || '',
          'Position ID': r.positionId || '',
          'Position Name': pos.position || r.positionTitle || '',
          'Type': r.type || 'access',
          'Status': r.status || '',
          'Requested On': toDate(r.requestedAt),
          'Released On': toDate(r.releasedAt),
        };
      });
    },
  },

  coachAssignments: {
    label: 'Coach → Recruiter Assignments',
    description: 'Positions a coach assigned to a recruiter (status: pending/accepted/rejected).',
    columns: ['Coach Email', 'Recruiter Email', 'Position ID', 'Position Title', 'Client', 'Status', 'Created On'],
    dateFields: ['Created On'],
    needs: {},
    build: async () => {
      const docs = await loadAll('coach_recruiter_assignments');
      return docs.map(a => ({
        'Coach Email': a.coachEmail || '',
        'Recruiter Email': a.recruiterEmail || '',
        'Position ID': a.positionId || '',
        'Position Title': a.positionTitle || '',
        'Client': a.client || '',
        'Status': a.status || '',
        'Created On': toDate(a.createdAt),
      }));
    },
  },
};

// ── Filter application ─────────────────────────────────────────────────────
const applyFilter = (row, f) => {
  const raw = row[f.field];
  const op = f.op;
  const val = f.value;
  if (op === 'exists') return raw !== '' && raw != null;
  if (op === 'notExists') return raw === '' || raw == null;

  // Date operators
  if (['dateEq', 'dateBefore', 'dateAfter', 'dateOnOrBefore', 'dateOnOrAfter'].includes(op)) {
    const a = raw instanceof Date ? raw : toDate(raw);
    const b = toDate(val);
    if (!a || !b) return false;
    if (op === 'dateEq') return sameDay(a, b);
    if (op === 'dateBefore') return a < b;
    if (op === 'dateAfter') return a > b;
    if (op === 'dateOnOrBefore') return a <= b || sameDay(a, b);
    if (op === 'dateOnOrAfter') return a >= b || sameDay(a, b);
  }

  const rs = raw instanceof Date ? fmtDate(raw) : raw;
  if (op === 'eq') return lc(rs) === lc(val);
  if (op === 'ne') return lc(rs) !== lc(val);
  if (op === 'contains') return lc(rs).includes(lc(val));
  if (op === 'in') return Array.isArray(val) && val.map(lc).includes(lc(rs));
  const numA = Number(rs), numB = Number(val);
  if (op === 'gt') return numA > numB;
  if (op === 'gte') return numA >= numB;
  if (op === 'lt') return numA < numB;
  if (op === 'lte') return numA <= numB;
  return true;
};

// ── Claude planner ─────────────────────────────────────────────────────────
const PLAN_TOOL = {
  name: 'emit_report_plan',
  description: 'Emit the structured query plan for the requested report.',
  input_schema: {
    type: 'object',
    properties: {
      dataset: { type: 'string', enum: Object.keys(DATASETS), description: 'Which dataset to report on.' },
      filters: {
        type: 'array',
        description: 'Conditions a row must satisfy (ANDed together).',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string', description: 'A column label from the chosen dataset.' },
            op: { type: 'string', enum: ['eq', 'ne', 'contains', 'in', 'gt', 'gte', 'lt', 'lte', 'dateEq', 'dateBefore', 'dateAfter', 'dateOnOrBefore', 'dateOnOrAfter', 'exists', 'notExists'] },
            value: { description: 'Comparison value. For date ops use an ISO date like 2026-06-20. For "in" use an array.' },
          },
          required: ['field', 'op'],
        },
      },
      columns: { type: 'array', items: { type: 'string' }, description: 'Column labels to include (subset of the dataset). Omit for all columns.' },
      sort: {
        type: 'object',
        properties: { field: { type: 'string' }, dir: { type: 'string', enum: ['asc', 'desc'] } },
      },
      limit: { type: 'integer', description: 'Max rows to return.' },
    },
    required: ['dataset'],
  },
};

const buildSystemPrompt = () => {
  const lines = ['You convert a natural-language reporting request into a structured query plan by calling the emit_report_plan tool.', '', 'Available datasets and their column labels:'];
  for (const [key, ds] of Object.entries(DATASETS)) {
    lines.push(`- ${key} (${ds.label}): ${ds.description}`);
    lines.push(`  Columns: ${ds.columns.join(', ')}`);
  }
  lines.push('');
  lines.push('Rules: choose exactly one dataset. Use ONLY the column labels listed for that dataset in filters, columns, and sort. For date filtering use the date* operators with ISO dates (today is ' + new Date().toISOString().slice(0, 10) + '). If the user asks for "active"/"paused" use the Status/Position Status column. Pick a sensible set of columns if the user does not specify. Always call the tool.');
  return lines.join('\n');
};

// ── Route ──────────────────────────────────────────────────────────────────
router.post('/generate', superAdminAuth, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI reporting is not configured (missing API key).' });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: buildSystemPrompt(),
      tools: [PLAN_TOOL],
      tool_choice: { type: 'tool', name: 'emit_report_plan' },
      messages: [{ role: 'user', content: query }],
    });

    const toolBlock = (message.content || []).find(b => b.type === 'tool_use');
    if (!toolBlock) {
      return res.status(422).json({ success: false, message: 'Could not interpret the query. Please rephrase.' });
    }
    const plan = toolBlock.input || {};

    // Validate plan
    const ds = DATASETS[plan.dataset];
    if (!ds) return res.status(422).json({ success: false, message: `Unknown dataset: ${plan.dataset}` });
    const validCols = new Set(ds.columns);
    const filters = Array.isArray(plan.filters) ? plan.filters.filter(f => f && validCols.has(f.field)) : [];
    let columns = Array.isArray(plan.columns) && plan.columns.length
      ? plan.columns.filter(c => validCols.has(c))
      : ds.columns.slice();
    if (!columns.length) columns = ds.columns.slice();

    // Build + filter
    const ctx = await buildContext(ds.needs || {});
    let rows = await ds.build(ctx);
    if (filters.length) rows = rows.filter(r => filters.every(f => applyFilter(r, f)));

    // Sort
    if (plan.sort && plan.sort.field && validCols.has(plan.sort.field)) {
      const sf = plan.sort.field;
      const dir = plan.sort.dir === 'asc' ? 1 : -1;
      rows.sort((a, b) => {
        let av = a[sf], bv = b[sf];
        if (av instanceof Date || bv instanceof Date) { av = av ? av.getTime() : 0; bv = bv ? bv.getTime() : 0; }
        else if (!isNaN(Number(av)) && !isNaN(Number(bv)) && av !== '' && bv !== '') { av = Number(av); bv = Number(bv); }
        else { av = lc(av); bv = lc(bv); }
        return av < bv ? -1 * dir : av > bv ? 1 * dir : 0;
      });
    }

    const total = rows.length;
    if (plan.limit && Number.isInteger(plan.limit) && plan.limit > 0) rows = rows.slice(0, plan.limit);

    // Serialize (Date -> string), select columns
    const data = rows.map(r => {
      const out = {};
      columns.forEach(c => { out[c] = r[c] instanceof Date ? fmtDate(r[c]) : (r[c] ?? ''); });
      return out;
    });

    return res.json({
      success: true,
      columns,
      rows: data,
      total,
      returned: data.length,
      plan: { dataset: plan.dataset, datasetLabel: ds.label, filters, sort: plan.sort || null, limit: plan.limit || null },
    });
  } catch (err) {
    console.error('AI report error:', err);
    const msg = err && err.status === 401 ? 'AI service authentication failed (check API key).' : (err.message || 'Failed to generate report');
    return res.status(500).json({ success: false, message: msg });
  }
});

// Expose dataset metadata for the UI (hints/examples)
router.get('/datasets', superAdminAuth, (req, res) => {
  const datasets = Object.entries(DATASETS).map(([key, ds]) => ({ key, label: ds.label, description: ds.description, columns: ds.columns }));
  res.json({ success: true, datasets });
});

module.exports = router;
