# Recruiter Position Stats Feature - TODO

## Task
Add a new page and menu for recruiters on the recruiter dashboard where they can see position-wise statistics for the positions they are working on (positions they are assigned to work with client name), but WITHOUT the "More Candidate" column.

## Implementation Steps

### Step 1: Backend - Add New Endpoint
- [ ] Add endpoint: `GET /candidate/pos/recruiter-stats` in `Backend/router/position.js`
- [ ] Returns positions where the logged-in recruiter has submitted candidates
- [ ] Shows candidate counts, max limits, remaining slots (read-only)

### Step 2: Frontend - Create New Page
- [ ] Create `Frontend/src/pages/RecruiterPositionStats.jsx`
- [ ] Similar layout to `ClientSpocPositionStats.jsx`
- [ ] Summary cards (Total Positions, Total Candidates, Max Candidates, Remaining)
- [ ] Position table WITHOUT "More Candidate" column
- [ ] Shows client name for each position

### Step 3: Frontend - Update App.jsx
- [ ] Add import for `RecruiterPositionStats`
- [ ] Add route: `/recruiter-position-stats`

### Step 4: Frontend - Update Admin.jsx (Sidebar Menu)
- [ ] Add import for `RecruiterPositionStats` and appropriate icon
- [ ] Add menu item "My Position Stats" in the sidebar
- [ ] Only visible for recruiter role (not ClientSPOC/Admin)

## API Response Format

### GET /candidate/pos/recruiter-stats

**Response:**
```json
{
  "success": true,
  "positions": [
    {
      "id": "doc_id",
      "pos_id": "1001",
      "position": "Java Developer",
      "client": "TCS",
      "candidateCount": 5,
      "maxCandidate": 10,
      "remaining": 5,
      "isFull": false
    }
  ],
  "summary": {
    "totalPositions": 3,
    "totalCandidates": 15,
    "totalMaxCandidates": 30,
    "totalRemaining": 15
  }
}
```

## Files to Create/Modify

### New Files:
- `Frontend/src/pages/RecruiterPositionStats.jsx`

### Modified Files:
- `Backend/router/position.js` - Add endpoint
- `Frontend/src/App.jsx` - Add route
- `Frontend/src/components/Admin.jsx` - Add menu item

## Testing Checklist
- [ ] Verify recruiter position stats load correctly for recruiter user
- [ ] Check that summary cards show correct totals
- [ ] Verify table displays only positions where recruiter has submitted candidates
- [ ] Verify "More Candidate" column is NOT present
- [ ] Verify client name is shown for each position
- [ ] Verify menu item is visible only for recruiters
- [ ] Verify ClientSPOC/Admin do NOT see this menu item

## Status
- [x] Plan approved by user
- [x] Step 1: Backend endpoint - Added `/candidate/pos/recruiter-stats` endpoint
- [x] Step 2: Frontend page - Created `RecruiterPositionStats.jsx`
- [x] Step 3: App.jsx route - Added `/recruiter-position-stats` route
- [x] Step 4: Admin.jsx menu - Added "My Position Stats" menu (recruiter only)
- [ ] Testing

---
Created: $(date)

