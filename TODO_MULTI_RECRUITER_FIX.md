# Multi-Recruiter Position Assignment Fix - Progress Tracker

## Overview
Allow multiple recruiters to work on the same position with an assign request system to ClientSPOC.

## Backend Changes ✅ COMPLETED

### 1. Backend/model_fire/positionAccessF.js ✅
- [x] Added `createAssignRequest()` - Create assignment request with type="assign"
- [x] Added `getRecruiterAssignRequests()` - Get recruiter's assign requests
- [x] Added `getClientSpocAssignRequests()` - Get requests for ClientSPOC
- [x] Added `updateAssignRequestStatus()` - Approve/reject requests
- [x] Added `getPositionAssignees()` - Get approved recruiters for a position
- [x] Added `cancelAssignRequest()` - Cancel pending request
- [x] Added `canRecruiterSubmitForPosition()` - Check if recruiter can submit

### 2. Backend/router/positionAccess.js ✅
- [x] Added POST `/assign-request` - Create new assign request
- [x] Added GET `/assign-requests` - Get recruiter's assign requests
- [x] Added PUT `/assign-requests/:requestId/status` - ClientSPOC approve/reject
- [x] Added GET `/assign-requests/for-clientspoc` - Get requests for ClientSPOC
- [x] Added DELETE `/assign-requests/:requestId/cancel` - Cancel request
- [x] Added GET `/assign-requests/position/:positionId/assignees` - Get assignees
- [x] Added GET `/can-submit/:positionId` - Check submission access

### 3. Backend/model_fire/notificationF.js ✅
- [x] Added notification types: ASSIGN_REQUEST_RECEIVED, ASSIGN_REQUEST_APPROVED, ASSIGN_REQUEST_REJECTED
- [x] Added `notifyClientSpocAssignRequestReceived()` - Notify ClientSPOC of new request
- [x] Added `notifyRecruiterAssignRequestStatus()` - Notify recruiter of approval/rejection

### 4. Backend/router/position.js ✅
- [x] Modified POST `/pos/assign/:pos_id` to create assign request instead of blocking
- [x] Removed exclusive assignment check (was blocking if assigned to someone else)
- [x] Added message parameter support
- [x] Updated GET `/pos/assign/check/:pos_id` to use new access check
- [x] Updated GET `/pos/assign/my-assignments` to return approved assignments

## Frontend Changes - IN PROGRESS

### 5. Frontend/src/pages/JobLists.jsx
- [ ] Change "Assign Position" button to "Request Assignment"
- [ ] Add request status display (pending/approved/rejected)
- [ ] Add confirmation modal with optional message
- [ ] Show feedback after request submission

### 6. Frontend/src/pages/MyAccessRequests.jsx
- [ ] Add "Assignment Requests" section
- [ ] Show request status with color coding
- [ ] Add cancel button for pending requests
- [ ] Show expiration date for approved requests

### 7. Frontend/src/pages/ClientSpocMyPositions.jsx
- [ ] Add "Manage Recruiters" button for each position
- [ ] Show pending requests list with approve/reject buttons
- [ ] Show approved recruiters list with remove option
- [ ] Add notification badge for pending requests

### 8. Frontend/src/pages/AssignedPositions.jsx
- [ ] Update to show positions where recruiter has approved assignment
- [ ] Add visual indicator for pending requests
- [ ] Show expiration warnings for expiring assignments

## Testing Plan

### Backend Testing
- [ ] Test creating assign request for a position
- [ ] Test auto-approval when recruiter is position owner
- [ ] Test approval/rejection by ClientSPOC
- [ ] Test multiple recruiters can request same position
- [ ] Test notifications are sent correctly
- [ ] Test position limits for free/paid plans

### Frontend Testing
- [ ] Test recruiter can request assignment
- [ ] Test request status display updates
- [ ] Test ClientSPOC can approve/reject requests
- [ ] Test notifications are received

## API Endpoints Summary

### New Endpoints
```
POST /api/position-access/assign-request        - Create assign request
GET /api/position-access/assign-requests         - Get recruiter's requests
PUT /api/position-access/assign-requests/:id/status  - Approve/reject
GET /api/position-access/assign-requests/for-clientspoc  - Get SPOC requests
DELETE /api/position-access/assign-requests/:id/cancel - Cancel request
GET /api/position-access/assign-requests/position/:pos_id/assignees - Get assignees
GET /api/position-access/can-submit/:positionId - Check submission access
```

### Modified Endpoints
```
POST /candidate/pos/assign/:pos_id   - Now creates assign request
GET /candidate/pos/assign/check/:pos_id  - Returns access status
GET /candidate/pos/assign/my-assignments  - Returns approved assignments
```

## Rollback Instructions
If issues arise, the changes can be rolled back by:
1. Reverting position.js changes to restore the exclusive assignment system
2. The position_assignments collection will work with both old and new data

