# Days Remaining Showing 0 - Root Cause and Fix

## Issue
User "atulkumar@yopmail.com" sees "0 days" remaining even though the plan should show 30 days.

## Root Cause
The user's database record is missing the `planExpiryDate` field. When this field is missing:
- Backend returns `daysRemaining: 30` as a default
- BUT the frontend code has: `{planInfo?.daysRemaining || 0}`
- If `daysRemaining` is undefined/null, it defaults to 0

## The Problem Chain

1. **Database:** User record missing `planExpiryDate`
2. **Backend Logic:** Returns default value of 30 days
3. **API Response:** May not include `daysRemaining` in response
4. **Frontend Display:** `planInfo?.daysRemaining || 0` → Shows 0

## Solution

### Step 1: Fix Database Record
Run the script to add `planExpiryDate` to user's record:
```bash
cd Backend
node scripts/fixUserPlanExpiryDate.js atulkumar@yopmail.com
```

This script will:
- Find the user by email
- Check if `planExpiryDate` exists
- If missing, calculate it as: `registrationDate + 30 days`
- Update the database with proper Firestore Timestamp

### Step 2: Verify Backend Response
After fixing, the backend should return:
```json
{
  "success": true,
  "planInfo": {
    "canCreatePosition": true,
    "isPaid": false,
    "planType": 0,
    "currentPositionCount": 2,
    "positionsRemaining": 0,
    "maxPositions": 2,
    "daysRemaining": 30  // ← Should show actual days
  }
}
```

### Step 3: Frontend Will Display Correctly
Once backend returns proper `daysRemaining`, frontend will show:
```
Days Remaining
30 days
```

## Files Involved

1. **Backend/model_fire/recruiterF.js** - checkPlanLimits function
2. **Backend/scripts/fixUserPlanExpiryDate.js** - Fix script
3. **Frontend/src/components/Dash_rec.jsx** - Display component

## Prevention for New Users

When new users register with Free Plan, the registration endpoint now sets:
- `planType: 0`
- `registrationDate: new Date()`
- `planExpiryDate: new Date() + 30 days`
- `maxPositions: 2`

This is handled in `Backend/router/rout.js` in the `/register` endpoint.

## Testing After Fix

1. Logout and login again as atulkumar@yopmail.com
2. Go to dashboard
3. Check "Days Remaining" - should show actual days (e.g., 30, 29, 28...)
4. Should NOT show "0 days" unless plan actually expired

## Why This Happened

This user was likely created before the planType feature was fully implemented, so their record doesn't have the `planExpiryDate` field. The migration script (`migratePlanType.js`) set `planType: 1` for existing users, but this user was manually changed to `planType: 0` without setting the expiry date.

## Long-term Fix

All new free plan registrations will automatically have `planExpiryDate` set, so this issue won't occur for new users.
