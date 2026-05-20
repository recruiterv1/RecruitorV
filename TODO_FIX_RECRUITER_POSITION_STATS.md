# Fix Recruiter Position Stats Error

## Error
```
Error fetching position stats:
Object { message: "Request failed with status code 500", name: "AxiosError", code: "ERR_BAD_RESPONSE", config: {…}, request: XMLHttpRequest, response: {…}, status: 500, stack: "", … }
```
And on backend: `Cannot read properties of undefined (reading 'where')`

## Root Cause (FOUND!)
The `positions` variable was imported from `firebase_ad.js` but that file only exports `{ admin, db }`, NOT `positions`!

```javascript
// In firebase_ad.js - only exports admin and db
module.exports = { admin, db };

// In position.js - trying to import positions (undefined!)
const { db, positions } = require('./firebase_ad');
```

When the code tried to call `positions.where('pos_id', 'in', batch)`, it threw the error because `positions` was `undefined`.

## Fix Applied
1. Removed the undefined `positions` import
2. Created `positionsCollection` using `db.collection("admin_AddPos")` (same collection used in adminF.js)
3. Updated all references from `positions.` to `positionsCollection.`
4. Improved `getCandidateDb()` function with proper error handling

## Files Modified
- `Backend/router/position.js` - Fixed undefined `positions` import

## Status
- [x] Analyzed the issue
- [x] Identified root cause - `positions` was undefined (not exported from firebase_ad.js)
- [x] Applied fix - Created `positionsCollection` using `db.collection("admin_AddPos")`
- [x] Deployed to production

## Code Changes
```javascript
// BEFORE (broken):
const { db, positions } = require('./firebase_ad');  // positions is undefined!

// AFTER (fixed):
const { db } = require('./firebase_ad');
const positionsCollection = db.collection("admin_AddPos");

// Then replace all `positions.where()` with `positionsCollection.where()`
```

