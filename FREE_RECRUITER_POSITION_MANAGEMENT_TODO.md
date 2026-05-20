# Free Recruiter Position Management Feature

## Task: Allow free recruiters to leave positions and assign new ones

### Summary
- Free recruiters have a maximum of 4 positions
- Provide "Leave Position" facility in dashboard
- Show "Please upgrade your plan" when limit reached

---

## Implementation Steps

### Step 1: Backend - Update recruiterF.js ✅
- [x] Update `checkPlanLimits` to use maxPositions = 4 for free users

### Step 2: Backend - Update positionAccessF.js ✅
- [x] Add `getRecruiterAssignments(recruiterEmail)` function
- [x] Add `releasePositionAssignment(recruiterEmail, positionId)` function
- [x] Add `getRecruiterAssignmentCount(recruiterEmail)` function

### Step 3: Backend - Update positionAccess router ✅
- [x] Add `GET /api/position-access/my-positions` endpoint
- [x] Add `POST /api/position-access/release/:positionId` endpoint
- [x] Add `GET /api/position-access/recruiter/position-count` endpoint

### Step 4: Backend - Update position router ✅
- [x] Add import for positionAccess
- [x] Update `/pos/assign/:pos_id` to check position count before allowing assignment

### Step 5: Frontend - Update MyAccessRequests.jsx ✅
- [x] Add "Leave Position" button for each assigned position
- [x] Show position count (X/4) for free users
- [x] Add confirmation dialog for leaving position
- [x] Fetch position count from API

### Step 6: Frontend - Update Dash_See.jsx (Optional Enhancement)
- [ ] Update "Assign Me" button to check position count
- [ ] Show "Please upgrade your plan" message when at 4/4 limit

### Step 7: Testing
- [ ] Test position assignment with free user
- [ ] Test leaving position functionality
- [ ] Test upgrade message display
- [ ] Verify position count updates correctly

---

## Files Modified
1. ✅ `Backend/model_fire/recruiterF.js` - Updated maxPositions to 4
2. ✅ `Backend/model_fire/positionAccessF.js` - Added new functions
3. ✅ `Backend/router/positionAccess.js` - Added new endpoints
4. ✅ `Backend/router/position.js` - Added position limit check
5. ✅ `Frontend/src/pages/MyAccessRequests.jsx` - Added position count card and leave functionality

## New Backend Endpoints
- `GET /api/position-access/my-positions` - Get all assigned positions
- `POST /api/position-access/release/:positionId` - Leave a position
- `GET /api/position-access/recruiter/position-count` - Get position count with limits

## Usage Flow
1. Free recruiter navigates to "My Access Requests" page
2. Sees position count card showing (X/4) positions used
3. Can click "Leave Position" on any assigned position to free up a slot
4. When at 4/4, sees message about upgrading plan or leaving position
5. After leaving, can assign new positions

