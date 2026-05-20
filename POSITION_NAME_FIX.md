# Position Name Display Fix

## Date: 2026-01-17

## Issue
Position IDs (e.g., "1090") were being displayed instead of actual position names (e.g., "Senior Software Engineer") in:
1. Candidate Statistics page
2. Dashboard detailed views

## Root Cause
Candidates store only `pos_id` (position ID), not the position name. Position names are stored in the `admin_AddPos` collection with fields:
- `pos_id` - Position ID (e.g., "1090")
- `position` - Position Name (e.g., "Senior Software Engineer")

## Solution
Updated both backend models to fetch position names from `admin_AddPos` collection:

### Files Modified

#### 1. Backend/model_fire/candidateStatsF.js
**Changes:**
- Added `positionsDb` collection reference
- Fetch position names for paginated candidates using `pos_id`
- Map position IDs to names before returning results
- Use batched queries (max 10 per batch due to Firestore 'in' query limit)

**Code:**
```javascript
// Get unique position IDs from paginated candidates
const uniquePositionIds = [...new Set(paginatedCandidates.map(c => c.pos_id).filter(Boolean))];

// Fetch position details from admin_AddPos collection
const positionDetailsMap = {};
if (uniquePositionIds.length > 0) {
  for (let i = 0; i < uniquePositionIds.length; i += 10) {
    const batch = uniquePositionIds.slice(i, i + 10);
    const posSnap = await positionsDb.where("pos_id", "in", batch).get();
    posSnap.docs.forEach(doc => {
      const data = doc.data();
      positionDetailsMap[data.pos_id] = data.position || 'N/A';
    });
  }
}

// Use position name in response
position: positionDetailsMap[c.pos_id] || c.pos_id || 'N/A'
```

#### 2. Backend/model_fire/dashboardStatsF.js
**Changes:**
- Added `positionsDb` collection reference
- Updated `positions` case in `getDetailedRecords` to fetch position names
- Updated `candidates` case in `getDetailedRecords` to fetch position names
- Both use batched queries for efficiency

**Positions Case:**
```javascript
// Get position names from admin_AddPos
const positionIds = positions.slice(offset, offset + limit).map(p => p.positionId);
const positionNamesMap = {};
if (positionIds.length > 0) {
  for (let i = 0; i < positionIds.length; i += 10) {
    const batch = positionIds.slice(i, i + 10);
    const posSnap = await positionsDb.where("pos_id", "in", batch).get();
    posSnap.docs.forEach(doc => {
      const data = doc.data();
      positionNamesMap[data.pos_id] = data.position || 'N/A';
    });
  }
}

// Return position name
name: positionNamesMap[p.positionId] || p.positionId
```

**Candidates Case:**
```javascript
// Get position names for paginated candidates
const candPositionIds = [...new Set(paginatedCandidates.map(c => c.pos_id).filter(Boolean))];
const candPositionNamesMap = {};
if (candPositionIds.length > 0) {
  for (let i = 0; i < candPositionIds.length; i += 10) {
    const batch = candPositionIds.slice(i, i + 10);
    const posSnap = await positionsDb.where("pos_id", "in", batch).get();
    posSnap.docs.forEach(doc => {
      const data = doc.data();
      candPositionNamesMap[data.pos_id] = data.position || 'N/A';
    });
  }
}

// Return position name
position: candPositionNamesMap[c.pos_id] || c.pos_id || 'N/A'
```

## Technical Details

### Firestore Query Limitations
- Firestore `in` queries are limited to 10 items per query
- Solution: Batch queries in groups of 10
- Example: If 25 position IDs, make 3 queries (10 + 10 + 5)

### Performance Optimization
- Only fetch position names for paginated results (not all records)
- Use Map/Object for O(1) lookup after fetching
- Fallback to position ID if name not found

### Data Flow
1. Get candidates/positions with `pos_id`
2. Extract unique `pos_id` values from current page
3. Batch query `admin_AddPos` collection
4. Build mapping: `pos_id` → `position name`
5. Replace `pos_id` with actual name in response

## API Response Changes

### Before
```json
{
  "name": "Akash Nehere",
  "position": "1090",
  "positionId": "1090"
}
```

### After
```json
{
  "name": "Akash Nehere",
  "position": "Senior Software Engineer",
  "positionId": "1090"
}
```

## Testing

### Test Candidate Stats API
```bash
curl "https://api-myh3hnbr6q-uc.a.run.app/candidatestats/all?limit=1"
```

**Expected:** Position field shows actual position name, not ID

### Test Dashboard Positions
```bash
curl "https://api-myh3hnbr6q-uc.a.run.app/dashboardstats/details/positions?limit=5"
```

**Expected:** Position names displayed in records

### Test Dashboard Candidates
```bash
curl "https://api-myh3hnbr6q-uc.a.run.app/dashboardstats/details/candidates?limit=5"
```

**Expected:** Position names displayed for each candidate

## Deployment

```bash
cd Backend
npx firebase deploy --only functions
```

**Estimated Time:** 2-3 minutes

## Benefits

1. **Better UX:** Users see meaningful position names instead of cryptic IDs
2. **Consistency:** Matches how other parts of the system display positions
3. **Maintainability:** Centralized position data in `admin_AddPos` collection
4. **Performance:** Efficient batched queries, only for displayed records

## Fallback Behavior

If position name cannot be found:
- Falls back to displaying position ID
- Never shows empty or null values
- Always shows "N/A" as last resort

## Status

✅ Code Updated
🔄 Deploying to Production
⏳ Testing Pending

---

**Related Files:**
- `Backend/model_fire/candidateStatsF.js`
- `Backend/model_fire/dashboardStatsF.js`
- `Backend/model_fire/recruiterStatsF.js` (reference implementation)
