# Position Access Request System for Free Recruiters (planType = 0)

## 📋 Requirements Summary

### For Recruiters (planType = 0):
1. Can select up to 2 positions at a time to request access
2. Maximum 4 positions total (lifetime during 30-day free period)
3. "Submit Candidate" button replaced with "Request Access" button
4. Once 2 positions are approved, cannot request more until one is closed
5. 30-day time limit for free plan

### For ClientSPOC:
1. New page to view access requests from recruiters
2. Two dropdown options: "Approved" and "Waitlist"
3. Recruiters can only work on approved positions
4. Can manage which recruiters have access to their positions

---

## 🗄️ Database Schema

### New Collection: `position_access_requests`
```javascript
{
  requestId: "REQ_001",
  recruiterId: "recruiter@email.com",
  recruiterName: "John Doe",
  positionId: "1234",
  positionTitle: "Senior Developer",
  clientspoc: "clientspoc@email.com",
  status: "pending" | "approved" | "waitlist" | "rejected",
  requestedAt: Timestamp,
  respondedAt: Timestamp,
  respondedBy: "clientspoc@email.com",
  expiresAt: Timestamp // 30 days from approval
}
```

### Update `recruiter_db` Collection:
```javascript
{
  // Existing fields...
  planType: 0 | 1,
  planExpiryDate: Timestamp,
  maxPositions: 2, // For free users
  
  // New fields:
  positionAccessStats: {
    totalRequested: 0, // Max 4
    currentlyApproved: 0, // Max 2
    totalApproved: 0,
    totalRejected: 0
  }
}
```

---

## 🔧 Backend Implementation

### 1. New Model: `Backend/model_fire/positionAccessF.js`
```javascript
// Functions:
- createAccessRequest(recruiterId, positionId)
- getRecruiterRequests(recruiterId)
- getClientSpocRequests(clientspocEmail)
- updateRequestStatus(requestId, status, clientspocEmail)
- checkRecruiterAccess(recruiterId, positionId)
- getRecruiterAccessStats(recruiterId)
- closePosition(requestId) // When position is filled
```

### 2. New Router: `Backend/router/positionAccess.js`
```javascript
// Endpoints:
POST   /api/position-access/request
GET    /api/position-access/recruiter/:recruiterId
GET    /api/position-access/clientspoc
PUT    /api/position-access/:requestId/status
GET    /api/position-access/check/:positionId
DELETE /api/position-access/:requestId/close
```

### 3. Update Existing Files:
- `Backend/model_fire/recruiterF.js` - Add access stats tracking
- `Backend/router/candidate.js` - Check access before allowing candidate submission

---

## 🎨 Frontend Implementation

### 1. Recruiter Dashboard Changes

#### A. `Frontend/src/pages/Dash_Pos.jsx`
- Add "Request Access" button for free users
- Show access status badge (Pending/Approved/Waitlist)
- Disable positions that are at limit

#### B. `Frontend/src/pages/Dash_View.jsx` (Position Detail Page)
- Replace "Submit Candidate" with "Request Access" for free users
- Show request status
- Only show "Submit Candidate" if access is approved

#### C. New Page: `Frontend/src/pages/MyAccessRequests.jsx`
- List all access requests
- Show status of each request
- Display remaining slots (2 approved max, 4 total max)

### 2. ClientSPOC Dashboard Changes

#### A. New Page: `Frontend/src/pages/AccessRequestsManagement.jsx`
- Table showing all access requests for ClientSPOC's positions
- Columns: Recruiter Name, Position, Request Date, Status
- Dropdown for each request: Approved / Waitlist / Reject
- Filter by status
- Search by recruiter name or position

#### B. Update Navigation
- Add "Access Requests" menu item for ClientSPOC users

---

## 🔐 Business Logic & Validations

### Recruiter Side:
1. **Before Request:**
   - Check if recruiter has planType = 0
   - Check if total requests < 4
   - Check if currently approved < 2
   - Check if plan hasn't expired (30 days)

2. **Request Creation:**
   - Create request with "pending" status
   - Increment totalRequested counter
   - Send notification to ClientSPOC

3. **After Approval:**
   - Increment currentlyApproved counter
   - Set expiry date (30 days from approval)
   - Enable "Submit Candidate" button

4. **Position Closure:**
   - Decrement currentlyApproved counter
   - Allow requesting new position if < 4 total

### ClientSPOC Side:
1. **View Requests:**
   - Only see requests for their positions
   - Filter by status
   - Sort by date

2. **Approve Request:**
   - Check if recruiter hasn't exceeded limits
   - Update status to "approved"
   - Set approval timestamp

3. **Waitlist Request:**
   - Update status to "waitlist"
   - Recruiter can see but cannot submit candidates

4. **Reject Request:**
   - Update status to "rejected"
   - Recruiter can request different position

---

## 📊 UI/UX Flow

### Recruiter Flow:
```
1. Browse Positions (Dash_Pos)
   ↓
2. Click Position → View Details
   ↓
3. See "Request Access" button (if planType = 0)
   ↓
4. Click "Request Access"
   ↓
5. Confirmation Modal: "Request access to work on this position?"
   ↓
6. Request Sent → Status shows "Pending"
   ↓
7. Wait for ClientSPOC approval
   ↓
8. If Approved → "Submit Candidate" button appears
   ↓
9. If Waitlist → "On Waitlist" badge shown
   ↓
10. If Rejected → Can request different position
```

### ClientSPOC Flow:
```
1. Navigate to "Access Requests" page
   ↓
2. See table of all requests for their positions
   ↓
3. Review recruiter profile/stats
   ↓
4. Select action from dropdown:
   - Approve → Recruiter can submit candidates
   - Waitlist → Hold for later
   - Reject → Deny access
   ↓
5. Confirmation modal
   ↓
6. Status updated → Recruiter notified
```

---

## 🎯 Key Features

### 1. Request Limits Display
```
Free Plan Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Position Access: 2/4 requested
✅ Currently Active: 1/2 approved
⏰ Days Remaining: 25/30
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. Position Card Badges
- 🟢 **Approved** - Can submit candidates
- 🟡 **Pending** - Waiting for approval
- 🔵 **Waitlist** - On hold
- 🔴 **Rejected** - Access denied
- 🔒 **Limit Reached** - Cannot request more

### 3. ClientSPOC Request Card
```
┌─────────────────────────────────────┐
│ 👤 John Doe (john@email.com)       │
│ 📍 Senior Developer - ABC Corp      │
│ 📅 Requested: 2 days ago            │
│                                     │
│ Status: [Approved ▼]                │
│         - Approved                  │
│         - Waitlist                  │
│         - Reject                    │
│                                     │
│ [View Profile] [Update Status]     │
└─────────────────────────────────────┘
```

---

## 🚀 Implementation Steps

### Phase 1: Backend (Days 1-2)
1. Create `positionAccessF.js` model
2. Create `positionAccess.js` router
3. Add validation middleware
4. Update recruiter model with stats
5. Test all endpoints

### Phase 2: Recruiter Frontend (Days 3-4)
1. Update `Dash_Pos.jsx` with request button
2. Update `Dash_View.jsx` with access check
3. Create `MyAccessRequests.jsx` page
4. Add request status badges
5. Implement request flow

### Phase 3: ClientSPOC Frontend (Days 5-6)
1. Create `AccessRequestsManagement.jsx` page
2. Add navigation menu item
3. Implement status dropdown
4. Add filters and search
5. Test approval/rejection flow

### Phase 4: Testing & Deployment (Day 7)
1. End-to-end testing
2. Edge case handling
3. Documentation
4. Deployment

---

## ⚠️ Edge Cases to Handle

1. **Recruiter requests access then plan expires**
   - Auto-reject pending requests
   - Revoke approved access

2. **ClientSPOC deletes position with active requests**
   - Auto-close all requests
   - Notify recruiters

3. **Recruiter reaches 2 approved, one position closes**
   - Decrement counter
   - Allow new request

4. **Multiple requests for same position**
   - Prevent duplicate requests
   - Show existing request status

5. **ClientSPOC changes position details**
   - Keep existing approvals valid
   - Notify approved recruiters of changes

---

## 📝 Success Metrics

1. **Recruiter Engagement:**
   - % of free users requesting access
   - Average requests per user
   - Conversion to paid plan

2. **ClientSPOC Response:**
   - Average approval time
   - Approval vs rejection rate
   - Positions with most requests

3. **System Health:**
   - Request processing time
   - Error rate
   - Database query performance

---

**Status:** 📋 PLANNING COMPLETE - Ready for Implementation
**Estimated Time:** 7 days
**Priority:** HIGH - Core feature for free plan users
