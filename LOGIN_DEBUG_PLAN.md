# Login Issue Debug Plan

## Problem Summary
Users getting "Invalid or Wrong Email or Password!" error after recent deployment.

## Root Cause Analysis

### 1. Email Case Sensitivity Issue
**Issue:** Users may have registered with mixed-case emails (e.g., "User@Example.COM"), but login normalizes to lowercase.

**Code Flow:**
```javascript
// Backend login (rout.js - rec_verify endpoint)
email = email.toLowerCase().trim();  // ✅ Normalized

// Backend recruiter lookup (recruiterF.js)
const normalizedEmail = email.toLowerCase();  // ✅ Normalized
const snap = await recruiter.where('email', '==', normalizedEmail).get()

// BUT: Registration stores email as-is from frontend (no normalization)
const recruiterData = { name, email, ... }  // ❌ No normalization
```

### 2. Frontend Not Normalizing Email
**Issue:** Frontend sends email without normalization:
```javascript
// Frontend (Login.jsx)
const res = await axios.post("/auth/rec_verify/", {
  email,  // Raw input, not normalized
  password,
}, ...
```

### 3. Inconsistent Email Handling
- **Coach registration**: `email: email.toLowerCase()` ✅
- **Expert registration**: `email: email.toLowerCase()` ✅
- **Recruiter registration**: `email` (as-is) ❌

## Fix Plan

### Step 1: Normalize Email in Frontend Login
**File:** `Frontend/src/components/Login.jsx`

```javascript
// In handleVerify function:
const res = await axios.post("/auth/rec_verify/", {
  email: email.toLowerCase().trim(),  // Add normalization
  password,
}, ...
```

### Step 2: Normalize Email in Frontend Registration
**File:** `Frontend/src/components/Register.jsx`

Add email normalization before sending to backend.

### Step 3: Add Backend Debug Logging
**File:** `Backend/router/rout.js`

Add detailed logging in `rec_verify` endpoint to debug future issues.

### Step 4: Database Migration (If Needed)
If users have mixed-case emails in database, we need to update them.

## Files to Modify

1. ✅ `Frontend/src/components/Login.jsx` - Add email normalization
2. ⏳ `Frontend/src/components/Register.jsx` - Add email normalization
3. ⏳ `Backend/router/rout.js` - Add debug logging
4. ⏳ Database migration script (if needed)

## Testing Checklist

- [ ] Test login with uppercase email (e.g., USER@EXAMPLE.COM)
- [ ] Test login with mixed-case email (e.g., User@Example.COM)
- [ ] Test login with lowercase email (e.g., user@example.com)
- [ ] Verify all return same result
- [ ] Check backend logs for email values

## Rollback Plan

If issues arise:
1. Remove frontend normalization
2. Keep existing backend normalization
3. Original behavior restored

