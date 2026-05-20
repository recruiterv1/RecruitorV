# TODO: Total Candidates Column and Recruiter Highlight Feature

## Task Summary
Add "Total Candidates" column to position tables and highlight candidates added by logged-in recruiter in expanded view.

## Backend Changes

### 1. Update `/candidate/pos/recruiter-stats` endpoint
- [x] Include `totalCandidates` count (all candidates for the position)
- [x] Include `remaining` calculation based on total vs max limit
- [x] Include `totalAllCandidates` in summary
- File: `Backend/router/position.js`

## Frontend Changes

### 2. Update RecruiterPositionStats.jsx
- [x] Add "Total Candidates" column
- [x] Add "Total Candidates" summary card
- [x] Rename/update "My Candidates" styling
- [x] Add "Remaining" column based on total candidates
- [x] Highlight candidates added by logged-in recruiter in expanded view with different background color
- [x] Add "YOU" badge for logged-in recruiter's candidates
- [x] Add "Submitted By" column in expanded view
- File: `Frontend/src/pages/RecruiterPositionStats.jsx`

## Implementation Steps

### Step 1: Backend - Update recruiter-stats endpoint ✅
- [x] Fetch all candidates for positions (not just logged-in recruiter's)
- [x] Calculate total count per position
- [x] Return both `candidateCount` (recruiter's) and `totalCandidates` (all)

### Step 2: Frontend - Update RecruiterPositionStats table ✅
- [x] Add "Total Candidates" column header
- [x] Add "Total Candidates" summary card
- [x] Add "Remaining" column based on total candidates
- [x] Update expanded candidate rows to highlight logged-in recruiter's candidates with teal background
- [x] Add "YOU" badge on candidate cards
- [x] Add legend showing which color represents logged-in recruiter

## Testing Checklist
- [ ] Verify total candidates count is correct
- [ ] Verify logged-in recruiter's candidates are highlighted with teal background
- [ ] Verify "YOU" badge appears on logged-in recruiter's candidates
- [ ] Verify remaining slots calculation is correct
- [ ] Test expandable rows functionality

## Status
- [x] Plan approved
- [x] Backend implementation
- [x] Frontend implementation
- [ ] Testing (pending deployment)

