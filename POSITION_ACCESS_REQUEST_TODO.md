# Position Access Request System - Implementation TODO

## ✅ Phase 1: Backend (COMPLETED)
- [x] Create `Backend/model_fire/positionAccessF.js`
  - [x] createAccessRequest()
  - [x] getRecruiterRequests()
  - [x] getClientSpocRequests()
  - [x] updateRequestStatus()
  - [x] checkRecruiterAccess()
  - [x] getRecruiterAccessStats()
  - [x] closePositionRequest()
  - [x] getRequestById()

- [x] Create `Backend/router/positionAccess.js`
  - [x] POST /api/position-access/request
  - [x] GET /api/position-access/recruiter
  - [x] GET /api/position-access/recruiter/stats
  - [x] GET /api/position-access/clientspoc
  - [x] PUT /api/position-access/:requestId/status
  - [x] GET /api/position-access/check/:positionId
  - [x] DELETE /api/position-access/:requestId/close
  - [x] GET /api/position-access/:requestId

- [x] Register router in `Backend/index.js`

---

## 🔄 Phase 2: Recruiter Frontend (IN PROGRESS)
- [ ] Update `Frontend/src/pages/Dash_View.jsx`
  - [ ] Add access check on page load
  - [ ] Show "Request Access" button for free users without access
  - [ ] Show "Submit Candidate" button only if access approved
  - [ ] Show request status badge (Pending/Approved/Waitlist/Rejected)
  - [ ] Handle request submission

- [ ] Create `Frontend/src/pages/MyAccessRequests.jsx`
  - [ ] Fetch and display all requests
  - [ ] Show status badges
  - [ ] Display stats (2/4 requested, 1/2 approved, days remaining)
  - [ ] Add close/complete functionality
  - [ ] Filter by status

- [ ] Update `Frontend/src/pages/Dash_Pos.jsx`
  - [ ] Add access status indicators
  - [ ] Show request button in table
  - [ ] Display limits banner for free users

- [ ] Update Navigation
  - [ ] Add "My Access Requests" menu item for free users

---

## 🔄 Phase 3: ClientSPOC Frontend (PENDING)
- [ ] Create `Frontend/src/pages/AccessRequestsManagement.jsx`
  - [ ] Fetch requests for ClientSPOC's positions
  - [ ] Display in table format
  - [ ] Add status dropdown (Approved/Waitlist/Reject)
  - [ ] Implement status update
  - [ ] Add filters (by status, position, recruiter)
  - [ ] Add search functionality
  - [ ] Show recruiter details

- [ ] Update ClientSPOC Navigation
  - [ ] Add "Access Requests" menu item
  - [ ] Add notification badge for pending requests

- [ ] Update `Frontend/src/components/Admin.jsx` or ClientSPOC dashboard
  - [ ] Add link to Access Requests page

---

## 🔄 Phase 4: Integration & Testing (PENDING)
- [ ] Test recruiter flow
  - [ ] Request access to position
  - [ ] View request status
  - [ ] Submit candidate after approval
  - [ ] Handle rejection
  - [ ] Test limits (2 approved max, 4 total max)

- [ ] Test ClientSPOC flow
  - [ ] View incoming requests
  - [ ] Approve request
  - [ ] Waitlist request
  - [ ] Reject request
  - [ ] Verify recruiter can/cannot submit

- [ ] Test edge cases
  - [ ] Expired plan
  - [ ] Duplicate requests
  - [ ] Position deletion
  - [ ] Access expiry (30 days)

- [ ] Update candidate submission logic
  - [ ] Check access before allowing submission
  - [ ] Show appropriate error messages

---

## 🔄 Phase 5: Documentation & Deployment (PENDING)
- [ ] Create user guide for recruiters
- [ ] Create user guide for ClientSPOC
- [ ] Update API documentation
- [ ] Create deployment script
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Test in production

---

## 📊 Current Status

**Completed:** Phase 1 - Backend ✅  
**In Progress:** Phase 2 - Recruiter Frontend 🔄  
**Next:** Create Dash_View.jsx updates  

**Estimated Completion:** 60% remaining  
**Files Created:** 3/10  
**Files Updated:** 1/5  

---

## 🎯 Next Steps

1. Read `Frontend/src/pages/Dash_View.jsx` to understand current structure
2. Add access request functionality
3. Create MyAccessRequests.jsx page
4. Update navigation
5. Move to ClientSPOC frontend

---

**Last Updated:** Just now  
**Status:** Backend Complete, Starting Frontend
