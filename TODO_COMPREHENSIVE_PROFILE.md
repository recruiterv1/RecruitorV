# Comprehensive Profile Feature - TODO List

## Phase 1: Backend Implementation

### 1.1 Update Model Files
- [ ] Update recruiterF.js - Add profile fields and updateProfile function
- [ ] Update coachF.js - Add profile fields and updateCoach function
- [ ] Update expertF.js - Add profile fields and updateExpert function
- [ ] Update clientspocF.js - Add profile fields and updateClientSpoc function

### 1.2 Add API Routes
- [ ] Add profile completion API endpoint
- [ ] Add profile update API endpoint
- [ ] Add file upload endpoints (profile photo, resume)

## Phase 2: Frontend Implementation

### 2.1 Update Profile Page
- [ ] Redesign Profile page with tabs/sections
- [ ] Add profile photo upload component
- [ ] Add skills section with add/remove functionality
- [ ] Add work experience section (CRUD)
- [ ] Add education section (CRUD)
- [ ] Add resume upload component
- [ ] Add bio/about section
- [ ] Remove "Positions" from stats card
- [ ] Calculate and display profile completion percentage

### 2.2 Update Header
- [ ] Add profile completion indicator
- [ ] Add progress bar
- [ ] Add tooltip with missing fields

## Phase 3: Testing & Deployment
- [ ] Test all user types (Recruiter, Coach, Expert, ClientSPOC)
- [ ] Test file uploads
- [ ] Deploy to production

---

## Profile Data Structure

### Recruiter Profile Fields
```javascript
{
  profilePhoto: "", // URL
  bio: "", // Text
  skills: [], // Array of strings
  workExperience: [
    {
      id: "",
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: ""
    }
  ],
  education: [
    {
      id: "",
      institution: "",
      degree: "",
      year: "",
      description: ""
    }
  ],
  resume: "", // URL
  linkedin: "",
  twitter: ""
}
```

### Coach Profile Fields
```javascript
{
  profilePhoto: "",
  bio: "",
  skills: [],
  specialization: "",
  workExperience: [...],
  education: [...],
  resume: "",
  hourlyRate: "",
  availability: ""
}
```

### Expert Profile Fields
```javascript
{
  profilePhoto: "",
  bio: "",
  skills: [],
  industry: "",
  workExperience: [...],
  education: [...],
  resume: "",
  hourlyRate: "",
  availability: ""
}
```

---

## Status: IN PROGRESS

