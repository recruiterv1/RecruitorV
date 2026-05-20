# TODO: Implement Expandable Rows with Candidate Details

## Task: Add click-to-expand rows showing candidate name, status, and last updated

## Files Modified:

### 1. Backend - position.js ✅
- [x] Add new endpoint: GET /candidate/pos/:pos_id/candidates - Get all candidates for a specific position
- [x] Include candidate name, status, last updated date in response

### 2. Frontend - ClientSpocPositionStats.jsx ✅
- [x] Add state for expanded rows (Set of position IDs)
- [x] Add state for candidate details (map of positionId -> candidates array)
- [x] Add state for loading details (map of positionId -> boolean)
- [x] Implement toggleRowExpansion function
- [x] Implement fetchCandidatesForPosition function
- [x] Add getStatusColor helper function
- [x] Add expandable section in table row showing candidate details
- [x] Add chevron icons for expand/collapse
- [x] Style the expandable section with proper spacing and colors

### 3. Frontend - RecruiterPositionStats.jsx ✅
- [x] Add state for expanded rows (Set of position IDs)
- [x] Add state for candidate details (map of positionId -> candidates array)
- [x] Add state for loading details (map of positionId -> boolean)
- [x] Implement toggleRowExpansion function
- [x] Implement fetchCandidatesForPosition function
- [x] Add getStatusColor helper function
- [x] Add expandable section in table row showing candidate details
- [x] Add chevron icons for expand/collapse
- [x] Style the expandable section with proper spacing and colors

## Implementation Details:

### Backend Endpoint:
```
GET /candidate/pos/:pos_id/candidates
Response: {
  "success": true,
  "candidates": [
    {
      "id": "candidate_id",
      "name": "John Doe",
      "status": "Interview Scheduled",
      "lastUpdated": "2026-01-23T10:30:00.000Z",
      "recName": "Recruiter Name"
    }
  ]
}
```

### Frontend Changes:
- Added ChevronRight/ChevronDown icons from lucide-react
- Handle loading state while fetching candidates
- Display candidate name, status with color coding, and formatted date
- Add "No candidates found" message for empty states
- Each expandable section shows a nested table with candidate details

### Status Colors:
- 🟢 Green: Success statuses (Offer Accepted, Joining)
- 🔴 Red: Rejection statuses (Screen Reject, L1 Reject, L2 Reject, L3 Reject, HR Reject, Background Verification Reject, Negotiation Reject, Offer Declined)
- 🟡 Yellow: All other statuses (in-progress)

## Status: COMPLETED ✅
Completed: 2026-01-23

