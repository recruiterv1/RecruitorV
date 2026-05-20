# Position Multi-Recruiter Fix

## Problem
Recruiters cannot assign positions because they are already assigned to other recruiters. The system should allow multiple recruiters to work on the same position with an assign request system to ClientSPOC.

## Solution Overview
1. Remove the exclusive assignment restriction
2. Implement an assign request system where recruiters send requests to ClientSPOC
3. ClientSPOC approves/rejects requests
4. Multiple recruiters can work on the same position after approval

## Files to Modify

### Backend Changes

1. **Backend/router/position.js**
   - Modify `/pos/assign/:pos_id` endpoint to create request instead of blocking
   - Remove exclusive assignment check
   - Create assign request to ClientSPOC

2. **Backend/router/positionAccess.js**
   - Add new endpoint: POST `/api/position-access/assign-request` - Create assign request
   - Add new endpoint: GET `/api/position-access/assign-requests` - Get my assign requests
   - Add new endpoint: PUT `/api/position-access/assign-requests/:requestId/status` - ClientSPOC approve/reject
   - Add new endpoint: GET `/api/position-access/assign-requests/for-clientspoc` - Get requests for ClientSPOC

3. **Backend/model_fire/positionAccessF.js**
   - Add `createAssignRequest()` function
   - Add `getRecruiterAssignRequests()` function
   - Add `getClientSpocAssignRequests()` function
   - Add `updateAssignRequestStatus()` function
   - Add `getPositionAssignees()` function - Get all approved recruiters for a position

4. **Backend/index.js**
   - Mount the new positionAccess router (if not already mounted)

### Frontend Changes

5. **Frontend/src/pages/JobLists.jsx**
   - Change "Assign Position" button to "Request Assignment"
   - Show status of assignment request (pending/approved/rejected)
   - Add modal to confirm assignment request

6. **Frontend/src/pages/MyAccessRequests.jsx**
   - Add section for "Assignment Requests" separate from "Access Requests"
   - Show status of each assignment request
   - Add cancel request option

7. **Frontend/src/pages/ClientSpocMyPositions.jsx**
   - Add "Manage Recruiters" button for each position
   - Show list of recruiters who requested assignment
   - Add approve/reject buttons for each request
   - Show list of approved recruiters

8. **Frontend/src/pages/AssignedPositions.jsx**
   - Update to show positions where recruiter has approved assignment
   - Add visual indicator if assignment is pending/approved

## Database Changes
No schema changes needed - using existing `position_assignments` collection with new `type` field:
- type: "access" | "assign"
- For assign requests: status pending → approved/rejected

## Implementation Steps

### Step 1: Update Backend Model (positionAccessF.js)
- [ ] Add createAssignRequest function
- [ ] Add getRecruiterAssignRequests function  
- [ ] Add getClientSpocAssignRequests function
- [ ] Add updateAssignRequestStatus function
- [ ] Add getPositionAssignees function

### Step 2: Update Backend Router (positionAccess.js)
- [ ] Add POST /assign-request endpoint
- [ ] Add GET /assign-requests endpoint
- [ ] Add PUT /assign-requests/:requestId/status endpoint
- [ ] Add GET /assign-requests/for-clientspoc endpoint

### Step 3: Update Position Router (position.js)
- [ ] Modify /pos/assign/:pos_id to create assign request instead of blocking

### Step 4: Update Frontend - JobLists.jsx
- [ ] Change button to "Request Assignment"
- [ ] Add request status display
- [ ] Add confirmation modal

### Step 5: Update Frontend - MyAccessRequests.jsx
- [ ] Add Assignment Requests section
- [ ] Show request status with colors
- [ ] Add cancel functionality

### Step 6: Update Frontend - ClientSpocMyPositions.jsx
- [ ] Add Manage Recruiters button
- [ ] Show pending requests with approve/reject
- [ ] Show approved recruiters list

### Step 7: Testing
- [ ] Test recruiter requesting assignment
- [ ] Test ClientSPOC approving/rejecting
- [ ] Test multiple recruiters on same position
- [ ] Test notification delivery

## API Endpoints

### New Endpoints

#### POST /api/position-access/assign-request
Request body:
```json
{
  "positionId": "POS001",
  "message": "I would like to work on this position"
}
```

Response:
```json
{
  "success": true,
  "message": "Assignment request sent to ClientSPOC",
  "data": {
    "requestId": "docId",
    "positionId": "POS001",
    "status": "pending"
  }
}
```

#### GET /api/position-access/assign-requests
Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "docId",
      "positionId": "POS001",
      "positionTitle": "Software Engineer",
      "client": "Google",
      "status": "pending", // pending, approved, rejected
      "requestedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### PUT /api/position-access/assign-requests/:requestId/status
Request body:
```json
{
  "status": "approved", // or "rejected"
  "reason": "Optional rejection reason"
}
```

#### GET /api/position-access/assign-requests/for-clientspoc
Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "docId",
      "positionId": "POS001",
      "positionTitle": "Software Engineer",
      "recruiterEmail": "recruiter@email.com",
      "recruiterName": "John Doe",
      "status": "pending",
      "requestedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

## Notifications

### When Recruiter Requests Assignment
- Send notification to ClientSPOC: "Recruiter X requested assignment to Position Y"

### When ClientSPOC Approves/Rejects
- Send notification to Recruiter: "Your request for Position Y has been approved/rejected"

## Rollback Plan
If issues arise, the old assignment system can be restored by:
1. Reverting the position.js changes
2. The position_assignments collection will work with both old and new data

