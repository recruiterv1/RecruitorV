// Drop-in replacement for the slice of the Firebase Storage bucket API the app uses
// (file(path).save / setMetadata / delete), backed by the server's disk so uploads
// work without a Firebase billing plan. Files are served by filesRouter under the
// same /v0/b/<bucket>/o/<path>?alt=media&token=<token> URL shape as Firebase Storage.
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');

const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || (process.env.NODE_ENV === 'production'
  ? path.join(os.homedir(), 'recruiterv-storage')   // outside the deploy dir so redeploys keep uploads
  : path.join(__dirname, '..', '.uploads')));
const BUCKET_NAME = 'local';

const base = () => (process.env.FILES_ORIGIN || process.env.FRONTURL || 'https://www.recruiterv.com').replace(/\/$/, '');

const resolveSafe = (p) => {
  const full = path.resolve(STORAGE_DIR, String(p));
  if (full !== STORAGE_DIR && !full.startsWith(STORAGE_DIR + path.sep)) throw new Error('Invalid storage path');
  return full;
};
const metaPath = (full) => full + '.meta.json';
const readMeta = (full) => { try { return JSON.parse(fs.readFileSync(metaPath(full), 'utf8')); } catch { return {}; } };

const file = (p) => {
  const full = resolveSafe(p);
  return {
    async save(buffer, opts = {}) {
      await fs.promises.mkdir(path.dirname(full), { recursive: true });
      await fs.promises.writeFile(full, buffer);
      const meta = { contentType: opts.contentType || 'application/octet-stream', token: opts.metadata?.metadata?.firebaseStorageDownloadTokens || readMeta(full).token };
      await fs.promises.writeFile(metaPath(full), JSON.stringify(meta));
    },
    async setMetadata(md = {}) {
      const meta = readMeta(full);
      if (md.contentType) meta.contentType = md.contentType;
      if (md.metadata?.firebaseStorageDownloadTokens) meta.token = md.metadata.firebaseStorageDownloadTokens;
      await fs.promises.writeFile(metaPath(full), JSON.stringify(meta));
    },
    async delete() {
      await fs.promises.unlink(full);
      await fs.promises.unlink(metaPath(full)).catch(() => {});
    },
  };
};

const bucket = () => ({ name: BUCKET_NAME, base: base(), file });

const filesRouter = express.Router();
filesRouter.get('/v0/b/:bucket/o/*objectPath', (req, res) => {
  try {
    const p = decodeURIComponent([].concat(req.params.objectPath).join('/'));
    const full = resolveSafe(p);
    const meta = readMeta(full);
    if (!meta.token || meta.token !== req.query.token || !fs.existsSync(full)) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', meta.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    fs.createReadStream(full).pipe(res);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

module.exports = { bucket, filesRouter, STORAGE_DIR };
