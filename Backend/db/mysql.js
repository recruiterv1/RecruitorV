// Firestore-compatible document store on MySQL/MariaDB.
//
// Implements the slice of the Firestore Admin API this backend uses (collection/doc/where/orderBy/
// limit/offset/select/count/add/set/update/delete/create/getAll/batch/runTransaction, FieldValue,
// Timestamp) so the existing routers and models keep working unchanged. Every document is one row of
// `docs(collection, id, data JSON)`.
//
// Stored value encoding: Timestamp -> {"__t":"ts","v":"<ISO-8601 UTC>"}, DocumentReference -> {"__t":"ref","v":"<path>"}.
// This is the same tagging scripts/migrate/export-firestore.js writes, so the dump imports as-is.
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// ---------- value types ----------
class Timestamp {
  constructor(seconds, nanoseconds) { this._seconds = seconds; this._nanoseconds = nanoseconds; }
  static now() { return Timestamp.fromMillis(Date.now()); }
  static fromMillis(ms) { return new Timestamp(Math.floor(ms / 1000), (((ms % 1000) + 1000) % 1000) * 1e6); }
  static fromDate(d) { return Timestamp.fromMillis(d.getTime()); }
  get seconds() { return this._seconds; }
  get nanoseconds() { return this._nanoseconds; }
  toDate() { return new Date(this.toMillis()); }
  toMillis() { return this._seconds * 1000 + Math.floor(this._nanoseconds / 1e6); }
  isEqual(o) { return !!o && o._seconds === this._seconds && o._nanoseconds === this._nanoseconds; }
  valueOf() { return String(this.toMillis()); }
}

class Sentinel { constructor(kind, arg) { this.kind = kind; this.arg = arg; } }
const FieldValue = {
  serverTimestamp: () => new Sentinel('serverTimestamp'),
  increment: (n) => new Sentinel('increment', n),
  delete: () => new Sentinel('delete'),
  arrayUnion: (...items) => new Sentinel('arrayUnion', items),
  arrayRemove: (...items) => new Sentinel('arrayRemove', items),
};
const FieldPath = { documentId: () => '__name__' };

class DocumentReference {
  constructor(store, collection, id) { this._store = store; this._col = collection; this.id = id; }
  get path() { return `${this._col}/${this.id}`; }
  get parent() { return new CollectionReference(this._store, this._col); }
  get firestore() { return this._store; }
  async get() { return this._store._getDoc(this, this._store._pool); }
  set(data, opts) { return this._store._write([{ type: 'set', ref: this, data, opts }]); }
  update(data) { return this._store._write([{ type: 'update', ref: this, data }]); }
  create(data) { return this._store._write([{ type: 'create', ref: this, data }]); }
  delete() { return this._store._write([{ type: 'delete', ref: this }]); }
  isEqual(o) { return !!o && o.path === this.path; }
}

class DocumentSnapshot {
  constructor(ref, raw) { this.ref = ref; this.id = ref.id; this._raw = raw; this.exists = raw !== undefined; }
  data() { return this.exists ? decode(this.ref._store, JSON.parse(this._raw)) : undefined; }
  get(field) {
    if (!this.exists) return undefined;
    return String(field).split('.').reduce((o, k) => (o == null ? undefined : o[k]), this.data());
  }
}

class QuerySnapshot {
  constructor(query, docs) { this.query = query; this.docs = docs; this.size = docs.length; this.empty = docs.length === 0; }
  forEach(fn, thisArg) { this.docs.forEach(fn, thisArg); }
}

// ---------- encoding ----------
const isPlain = (v) => v && typeof v === 'object' && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const tsToJson = (t) => ({ __t: 'ts', v: t.toDate().toISOString() });

const encode = (v) => {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (v instanceof Timestamp) return tsToJson(v);
  if (v instanceof Date) return tsToJson(Timestamp.fromDate(v));
  if (v instanceof DocumentReference) return { __t: 'ref', v: v.path };
  if (Array.isArray(v)) return v.map((x) => { const e = encode(x); return e === undefined ? null : e; });
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (Buffer.isBuffer(v)) return { __t: 'bytes', v: v.toString('base64') };
  if (typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) { const e = encode(x); if (e !== undefined) out[k] = e; }
    return out;
  }
  return v;
};

const decode = (store, v) => {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map((x) => decode(store, x));
  if (v.__t === 'ts') return Timestamp.fromDate(new Date(v.v));
  if (v.__t === 'ref') { const i = v.v.indexOf('/'); return new DocumentReference(store, v.v.slice(0, i), v.v.slice(i + 1)); }
  if (v.__t === 'bytes') return Buffer.from(v.v, 'base64');
  const out = {};
  for (const k of Object.keys(v)) out[k] = decode(store, v[k]);
  return out;
};

// Resolve write-time sentinels against the current stored value `cur` (encoded form), then encode.
const resolveValue = (val, cur) => {
  if (val instanceof Sentinel) {
    switch (val.kind) {
      case 'serverTimestamp': return tsToJson(Timestamp.now());
      case 'increment': return (typeof cur === 'number' ? cur : 0) + val.arg;
      case 'arrayUnion': {
        const base = Array.isArray(cur) ? cur.slice() : [];
        for (const it of val.arg) { const e = encode(it); if (!base.some((b) => JSON.stringify(b) === JSON.stringify(e))) base.push(e); }
        return base;
      }
      case 'arrayRemove': {
        const rm = val.arg.map((it) => JSON.stringify(encode(it)));
        return (Array.isArray(cur) ? cur : []).filter((b) => !rm.includes(JSON.stringify(b)));
      }
      default: return undefined;
    }
  }
  if (Array.isArray(val)) return val.map((x) => { const r = resolveValue(x, undefined); return r === undefined ? null : r; });
  if (isPlain(val)) {
    const out = {};
    for (const [k, x] of Object.entries(val)) {
      const r = resolveValue(x, cur && typeof cur === 'object' ? cur[k] : undefined);
      if (r !== undefined) out[k] = r;
    }
    return out;
  }
  return encode(val);
};

const buildDoc = (data) => resolveValue(data, undefined) || {};

const deepMerge = (base, patch) => {
  const out = { ...base };
  for (const [k, v] of Object.entries(patch)) out[k] = isPlain(v) && isPlain(out[k]) && !v.__t ? deepMerge(out[k], v) : v;
  return out;
};

// update(): keys may be dotted paths; sentinels resolved against the existing value.
const applyUpdate = (doc, patch) => {
  const out = JSON.parse(JSON.stringify(doc));
  for (const [key, val] of Object.entries(patch)) {
    const parts = key.split('.');
    let o = out;
    for (let i = 0; i < parts.length - 1; i++) { if (!isPlain(o[parts[i]])) o[parts[i]] = {}; o = o[parts[i]]; }
    const last = parts[parts.length - 1];
    if (val instanceof Sentinel && val.kind === 'delete') { delete o[last]; continue; }
    const r = resolveValue(val, o[last]);
    if (r !== undefined) o[last] = r;
  }
  return out;
};

// ---------- query building ----------
const pathOf = (field) => '$.' + String(field).split('.').map((p) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(p) ? p : `"${p.replace(/"/g, '\\"')}"`)).join('.');
const BIN = 'COLLATE utf8mb4_bin';
const isTs = (v) => v instanceof Timestamp || v instanceof Date;
const tsIso = (v) => (v instanceof Timestamp ? v.toDate() : v).toISOString();
const SQL_OPS = { '==': '=', '<': '<', '<=': '<=', '>': '>', '>=': '>=' };

// Hot top-level fields get an indexed virtual column (ix_<field>) so equality / IN
// filters seek instead of scanning every document's JSON. ensureIndexes() builds
// them; IX holds the ones that exist so queries fall back safely when they don't.
const IX_FIELDS = ['email', 'pos_id', 'status', 'recruiterEmail', 'positionId', 'recEmail', 'clientspoc',
  'coachExpertEmail', 'coachEmail', 'vendorEmail', 'role', 'consultingFirmId', 'type', 'source',
  'recruiterId', 'referredBy', 'mob', 'lower', 'client', 'pairKey'];
const IX = new Set();
const ixCol = (field) => (IX.has(field) ? '`ix_' + field + '`' : null);
const ixOk = (v) => typeof v === 'string' && v.length <= 100;

// Returns [sqlFragment, params].
const buildFilter = ({ field, op, value }) => {
  const col = ixCol(field);
  if (col && op === '==' && ixOk(value)) return [`${col} = ?`, [value]];
  if (col && op === 'in' && Array.isArray(value) && value.length && value.every(ixOk)) {
    return [`${col} IN (${value.map(() => '?').join(',')})`, value];
  }
  if (field === '__name__') {
    if (op === 'in') return [`id IN (${value.map(() => '?').join(',') || 'NULL'})`, value.map(String)];
    return [`id ${op === '!=' ? '<>' : SQL_OPS[op] || '='} ?`, [String(value)]];
  }
  const p = pathOf(field);
  const AC = "(JSON_TYPE(JSON_EXTRACT(data, ?)) = 'ARRAY' AND JSON_CONTAINS(JSON_EXTRACT(data, ?), ?))";
  if (op === 'array-contains') return [AC, [p, p, JSON.stringify(encode(value))]];
  if (op === 'array-contains-any') {
    return [`(${value.map(() => AC).join(' OR ') || '0'})`, value.flatMap((x) => [p, p, JSON.stringify(encode(x))])];
  }
  if (op === 'in' || op === 'not-in') {
    const scalar = (x) => (isTs(x) ? tsIso(x) : typeof x === 'boolean' ? (x ? '1' : '0') : String(x));
    const list = value.map(scalar);
    if (!list.length) return [op === 'in' ? '0' : '1', []];
    const target = value.some(isTs) ? p + '.v' : p;
    const frag = `JSON_VALUE(data, ?) ${BIN} ${op === 'in' ? 'IN' : 'NOT IN'} (${list.map(() => '?').join(',')})`;
    return op === 'in' ? [frag, [target, ...list]] : [`JSON_VALUE(data, ?) IS NOT NULL AND ${frag}`, [target, target, ...list]];
  }
  if (value === null) {
    return op === '!='
      ? ["JSON_EXTRACT(data, ?) IS NOT NULL AND JSON_TYPE(JSON_EXTRACT(data, ?)) <> 'NULL'", [p, p]]
      : ["JSON_TYPE(JSON_EXTRACT(data, ?)) = 'NULL'", [p]];
  }
  // JSON true/false come back from JSON_VALUE as '1'/'0', not 'true'/'false', so a
  // boolean can't take the string path below (where('active','==',true) matched nothing).
  if (typeof value === 'boolean') {
    const isBool = "JSON_TYPE(JSON_EXTRACT(data, ?)) = 'BOOLEAN'";
    const want = value ? '1' : '0';
    return op === '!='
      ? [`JSON_VALUE(data, ?) IS NOT NULL AND NOT (${isBool} AND JSON_VALUE(data, ?) = ?)`, [p, p, p, want]]
      : [`${isBool} AND JSON_VALUE(data, ?) = ?`, [p, p, want]];
  }
  if (isTs(value)) return [`JSON_VALUE(data, ?) ${BIN} ${op === '!=' ? '<>' : SQL_OPS[op]} ?`, [p + '.v', tsIso(value)]];
  if (typeof value === 'number') return [`JSON_VALUE(data, ?) IS NOT NULL AND CAST(JSON_VALUE(data, ?) AS DOUBLE) ${op === '!=' ? '<>' : SQL_OPS[op]} ?`, [p, p, value]];
  const v = String(value);
  if (op === '!=') return [`JSON_VALUE(data, ?) IS NOT NULL AND JSON_VALUE(data, ?) ${BIN} <> ?`, [p, p, v]];
  return [`JSON_VALUE(data, ?) ${BIN} ${SQL_OPS[op]} ?`, [p, v]];
};

// orderBy fields in this app hold timestamps or plain strings, which sort correctly as text.
const orderExpr = (field) => { const p = pathOf(field); return [`COALESCE(JSON_VALUE(data, ?), JSON_VALUE(data, ?)) ${BIN}`, [p + '.v', p]]; };

class Query {
  constructor(store, collection, state = {}) {
    this._store = store; this._col = collection;
    this._s = { filters: [], orders: [], limit: null, offset: 0, select: null, ...state };
  }
  _with(patch) { return new Query(this._store, this._col, { ...this._s, ...patch }); }
  where(field, op, value) { return this._with({ filters: [...this._s.filters, { field, op, value }] }); }
  orderBy(field, dir = 'asc') { return this._with({ orders: [...this._s.orders, { field, dir: String(dir).toLowerCase() === 'desc' ? 'DESC' : 'ASC' }] }); }
  limit(n) { return this._with({ limit: n }); }
  offset(n) { return this._with({ offset: n }); }
  select(...fields) { return this._with({ select: fields.flat() }); }

  _sql(count = false) {
    const params = [this._col];
    let where = 'collection = ?';
    for (const f of this._s.filters) { const [frag, ps] = buildFilter(f); where += ` AND (${frag})`; params.push(...ps); }
    for (const o of this._s.orders) { where += ' AND JSON_EXTRACT(data, ?) IS NOT NULL'; params.push(pathOf(o.field)); } // Firestore drops docs lacking an ordered field
    if (count) return [`SELECT COUNT(*) AS n FROM docs WHERE ${where}`, params];
    let sql = `SELECT id, data FROM docs WHERE ${where}`;
    if (this._s.orders.length) {
      const orderParams = [];
      sql += ' ORDER BY ' + this._s.orders.map((o) => { const [e, ps] = orderExpr(o.field); orderParams.push(...ps); return `${e} ${o.dir}`; }).join(', ') + `, id ${this._s.orders[this._s.orders.length - 1].dir}`;
      params.push(...orderParams);
    } else sql += ' ORDER BY id';
    if (this._s.limit != null) { sql += ' LIMIT ?'; params.push(this._s.limit); if (this._s.offset) { sql += ' OFFSET ?'; params.push(this._s.offset); } }
    else if (this._s.offset) { sql += ' LIMIT 18446744073709551615 OFFSET ?'; params.push(this._s.offset); }
    return [sql, params];
  }

  async get(conn = this._store._pool) {
    await this._store._ready;
    const [sql, params] = this._sql();
    const [rows] = await conn.query(sql, params);
    const sel = this._s.select;
    const docs = rows.map((r) => {
      let raw = r.data;
      if (sel) {
        const full = JSON.parse(raw), keep = {};
        for (const f of sel) { const v = String(f).split('.').reduce((o, k) => (o == null ? undefined : o[k]), full); if (v !== undefined) keep[f] = v; }
        raw = JSON.stringify(keep);
      }
      return new DocumentSnapshot(new DocumentReference(this._store, this._col, r.id), raw);
    });
    return new QuerySnapshot(this, docs);
  }

  count() {
    return { get: async () => { await this._store._ready; const [sql, params] = this._sql(true); const [rows] = await this._store._pool.query(sql, params); return { data: () => ({ count: Number(rows[0].n) }) }; } };
  }
}

const autoId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.randomBytes(20), (b) => chars[b % chars.length]).join('');
};

class CollectionReference extends Query {
  constructor(store, name) { super(store, name); this.id = name; this.path = name; }
  doc(id) { return new DocumentReference(this._store, this._col, id === undefined ? autoId() : String(id)); }
  async add(data) { const ref = this.doc(); await ref.create(data); return ref; }
}

// ---------- store ----------
class Store {
  constructor() { this._pool = null; this._ready = null; }

  _init() {
    if (this._pool) return;
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: Number(process.env.MYSQL_POOL) || 10,
      supportBigNumbers: true,
      decimalNumbers: true,
    });
    const rawQuery = pool.query.bind(pool);
    const ready = rawQuery(
      `CREATE TABLE IF NOT EXISTS docs (
         collection VARCHAR(120) NOT NULL,
         id VARCHAR(300) NOT NULL,
         data LONGTEXT NOT NULL,
         PRIMARY KEY (collection, id),
         CHECK (JSON_VALID(data))
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ROW_FORMAT=DYNAMIC`
    ).then(async () => {
      const [cols] = await rawQuery("SELECT COLUMN_NAME c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'docs' AND COLUMN_NAME LIKE 'ix\\_%'");
      for (const r of cols) IX.add(String(r.c).slice(3));
    }).catch((e) => { console.error('MySQL init failed:', e.message); throw e; });
    pool.query = async (...a) => { await ready; return rawQuery(...a); };
    this._pool = pool; this._ready = ready;
  }

  // One-time (idempotent) build of the indexed virtual columns. Run from the
  // import script / add-indexes script, not on app start: it scans the table.
  async ensureIndexes() {
    this._init(); await this._ready;
    const parts = [];
    for (const f of IX_FIELDS) {
      parts.push(`ADD COLUMN IF NOT EXISTS \`ix_${f}\` VARCHAR(191) COLLATE utf8mb4_bin GENERATED ALWAYS AS (LEFT(JSON_VALUE(data, '$.${f}'), 191)) VIRTUAL`);
      parts.push(`ADD INDEX IF NOT EXISTS \`ix_${f}_idx\` (collection, \`ix_${f}\`)`);
    }
    await this._pool.query(`ALTER TABLE docs ${parts.join(', ')}`);
    for (const f of IX_FIELDS) IX.add(f);
  }

  settings() {}
  collection(name) { this._init(); return new CollectionReference(this, name); }
  doc(path) { this._init(); const i = path.indexOf('/'); return new DocumentReference(this, path.slice(0, i), path.slice(i + 1)); }
  batch() {
    this._init();
    const ops = [];
    const b = {
      set(ref, data, opts) { ops.push({ type: 'set', ref, data, opts }); return b; },
      update(ref, data) { ops.push({ type: 'update', ref, data }); return b; },
      create(ref, data) { ops.push({ type: 'create', ref, data }); return b; },
      delete(ref) { ops.push({ type: 'delete', ref }); return b; },
      commit: () => this._write(ops),
    };
    return b;
  }
  async getAll(...refs) { this._init(); return Promise.all(refs.map((r) => r.get())); }
  async listCollections() { this._init(); const [rows] = await this._pool.query('SELECT DISTINCT collection AS c FROM docs ORDER BY c'); return rows.map((r) => this.collection(r.c)); }

  async _getDoc(ref, conn, forUpdate = false) {
    this._init();
    const [rows] = await conn.query(`SELECT data FROM docs WHERE collection = ? AND id = ?${forUpdate ? ' FOR UPDATE' : ''}`, [ref._col, ref.id]);
    return new DocumentSnapshot(ref, rows.length ? rows[0].data : undefined);
  }

  async _applyOp(conn, op) {
    const { ref } = op;
    const current = async () => { const s = await this._getDoc(ref, conn, true); return s.exists ? JSON.parse(s._raw) : undefined; };
    const put = (doc) => conn.query('INSERT INTO docs (collection, id, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)', [ref._col, ref.id, JSON.stringify(doc)]);
    switch (op.type) {
      case 'create': {
        if (await current()) { const e = new Error(`6 ALREADY_EXISTS: Document already exists: ${ref.path}`); e.code = 6; throw e; }
        return put(buildDoc(op.data));
      }
      case 'set': {
        if (op.opts && (op.opts.merge || op.opts.mergeFields)) {
          const cur = (await current()) || {};
          return put(deepMerge(cur, resolveValue(op.data, cur)));
        }
        return put(buildDoc(op.data));
      }
      case 'update': {
        const cur = await current();
        if (!cur) { const e = new Error(`5 NOT_FOUND: No document to update: ${ref.path}`); e.code = 5; throw e; }
        return put(applyUpdate(cur, op.data));
      }
      case 'delete':
        return conn.query('DELETE FROM docs WHERE collection = ? AND id = ?', [ref._col, ref.id]);
      default: throw new Error('unknown op ' + op.type);
    }
  }

  async _write(ops) {
    this._init();
    const plain = ops.length === 1 && (ops[0].type === 'delete' || (ops[0].type === 'set' && !(ops[0].opts && (ops[0].opts.merge || ops[0].opts.mergeFields))));
    if (plain) await this._applyOp(this._pool, ops[0]);   // single statement: no transaction needed
    else await this._tx(async (conn) => { for (const op of ops) await this._applyOp(conn, op); });
    return { writeTime: Timestamp.now() };
  }

  async _tx(fn) {
    this._init();
    await this._ready;
    for (let attempt = 0; ; attempt++) {
      const conn = await this._pool.getConnection();
      try {
        await conn.beginTransaction();
        const result = await fn(conn);
        await conn.commit();
        return result;
      } catch (e) {
        try { await conn.rollback(); } catch (_) { /* ignore */ }
        if ((e.code === 'ER_LOCK_DEADLOCK' || e.code === 'ER_LOCK_WAIT_TIMEOUT') && attempt < 4) { await new Promise((r) => setTimeout(r, 30 * (attempt + 1))); continue; }
        throw e;
      } finally { conn.release(); }
    }
  }

  runTransaction(fn) {
    return this._tx(async (conn) => {
      const ops = [];
      const t = {
        get: (target) => (target instanceof DocumentReference ? this._getDoc(target, conn, true) : target.get(conn)),
        getAll: (...refs) => Promise.all(refs.map((r) => this._getDoc(r, conn, true))),
        set: (ref, data, opts) => { ops.push({ type: 'set', ref, data, opts }); return t; },
        update: (ref, data) => { ops.push({ type: 'update', ref, data }); return t; },
        create: (ref, data) => { ops.push({ type: 'create', ref, data }); return t; },
        delete: (ref) => { ops.push({ type: 'delete', ref }); return t; },
      };
      const result = await fn(t);
      for (const op of ops) await this._applyOp(conn, op);
      return result;
    });
  }

  async close() { if (this._pool) await this._pool.end(); }
}

const db = new Store();
module.exports = { db, Timestamp, FieldValue, FieldPath, DocumentReference, Query, encode, decode };
