// What the product currently offers, for the UI to read.
//
// The server is the authority on which capabilities are open; the frontend asks
// rather than deciding for itself, so switching one off reaches every screen
// without a deploy.

const express = require('express');
const { flags } = require('../utils/featureFlags');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const f = await flags();
    res.json({ success: true, features: { coachExpert: f.coachExpert !== false } });
  } catch (e) {
    // Never let this fail a page load; report the product as it was.
    res.json({ success: true, features: { coachExpert: true } });
  }
});

module.exports = router;
