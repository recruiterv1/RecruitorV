# Coach/Expert Registration Implementation - TODO

## Phase 1: Frontend Registration Page Updates
- [x] 1.1 Add specialization field with autocomplete/search to Register.jsx
- [x] 1.2 Add paid/free userType option for Coach/Expert
- [x] 1.3 Update form state and validation logic
- [x] 1.4 Update form submission to handle role-based endpoints
- [x] 1.5 Store role/specialization/userType in localStorage for OTP redirect

## Phase 2: Backend Registration Endpoint Updates
- [x] 2.1 Modify /auth/register to route Coach to coach_db
- [x] 2.2 Modify /auth/register to route Expert to expert_db
- [x] 2.3 Keep Recruiter behavior unchanged (recruiter_db)
- [x] 2.4 Return role and userType in registration response

## Phase 3: Create Coach Dashboard Page
- [x] 3.1 Create MainCoach.jsx page (similar to MainCorporate)
- [x] 3.2 Add Header, Footer, Hero, Features, Pricing sections
- [x] 3.3 Style appropriately for Coach branding

## Phase 4: Create Expert Dashboard Page
- [x] 4.1 Create MainExpert.jsx page (similar to MainCorporate)
- [x] 4.2 Add Header, Footer, Hero, Features, Pricing sections
- [x] 4.3 Style appropriately for Expert branding

## Phase 5: App Routes & OTP Redirect
- [x] 5.1 Add /coach route to App.jsx
- [x] 5.2 Add /expert route to App.jsx
- [x] 5.3 Update Otp.jsx redirect logic:
      - Free Coach/Expert → /log_rec (login)
      - Paid Coach/Expert → /coach or /expert
      - Recruiter → /dash_rec

## Phase 6: Testing & Validation
- [ ] 6.1 Test Coach registration flow (free & paid)
- [ ] 6.2 Test Expert registration flow (free & paid)
- [ ] 6.3 Test Recruiter registration (ensure no regression)
- [ ] 6.4 Verify data saves to correct database tables

## Implementation Status: MOST TASKS COMPLETED

