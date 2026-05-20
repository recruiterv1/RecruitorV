# TODO: Coach/Expert "Get Help" Button Implementation

## Overview
Implement the complete "Get Help" button functionality for Coach/Expert on position detail page (Dash_See.jsx):
- When clicked, save request to database
- Send automated email to coach/expert
- Show request in coach/expert dashboard

## Tasks

### Step 1: Add backend endpoint to get coach/expert details by name
- [x] Add `GET /get-by-name` endpoint in `Backend/router/coachExpert.js`
- [x] Search both coaches and experts collections by name
- [x] Return coach/expert ID, email, phone, and type

### Step 2: Update Dash_See.jsx - Fix handleGetHelp function
- [x] Fetch coach/expert details by name using new endpoint
- [x] Save request to database using `/api/coach-expert/request/create`
- [x] Send email notification using `/api/coach-expert/send-help-email`
- [x] Show success/error notifications to user
- [x] Added enhanced logging for debugging

### Step 3: Add header, footer, sidebar to request pages
- [x] Update `CoachRequests.jsx` - Add sidebar, header, footer
- [x] Update `ExpertRequests.jsx` - Add sidebar, header, footer
- [x] Update `RecruiterCoachExpertRequests.jsx` - Add sidebar, header, footer

### Step 4: BUG FIX #1 - Wrong Collection Names
- [x] **FIXED**: Backend was searching in wrong Firestore collections
  - Changed from `coach` → `coach_db` (correct collection)
  - Changed from `expert` → `expert_db` (correct collection)
- [x] Added detailed logging for debugging
- [x] Improved error messages with search details

### Step 5: BUG FIX #2 - Duplicate Route Prefix
- [x] **FIXED**: Routes had duplicate `/coach-expert` prefix
  - Router mounted at `/api/coach-expert` 
  - Routes were defined as `/coach-expert/request/create` → resulting in `/api/coach-expert/coach-expert/request/create`
  - Fixed all routes to remove duplicate prefix:
    - `/coach-expert/request/create` → `/request/create`
    - `/coach-expert/requests` → `/requests`
    - `/coach-expert/request/:id/status` → `/request/:id/status`
    - `/coach-expert/request/:id` → `/request/:id`
    - `/coach-expert/request/:id/send-email` → `/request/:id/send-email`
    - `/coach-expert/send-help-email` → `/send-help-email`
    - `/coach-expert/get-by-name` → `/get-by-name`

### Step 6: Test the complete flow
- [ ] Test "Get Help" button click
- [ ] Verify request is saved to database
- [ ] Verify email is logged (backend)
- [ ] Check RecruiterCoachExpertRequests page shows the request
- [ ] Check Coach/Expert can see request in their dashboard

## Files Modified
1. `Backend/router/coachExpert.js` - Added get-by-name endpoint ✓
   - **FIXED #1**: Changed collection names from `coach`/`expert` to `coach_db`/`expert_db`
   - **FIXED #2**: Removed duplicate `/coach-expert` prefix from all routes
2. `Frontend/src/pages/Dash_See.jsx` - Fixed handleGetHelp function ✓
   - Added improved error handling for 404 and 500 status codes
   - Added enhanced logging for debugging
3. `Frontend/src/pages/CoachRequests.jsx` - Added layout (sidebar, header, footer) ✓
4. `Frontend/src/pages/ExpertRequests.jsx` - Added layout (sidebar, header, footer) ✓
5. `Frontend/src/pages/RecruiterCoachExpertRequests.jsx` - Added layout (sidebar, header, footer) ✓

## Files to Test
1. `Frontend/src/pages/RecruiterCoachExpertRequests.jsx` - Recruiter view (with layout)
2. `Frontend/src/components/CoachExpertRequests.jsx` - Coach/Expert view (wrapped in layout)

## Bug Fix Summary

### Bug #1 - Wrong Collection Names
**Issue**: "Get Help" button was showing "Failed to send help request. Please try again."

**Root Cause**: The `get-by-name` endpoint was searching in wrong Firestore collections:
- Coaches were stored in `coach_db` collection but endpoint searched in `coach`
- Experts were stored in `expert_db` collection but endpoint searched in `expert`

**Solution**: Updated endpoint to search in correct collections (`coach_db` and `expert_db`)

### Bug #2 - Duplicate Route Prefix (MAIN ISSUE)
**Issue**: 404 error with "Cannot POST /api/coach-expert/coach-expert/get-by-name"

**Root Cause**: Routes had duplicate `/coach-expert` prefix:
- Router mounted at `/api/coach-expert` in `index.js`
- Routes defined as `/coach-expert/get-by-name` in router
- Resulted in `/api/coach-expert/coach-expert/get-by-name` (404)

**Solution**: Removed duplicate prefix from all routes:
- `/coach-expert/get-by-name` → `/get-by-name`
- `/coach-expert/request/create` → `/request/create`
- `/coach-expert/send-help-email` → `/send-help-email`
- etc.

