# TODO: ClientSPOC Dashboard - View Recruiter Details in Access Request

## Objective
Enable ClientSPOC to view recruiter details by clicking on the recruiter name in the Access Requests Management dashboard.

## Tasks

### 1. Backend - Create API Endpoint for Recruiter Details
- [x] Create `GET /api/profile/recruiter/:id` endpoint to fetch recruiter profile data
- [x] The endpoint returns:
  - Personal Info: name, email, phone, bio, location, country, linkedin, twitter, website
  - Professional: specialization, targetIndustries, recruitmentMethods
  - Skills: list of skills
  - Work Experience: company history
  - Education: education history
  - Documents: resume availability
  - Profile completion percentage
  - Activity stats (total candidates)

### 2. Frontend - Add Recruiter Details Modal
- [x] Create a Modal component to display recruiter profile details
- [x] Style the modal with:
  - Profile header with avatar (shows first letter of name)
  - Profile completion progress bar
  - Tabbed interface for different sections (Personal, Professional, Skills, Experience, Education)
  - Close button and backdrop

### 3. Frontend - Make Recruiter Name Clickable
- [x] Modify the "Recruiter" column in AccessRequestsManagement.jsx
- [x] Add click handler to open the recruiter details modal
- [x] Show visual indicator (cursor pointer, hover effect, blue color, underline)

### 4. Testing
- [ ] Verify modal opens when clicking recruiter name
- [ ] Verify data loads correctly from backend
- [ ] Verify modal styling and responsiveness

## Files Modified

### Backend:
- `Backend/model_fire/recruiterF.js` - Added `getRecruiterPublicProfile()` function
- `Backend/router/profile.js` - Added `GET /api/profile/recruiter/:id` endpoint

### Frontend:
- `Frontend/src/pages/AccessRequestsManagement.jsx` - Added:
  - Modal state management
  - Recruiter profile fetch logic
  - Clickable recruiter column
  - Full-featured profile modal with tabs

## Implementation Notes
- Uses existing Profile.jsx structure as reference
- Reuses modal styling from existing components
- Follows the same data structure as Profile API
- Only ClientSPOC users can view recruiter profiles (authorization check)

