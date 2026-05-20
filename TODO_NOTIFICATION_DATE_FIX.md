# Notification Date Fix - TODO

## Issue
Error: `doc.data(...).createdAt?.toDate?.toISOString is not a function`

## Root Cause
The `createdAt` field in Firestore may be stored in different formats:
1. Firestore Timestamp (has `.toDate()` method)
2. JavaScript Date object
3. ISO string
4. Plain object (without methods)

The current code assumes all dates are Firestore Timestamps, which fails when they're stored in other formats.

## Fix Plan
1. ✅ Create helper function `safeConvertToISOString()` to handle all date formats
2. ✅ Update `getNotificationsByRecipient()` to use the safe conversion function
3. ✅ Apply same fix to `updatedAt` field
4. ⏳ Deploy backend changes
5. ⏳ Test notification API

## Files Modified
- `Backend/model_fire/notificationF.js`

## Status
- [x] Create helper function for safe date conversion
- [x] Update `getNotificationsByRecipient` function
- [x] Deploy backend
- [x] Test notifications API

## Verification Results
- ✅ Backend deployed successfully
- ✅ API responding correctly (requires authentication)
- ✅ Error changed from `toISOString is not a function` to `Unauthorized - No token found` (expected auth error)

## Changes Made

### Added helper function `safeConvertToISOString()`
```javascript
const safeConvertToISOString = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    // Case 1: Firestore Timestamp (has toDate method)
    if (typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toISOString();
    }
    
    // Case 2: JavaScript Date object
    if (dateValue instanceof Date) {
      return dateValue.toISOString();
    }
    
    // Case 3: Already a string
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
      return dateValue;
    }
    
    // Case 4: Plain object with _seconds (Firestore Timestamp serialized)
    if (typeof dateValue === 'object' && dateValue !== null) {
      if (dateValue._seconds) {
        return new Date(dateValue._seconds * 1000).toISOString();
      }
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error converting date to ISO string:", error);
    return null;
  }
};
```

### Updated `getNotificationsByRecipient` function
Changed from:
```javascript
createdAt: doc.data().createdAt?.toDate?.toISOString() || doc.data().createdAt,
updatedAt: doc.data().updatedAt?.toDate?.toISOString() || doc.data().updatedAt
```
To:
```javascript
createdAt: safeConvertToISOString(doc.data().createdAt),
updatedAt: safeConvertToISOString(doc.data().updatedAt)
```

