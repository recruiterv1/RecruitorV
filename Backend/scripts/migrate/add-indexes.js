// Builds the indexed virtual columns used by db/mysql.js (idempotent).
// Usage: DB_DRIVER=mysql MYSQL_* env set; node scripts/migrate/add-indexes.js
const { db } = require('../../db/mysql');
(async () => {
  const t = Date.now();
  await db.ensureIndexes();
  console.log(`Indexes ready in ${((Date.now() - t) / 1000).toFixed(1)}s`);
  process.exit(0);
})().catch((e) => { console.error('add-indexes failed:', e.message); process.exit(1); });
