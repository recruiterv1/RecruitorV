# Fix "0 Days Remaining" Issue for User

## Problem
User `atulkumar@yopmail.com` sees "0 days remaining" because their database record is missing the `planExpiryDate` field.

## Solution Options

### Option 1: Run the Fix Script (Recommended)
```bash
cd Backend
node scripts/fixUserPlanExpiryDate.js atulkumar@yopmail.com
```

This will:
- Find the user in the database
- Add `planExpiryDate` = current date + 30 days
- Add `registrationDate` = current date
- Update the record

### Option 2: Manual Database Update
If the script doesn't work, manually update the Firestore database:

1. Go to Firebase Console: https://console.firebase.google.com
2. Select project: `recruitorv-1291c`
3. Go to Firestore Database
4. Find collection: `recruiter_db`
5. Find document where `email == "atulkumar@yopmail.com"`
6. Add/Update these fields:
   ```
   registrationDate: [Timestamp] (current date)
   planExpiryDate: [Timestamp] (current date + 30 days)
   ```

### Option 3: Create API Endpoint (For Future)
Add an admin endpoint to fix user records programmatically.

## After Fix

1. User should logout and login again
2. Dashboard should show actual days remaining (e.g., "30 days")
3. Should NOT show "0 days" anymore

## Prevention

All new free plan users will automatically have these fields set during registration, so this won't happen again.
