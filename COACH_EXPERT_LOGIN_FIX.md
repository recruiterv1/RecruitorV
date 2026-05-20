# Coach/Expert Login Fix

## Issues Identified
1. Login endpoint `rec_verify` only checked the `recruiter` collection, not the `coach_db` or `expert_db` collections.
2. Coaches/Experts added via admin panel have **plain text passwords**, not bcrypt hashed passwords.
3. Coaches/Experts added via admin panel don't have OTP verification (`isVerified` is not set).

## Solution
Updated `Backend/router/rout.js` to:
1. Check all three collections during login
2. Support plain text passwords for coaches/experts added via admin panel
3. Skip OTP verification requirement for coaches/experts (they're added directly by admin)

## Changes Made

### 1. Updated `/auth/rec_verify` endpoint
- Check recruiter collection first
- If not found, check coach collection  
- If not found, check expert collection
- Detect plain text passwords (length < 60 chars) and use direct comparison
- Only require OTP verification for recruiters and self-registered coaches/experts
- Return appropriate `roleCategory` ("Coach" or "Expert") for each user type
- Update `lastActive` timestamp in the correct collection

### 2. Updated `/auth/check` endpoint
- Support session validation for coaches and experts
- Check all three collections for authenticated user
- Return appropriate user data based on collection type

## Files Modified
- `Backend/router/rout.js`

## Testing
After deployment, coaches with accounts like `mkumar@yopmail.com` should be able to login successfully and be redirected to `/coach-dashboard`.

## Deployment
Deploy the backend changes using:
```bash
./deploy.sh
# Select option 2 (Backend Only)
```

