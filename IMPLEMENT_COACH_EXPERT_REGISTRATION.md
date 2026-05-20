# Coach/Expert Registration Implementation Plan

## Overview
Implement role-based registration with:
- Coach/Expert data saved to their respective database tables
- Specialization field with search capability
- Paid/Free option for Coach and Expert
- Role-based redirects after registration

## Files to Create/Modify

### 1. Frontend/src/components/Register.jsx
**Changes:**
- Add `specialization` field with autocomplete/search (visible only for Coach/Expert)
- Add `userType` field with Paid/Free options (visible only for Coach/Expert)
- Update form state to handle new fields
- Update validation logic for role-based fields
- Update submission logic to send data to correct endpoints
- Store role info in localStorage for OTP redirect logic

### 2. Frontend/src/pages/MainCoach.jsx (NEW)
**Create Coach dashboard page similar to MainCorporate with:**
- Header/Footer
- Hero section for Coaches
- Why Recruiterv Fits Coaches section
- Perfect For section
- How It Works section
- Pricing CTA

### 3. Frontend/src/pages/MainExpert.jsx (NEW)
**Create Expert dashboard page similar to MainCorporate with:**
- Header/Footer
- Hero section for Experts
- Why Recruiterv Fits Experts section
- Perfect For section
- How It Works section
- Pricing CTA

### 4. Backend/router/rout.js
**Update /register endpoint:**
- For Coach: Call `/api/coach-expert/coach/add` → saves to `coach_db`
- For Expert: Call `/api/coach-expert/expert/add` → saves to `expert_db`
- For Recruiter: Keep current behavior → saves to `recruiter_db`
- Return role info in response for redirect logic

### 5. Frontend/src/App.jsx
**Add routes:**
- `/coach` → MainCoach
- `/expert` → MainExpert

### 6. Frontend/src/components/Otp.jsx
**Update redirect logic:**
- Free Coach/Expert → Login page (/log_rec)
- Paid Coach/Expert → Coach dashboard (/coach or /expert)
- Recruiter → Dashboard (/dash_rec)

## Specialization Options
```
Tech, Banking, Finance, IT, Database, Testing, Marketing, HR, Operations, Sales, Other
```

## Registration Flow

### Current (Recruiter):
1. User fills form → /auth/register → recruiter_db
2. OTP sent → User verifies OTP
3. Redirect to /dash_rec

### New (Coach/Expert):
1. User fills form with specialization + userType
2. If Free:
   - Call `/api/coach-expert/coach/add` or `/expert/add`
   - OTP sent → User verifies OTP
   - Redirect to /log_rec (login page)
3. If Paid:
   - Call `/api/coach-expert/coach/add` or `/expert/add`
   - OTP sent → User verifies OTP
   - Redirect to /coach (Coach page) or /expert (Expert page)

## Dependencies
- MUI Autocomplete component (already used in AddCoach.jsx/AddExpert.jsx)
- Chip component for tags (already used)

## Status: READY TO IMPLEMENT

