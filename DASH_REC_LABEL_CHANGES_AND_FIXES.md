# Dashboard Stats Label Changes and Fixes

## Changes Made

### 1. Frontend Label Updates (`Frontend/src/pages/Dash_Data.jsx`)
- Changed "Scheduled" to "To be Scheduled"
- Changed "Feedback" to "Feedback Pending"

### 2. Backend Debugging Added (`Backend/model_fire/recruiterStatsF.js`)
- Added console logging to debug the "Total Positions" showing 0 issue
- Logs will show:
  - Recruiter email being searched
  - Number of positions found
  - Sample position data (if any positions exist)

## Issue: Total Positions Showing 0

### Root Cause
The `totalPositions` count is 0 because the query:
```javascript
positions.where("hr_name", "==", recruiterEmail)
```

This query looks for positions where the `hr_name` field matches the recruiter's email. If no positions are found, it means:

1. **Field Name Mismatch**: The positions collection might use a different field name (not `hr_name`)
2. **Email Format Mismatch**: The email in `hr_name` might be in a different format (case sensitivity, extra spaces, etc.)
3. **No Positions Assigned**: The recruiter genuinely has no positions assigned to them

### How to Diagnose

Check the Firebase Functions logs after deployment:
```bash
npx firebase-tools functions:log --only api | grep "Looking for positions"
```

The logs will show:
- What email is being searched
- How many positions were found
- A sample position document (if any exist)

### Possible Solutions

**If the field name is different:**
Update the query in `Backend/model_fire/recruiterStatsF.js`:
```javascript
// Instead of:
const allPositionsSnap = await positions.where("hr_name", "==", recruiterEmail).get();

// Try one of these:
const allPositionsSnap = await positions.where("recruiterEmail", "==", recruiterEmail).get();
// OR
const allPositionsSnap = await positions.where("assignedTo", "==", recruiterEmail).get();
// OR
const allPositionsSnap = await positions.where("recruiter", "==", recruiterEmail).get();
```

**If the email format is different:**
Check if the position uses lowercase emails:
```javascript
const allPositionsSnap = await positions.where("hr_name", "==", recruiterEmail.toLowerCase()).get();
```

**If positions use recruiter ID instead of email:**
```javascript
// Get recruiter ID first
const recruiterId = recruiterData.id;
const allPositionsSnap = await positions.where("recruiterId", "==", recruiterId).get();
```

## Deployment Status

✅ Frontend changes deployed
✅ Backend debugging logs added
⏳ Waiting for user to check Firebase logs to identify the issue

## Next Steps

1. User should login to the dashboard
2. Check the browser console for any errors
3. Check Firebase Functions logs for the debug output
4. Based on the logs, we can identify the correct field name and fix the query
