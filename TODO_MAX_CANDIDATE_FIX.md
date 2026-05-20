# Max Candidate Limit Visibility Fix

## Issue
In the Recruiter Dashboard's Open Positions, even if `maxCandidate` is set to more than 10, the position is not visible. This is because the visibility filtering logic uses a hardcoded value of 10 instead of the actual `maxCandidate` setting.

## Root Cause
In `Backend/model_fire/adminF.js`, the visibility filtering logic in two functions used a hardcoded value of 10:
- `getAllPosition()` 
- `getPositionsByClientSPOCWithVisibility()`

The code was checking `activeCandidateCount >= 10` instead of checking against the position's `maxCandidate` value.

## Fix Applied
Changed the hardcoded comparison to use the dynamic `maxCandidate` value:

**Before:**
```javascript
if (!isOnHoldOrClosed && (pos.activeCandidateCount || 0) >= 10) {
  return false; // Hides position
}
```

**After:**
```javascript
const maxCandidateLimit = pos.maxCandidate || 10;
if (!isOnHoldOrClosed && (pos.activeCandidateCount || 0) >= maxCandidateLimit) {
  return false; // Hides position only when it reaches actual maxCandidate limit
}
```

## Files Modified
- `Backend/model_fire/adminF.js` - Lines ~667-672 and ~716-721

## Impact
- Positions with `maxCandidate > 10` will now remain visible until they reach their actual limit
- For example, a position with `maxCandidate = 15` will stay visible until it has 15 active candidates
- Previously, it was being hidden at 10 candidates regardless of the maxCandidate setting

## Next Steps
1. Deploy the backend changes
2. Consider running `batchUpdateAllPositionsVisibility()` to refresh position visibility states
3. Test positions with various maxCandidate settings (10, 15, 20, etc.)

