# TODO: Max 10 Active Candidates Per Position Feature

## Plan Summary
Implement a feature where:
- Max 10 active (non-rejected) candidates can be added to a position at once
- When active count reaches 10, position becomes hidden/inactive from open positions
- If position status is NOT "hold" or "closed" and active count drops below 10, position becomes visible again

## Implementation Steps

### Step 1: Backend - Add helper functions in `adminF.js` ✅ COMPLETE
- [x] Add `getActiveCandidateCount(pos_id)` function
- [x] Add `updatePositionVisibility(pos_id)` function
- [x] Add `getAllPosition()` with visibility filtering
- [x] Add `batchUpdateAllPositionsVisibility()` for migration

### Step 2: Backend - Add trigger in `candidateF.js` ✅ COMPLETE
- [x] Modify `createCandidate()` to update position visibility
- [x] Modify `updatePositionStatus()` to update position visibility

### Step 3: Backend - Add API endpoint in `position.js` ✅ COMPLETE
- [x] Add `/pos/refresh-visibility/:pos_id` endpoint
- [x] Add `/pos/batch-refresh-visibility` endpoint

### Step 4: Frontend - Optional UI enhancement in `Dash_Pos.jsx`
- [ ] Add visual indicator for "full" positions (OPTIONAL - not required for core functionality)

## Rejection Statuses
- 'Screen Reject'
- 'L1 Reject'
- 'L2 Reject'
- 'L3 Reject'
- 'HR Reject'
- 'Background Verification Reject'
- 'Negotiation Reject'
- 'Offer Declined'

## Active Statuses (all except rejections)
All other statuses are considered "active" for the purpose of counting.

## Deployment Instructions

### For Initial Migration (run once):
```
POST /candidate/pos/batch-refresh-visibility
```
This will update visibility for all existing positions based on their current active candidate count.

### New Behavior:
1. When a new candidate is added → position visibility is automatically checked
2. When a candidate status changes to/from rejection → position visibility is automatically checked
3. If active count >= 10 and position is NOT hold/closed → position becomes hidden from open positions
4. If position status is changed to hold/closed → position remains visible (exempt from limit)
5. If active count drops below 10 (after rejection) → position becomes visible again

---

## Status: COMPLETE ✅

