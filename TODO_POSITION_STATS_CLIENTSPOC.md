# Position Statistics Feature - ClientSPOC Dashboard

## Overview
This feature allows ClientSPOC users to:
1. View statistics for all their positions including candidate counts
2. See max candidate limits per position
3. Add more candidate slots when a position reaches its limit
4. Manage candidate limits across all their positions

## Implementation Summary

### Backend Changes

#### 1. `Backend/router/position.js`
- Added new endpoint: `PUT /candidate/pos/update-max-candidate/:id`
  - Allows ClientSPOC to increase max candidate limit for a position
  - Requires authentication
  - Validates input and checks permissions

- Added new endpoint: `GET /candidate/pos/clientspoc-stats`
  - Returns positions created by the logged-in ClientSPOC
  - Includes candidate counts and max limits
  - Calculates remaining slots per position

#### 2. `Backend/model_fire/adminF.js`
- Updated `getActiveCandidateCount()` function:
  - Now returns an object with count, maxCandidate, isFull, and remaining
  - Dynamically fetches maxCandidate from position data
  - Falls back to default of 10 if not set

- Updated `updatePositionVisibility()` function:
  - Uses new return format from `getActiveCandidateCount()`
  - Stores maxCandidate in the position document
  - Compares against position-specific maxCandidate instead of hardcoded 10

- Updated `batchUpdateAllPositionsVisibility()` function:
  - Uses new return format from `getActiveCandidateCount()`
  - Updates maxCandidate field for all positions

### Frontend Changes

#### 1. `Frontend/src/pages/ClientSpocPositionStats.jsx` (NEW FILE)
- Complete new page component for Position Statistics
- Displays summary cards showing:
  - Total Positions
  - Total Candidates
  - Max Candidates (combined limit)
  - Remaining Slots
- Table showing all positions with:
  - Position Name
  - Client
  - Current Candidate Count
  - Max Limit
  - Remaining Slots
  - "Add More" button for positions at capacity
- Modal for adding more candidate slots
- Refresh functionality

#### 2. `Frontend/src/App.jsx`
- Added import for `ClientSpocPositionStats`
- Added route: `/clientspoc-position-stats`

#### 3. `Frontend/src/components/Admin.jsx`
- Added import for `ClientSpocPositionStats` and `BarChart3` icon
- Added menu item: "Position Stats" in the sidebar
- Menu order: Dashboard → Candidates → All Positions → My Positions → **Position Stats** → Access Requests → Add Position

## Key Features

### 1. Dynamic Candidate Limits
- Each position can have its own maxCandidate limit
- Default limit is 10 (if not specified)
- ClientSPOC can increase the limit for any position

### 2. Visibility Logic
- Positions are hidden from recruiters' dashboard when they reach capacity
- "At capacity" means: candidate count >= maxCandidate AND position is not on hold/closed
- Positions on hold/closed are excluded from the visibility check

### 3. Rejection Statuses (Not Counted)
Candidates with the following statuses are NOT counted towards the active candidate limit:
- Screen Reject
- L1 Reject
- L2 Reject
- L3 Reject
- HR Reject
- Background Verification Reject
- Negotiation Reject
- Offer Declined

## API Endpoints

### GET /candidate/pos/clientspoc-stats
**Description:** Get position statistics for the logged-in ClientSPOC

**Response:**
```json
{
  "success": true,
  "positions": [
    {
      "id": "doc_id",
      "pos_id": "1001",
      "position": "Java Developer",
      "client": "TCS",
      "hr_name": "John Doe",
      "candidateCount": 8,
      "maxCandidate": 10,
      "remaining": 2,
      "isFull": false
    }
  ],
  "summary": {
    "totalPositions": 5,
    "totalCandidates": 42,
    "totalMaxCandidates": 50,
    "totalRemaining": 8
  }
}
```

### PUT /candidate/pos/update-max-candidate/:id
**Description:** Increase max candidate limit for a position

**Request Body:**
```json
{
  "additionalCandidates": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Max candidate count updated from 10 to 15",
  "data": {
    "id": "doc_id",
    "pos_id": "1001",
    "position": "Java Developer",
    "client": "TCS",
    "maxCandidate": 15,
    "additionalAdded": 5
  }
}
```

## Deployment Steps

### 1. Backend Deployment
- Deploy the updated `Backend/router/position.js`
- Deploy the updated `Backend/model_fire/adminF.js`

### 2. Frontend Deployment
- The new page `ClientSpocPositionStats.jsx` will be automatically included
- Route is already configured in `App.jsx`
- Menu item is already configured in `Admin.jsx`

### 3. Database Migration (Optional)
To update existing positions with maxCandidate field, you can either:
- Run a batch script to update all positions
- The system will dynamically fetch maxCandidate from position data
- If maxCandidate is not set, it defaults to 10

## Testing Checklist
- [x] Verify position statistics load correctly for ClientSPOC user
- [x] Check that summary cards show correct totals
- [x] Verify table displays all positions created by the user
- [x] Test "Add More" button functionality
- [x] Verify position limit increases after adding more candidates
- [x] Check that positions are hidden from recruiters when at capacity
- [x] Verify rejected candidates are not counted
- [x] Test refresh functionality

## Related Files Modified
- `Backend/router/position.js`
- `Backend/model_fire/adminF.js`
- `Frontend/src/App.jsx`
- `Frontend/src/components/Admin.jsx`
- `Frontend/src/pages/ClientSpocPositionStats.jsx` (NEW)

## Implementation Status: ✅ COMPLETED
All changes have been implemented and are ready for deployment.

