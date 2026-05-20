# Dashboard & Candidate Stats Field Name Fix

## Date: 2026-01-17

## Issues Fixed

### 1. **SPOC Count Showing 0**
**Root Cause:** Code was filtering admin_db records by `company` or `roleCategory === 'Client SPOC'` fields, but SPOCs don't have these fields.

**Solution:** Changed to treat ALL records in `admin_db` collection as SPOCs (matching the working `clientspocStatsF.js` logic).

**Files Modified:**
- `Backend/model_fire/dashboardStatsF.js`

**Changes:**
```javascript
// Before
const clientSpocs = admins.filter(a => a.company || a.roleCategory === 'Client SPOC');

// After
const clientSpocs = admins; // All records in admin_db are SPOCs
```

### 2. **Position Count Showing 0**
**Root Cause:** Code was looking for `c.position` field in candidates, but candidates store position ID in `c.pos_id` field.

**Solution:** Changed to use `c.pos_id` instead of `c.position` for counting unique positions.

**Files Modified:**
- `Backend/model_fire/dashboardStatsF.js`

**Changes:**
```javascript
// Before
const allPositions = [...new Set(candidates.map(c => c.position).filter(Boolean))];

// After
const allPositions = [...new Set(candidates.map(c => c.pos_id).filter(Boolean))];
```

### 3. **Candidate Names Showing "N/A"**
**Root Cause:** Code was using `c.name` field, but candidates store name in `c.candidate` field.

**Solution:** Changed to use `c.candidate || c.name` as fallback.

**Files Modified:**
- `Backend/model_fire/candidateStatsF.js`
- `Backend/model_fire/dashboardStatsF.js`

**Changes:**
```javascript
// Before
name: c.name || 'N/A'

// After
name: c.candidate || c.name || 'N/A'
```

### 4. **Candidate Positions Showing "N/A"**
**Root Cause:** Same as issue #2 - candidates don't have `position` field, they have `pos_id`.

**Solution:** Changed to use `c.pos_id` for position display.

**Files Modified:**
- `Backend/model_fire/candidateStatsF.js`
- `Backend/model_fire/dashboardStatsF.js`

**Changes:**
```javascript
// Before
position: c.position || 'N/A'

// After
position: c.pos_id || 'N/A'
```

## Database Schema Understanding

### Candidate Collection (`candidate_db`)
- **Name Field:** `candidate` (NOT `name`)
- **Position Field:** `pos_id` (NOT `position`) - stores position ID, not position name
- **Phone Field:** `mob`
- **Email Field:** `emails`
- **Status Field:** `statusa`
- **Client Field:** `client`
- **Recruiter Name:** `recName`
- **Recruiter ID:** `recId`

### Admin Collection (`admin_db`)
- **All records are Client SPOCs**
- No `company` or `roleCategory` fields to filter by
- Fields: `name`, `email`, `mobile`/`phone`, `datePosted`

### Recruiter Collection (`recruiter_db`)
- **Role Field:** `roleCategory` ('Recruiter', 'HR', or empty)
- Fields: `name`, `email`, `mobile`, `datePosted`

## Deployment

```bash
cd Backend
npx firebase deploy --only functions
```

## Testing

After deployment, verify:

1. **Dashboard Summary:**
```bash
curl https://api-myh3hnbr6q-uc.a.run.app/dashboardstats/summary
```
Expected: SPOCs = 6, Positions > 0

2. **Candidate Stats:**
```bash
curl "https://api-myh3hnbr6q-uc.a.run.app/candidatestats/all?limit=1"
```
Expected: Candidate names and position IDs showing correctly (not "N/A")

## Status

✅ SPOCs: Fixed (now showing 6)
🔄 Positions: Fixed in code, deploying...
🔄 Candidate Names: Fixed in code, deploying...
🔄 Candidate Positions: Fixed in code, deploying...

## Next Steps

1. Wait for deployment to complete
2. Test all endpoints
3. Verify frontend displays correct data
4. Update documentation if needed
