# Comprehensive Profile Feature Implementation Plan

## Features to Implement

### 1. Enhanced Profile Page
- Profile photo upload
- Skills section
- Work experience (company, position, duration, description)
- Education (institution, degree, year, description)
- Resume/CV upload
- Bio/About section

### 2. Profile Completion Percentage in Header
- Show percentage indicator
- Progress bar visualization
- Click to view incomplete fields

### 3. Database Storage
- Recruiter data → recruiter_db
- Coach data → coach_db  
- Expert data → expert_db
- ClientSPOC data → admin_db

### 4. Remove "Positions" from Profile Page
- Remove stats card with positions

---

## Implementation Steps

### Step 1: Backend - Add Profile Update Endpoints
- [ ] Create profile update API for recruiters
- [ ] Create profile update API for coaches
- [ ] Create profile update API for experts
- [ ] Create profile update API for client spocs
- [ ] Add file upload support for profile photo and resume

### Step 2: Backend - Add Profile Completion Calculation
- [ ] Create API to calculate profile completion percentage
- [ ] Define field weights for each user type

### Step 3: Backend - Update Models
- [ ] Update recruiterF.js with profile functions
- [ ] Update coachF.js with profile functions
- [ ] Update expertF.js with profile functions
- [ ] Update clientspocF.js with profile functions

### Step 4: Frontend - Update Profile Page
- [ ] Create comprehensive profile form with sections:
  - Personal Info (already exists)
  - Profile Photo Upload
  - Skills Section (add/remove skills)
  - Work Experience (CRUD operations)
  - Education (CRUD operations)
  - Resume Upload
  - Bio/About
- [ ] Add profile completion calculation
- [ ] Remove "Positions" from stats card

### Step 5: Frontend - Update Header
- [ ] Add profile completion indicator
- [ ] Show progress bar
- [ ] Add tooltip with incomplete fields

### Step 6: Testing & Deployment
- [ ] Test all user types
- [ ] Deploy to production

---

## Profile Completion Field Weights

### Recruiter
| Field | Weight |
|-------|--------|
| Name | 5% |
| Email | 5% |
| Phone | 5% |
| Company | 5% |
| Designation | 5% |
| Profile Photo | 10% |
| Bio | 10% |
| Skills | 15% |
| Work Experience | 25% |
| Education | 10% |
| Resume | 10% |

### Coach
| Field | Weight |
|-------|--------|
| Name | 5% |
| Email | 5% |
| Phone | 5% |
| Specialization | 10% |
| Profile Photo | 10% |
| Bio | 15% |
| Skills | 15% |
| Work Experience | 20% |
| Education | 10% |
| Resume | 5% |

### Expert
| Field | Weight |
|-------|--------|
| Name | 5% |
| Email | 5% |
| Phone | 5% |
| Industry | 10% |
| Profile Photo | 10% |
| Bio | 15% |
| Skills | 15% |
| Work Experience | 20% |
| Education | 10% |
| Resume | 5% |

---

## API Endpoints

### GET /auth/profile-completion
Returns profile completion percentage and list of missing fields

### PUT /auth/profile/update
Update profile data (handles all user types)

### POST /auth/profile/upload-photo
Upload profile photo

### POST /auth/profile/upload-resume
Upload resume/CV

---

## Status: PLANNED

