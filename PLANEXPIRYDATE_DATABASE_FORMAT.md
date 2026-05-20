# planExpiryDate Database Format Guide

## Exact Value Format for Firestore

The `planExpiryDate` field in the `recruiter_db` collection should be stored as a **Firestore Timestamp** object.

## Format Details

### Field Type
**Firestore Timestamp**

### How to Set It

#### Option 1: Using Firebase Console (Manual)
1. Go to Firebase Console: https://console.firebase.google.com
2. Select project: `recruitorv-1291c`
3. Navigate to: Firestore Database → `recruiter_db` collection
4. Find the user document (email: `atulkumar@yopmail.com`)
5. Click "Add field" or edit existing field
6. Field name: `planExpiryDate`
7. Field type: **timestamp**
8. Value: Select date 30 days from today

**Example:**
- If today is December 20, 2024
- Set timestamp to: January 19, 2025 at 00:00:00

### Option 2: Using Code (Recommended)

```javascript
const admin = require('firebase-admin');

// Calculate expiry date (30 days from now)
const now = new Date();
const expiryDate = new Date(now);
expiryDate.setDate(expiryDate.getDate() + 30);

// Convert to Firestore Timestamp
const firestoreTimestamp = admin.firestore.Timestamp.fromDate(expiryDate);

// Update user record
await db.collection('recruiter_db').doc(userId).update({
  planExpiryDate: firestoreTimestamp,
  registrationDate: admin.firestore.Timestamp.fromDate(now)
});
```

## Complete User Record Structure

For a free plan user, the record should look like this:

```javascript
{
  email: "atulkumar@yopmail.com",
  name: "Atul Kumar",
  planType: 0,  // 0 = Free, 1 = Paid
  maxPositions: 2,
  registrationDate: Timestamp(seconds: 1734700800, nanoseconds: 0),  // Dec 20, 2024
  planExpiryDate: Timestamp(seconds: 1737292800, nanoseconds: 0),    // Jan 19, 2025 (30 days later)
  // ... other fields
}
```

## Timestamp Object Structure

A Firestore Timestamp has two components:

```javascript
{
  _seconds: 1737292800,      // Unix timestamp in seconds
  _nanoseconds: 0            // Nanoseconds component
}
```

## How to Calculate the Exact Value

### For Today (December 20, 2024):

**Registration Date:**
- Date: December 20, 2024, 00:00:00 UTC
- Unix timestamp: `1734652800` seconds
- Firestore: `Timestamp(seconds: 1734652800, nanoseconds: 0)`

**Plan Expiry Date (30 days later):**
- Date: January 19, 2025, 00:00:00 UTC
- Unix timestamp: `1737244800` seconds
- Firestore: `Timestamp(seconds: 1737244800, nanoseconds: 0)`

## Using the API Endpoint

The easiest way is to use the API endpoint we created:

```bash
curl -X POST https://api-myh3hnbr6q-uc.a.run.app/auth/admin/fix-user-plan-expiry \
  -H "Content-Type: application/json" \
  -d '{"userEmail": "atulkumar@yopmail.com"}'
```

This will automatically:
1. Calculate current date
2. Add 30 days
3. Convert to Firestore Timestamp
4. Update the database

## Verification

After setting the value, you can verify it's correct by:

1. **In Firebase Console:**
   - The field should show as type "timestamp"
   - The date should be 30 days from registration date

2. **Using the API:**
   ```bash
   curl https://api-myh3hnbr6q-uc.a.run.app/auth/check-plan-limits
   ```
   Should return `daysRemaining: 30` (or actual days remaining)

3. **In the App:**
   - Login as the user
   - Dashboard should show "30 days remaining" (or actual days)
   - Should NOT show "0 days"

## Common Mistakes to Avoid

❌ **Wrong:** Setting as a string
```javascript
planExpiryDate: "2025-01-19"  // DON'T DO THIS
```

❌ **Wrong:** Setting as a JavaScript Date object
```javascript
planExpiryDate: new Date("2025-01-19")  // DON'T DO THIS
```

✅ **Correct:** Setting as Firestore Timestamp
```javascript
planExpiryDate: admin.firestore.Timestamp.fromDate(new Date("2025-01-19"))
```

## Summary

**The exact value should be:**
- **Type:** Firestore Timestamp
- **Value:** Current date + 30 days
- **Format:** `Timestamp(seconds: UNIX_TIMESTAMP, nanoseconds: 0)`

**Easiest method:** Use the API endpoint to automatically set the correct value.
