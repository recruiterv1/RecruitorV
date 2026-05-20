# Coach/Expert Request System Implementation

## Overview
Implement a complete Coach/Expert request system with the following features:
1. Add "Get Help" button on position detail page under Coach/Expert section
2. Mask phone/email with ****
3. Send email to coach/expert when recruiter clicks "Get Help"
4. Coach/Expert "All Requests" page with Position Name, Recruiter Name, Phone/Email (hidden until Accepted)
5. Recruiter dashboard "Coach / Expert Requests" page

---

## Backend Changes

### 1. Backend/router/coachExpert.js
- [ ] Add endpoint: `POST /api/coach-expert/request/create` - Create "Get Help" request
- [ ] Add endpoint: `GET /api/coach-expert/requests` - Get all requests for a coach/expert
- [ ] Add endpoint: `PUT /api/coach-expert/request/:id/status` - Update request status
- [ ] Add endpoint: `POST /api/coach-expert/request/:id/email` - Send email notification

### 2. Backend/model_fire/coachF.js & expertF.js
- [ ] Add `getCoachById` function if not exists
- [ ] Add `getExpertById` function if not exists

---

## Frontend Changes

### 1. Frontend/src/pages/Dash_See.jsx
- [ ] Add "Get Help" button under Coach/Expert section
- [ ] Mask phone/email with ****
- [ ] Implement email sending on "Get Help" click

### 2. Frontend/src/components/CoachExpertDashboard.jsx
- [ ] Update "All Requests" content to show:
  - [ ] Position Name (clickable for details)
  - [ ] Recruiter Name
  - [ ] Phone (hidden with ****, visible when status=Accepted)
  - [ ] Email (hidden with ****, visible when status=Accepted)
  - [ ] Status dropdown (Accept/Reject/Waitlist)

### 3. Frontend/src/pages/Sidebar.jsx
- [ ] Add new menu item: "Coach / Expert Requests" for recruiters

### 4. New File: Frontend/src/pages/RecruiterCoachExpertRequests.jsx
- [ ] Create new page showing:
  - [ ] Coach/Expert Name
  - [ ] Phone (hidden with ****, visible when status=Accepted)
  - [ ] Email (hidden with ****, visible when status=Accepted)
  - [ ] Status
  - [ ] Position Name (clickable)

### 5. Frontend/src/App.jsx
- [ ] Add route: `/coach-expert-requests` for the new page

---

## Implementation Order

1. Create TODO.md file
2. Update Backend/router/coachExpert.js with new endpoints
3. Update Dash_See.jsx - Add "Get Help" button
4. Update CoachExpertDashboard.jsx - Create requests table with hidden data
5. Create RecruiterCoachExpertRequests.jsx - New page for recruiters
6. Update Sidebar.jsx - Add new menu item
7. Update App.jsx - Add new route
8. Test the complete flow

---

## Database Collection
- New collection: `coach_expert_requests`
- Fields:
  - id (auto-generated)
  - coachExpertId (coach/expert document ID)
  - coachExpertName
  - coachExpertEmail
  - coachExpertPhone
  - coachExpertType ('Coach' or 'Expert')
  - recruiterId (recruiter document ID)
  - recruiterName
  - recruiterEmail
  - recruiterPhone
  - positionId
  - positionTitle
  - status ('pending', 'accepted', 'rejected', 'waitlist')
  - createdAt
  - updatedAt

