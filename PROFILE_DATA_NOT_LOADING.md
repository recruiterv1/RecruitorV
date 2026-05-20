# 🔍 Profile Data Not Loading - Diagnostic Guide

## Issue: Database data not showing on profile page

Users are unable to see their existing profile data from the database on https://www.recruiterv.com/profile

---

## Step 1: Check Browser Console for Errors

1. Open browser DevTools (`Cmd + Option + I` on Mac, `Ctrl + Shift + I` on Windows)
2. Go to **Console** tab
3. Navigate to https://www.recruiterv.com/profile
4. Look for any red error messages, especially related to:
   - `Profile data fetch error`
   - `401 Unauthorized`
   - `403 Invalid or expired token`
   - `404 User not found`
   - `500` server errors

## Step 2: Check Network Requests

1. In DevTools, go to **Network** tab
2. Filter by **Fetch/XHR**
3. Look for requests to `/api/profile`
4. Check the response:
   - **Status 200**: API working, check response body
   - **Status 401/403**: Authentication issue
   - **Status 404**: User not found in database
   - **Status 500**: Server error

### Expected Response Format:
```json
{
  "success": true,
  "user": {
    "name": "...",
    "email": "...",
    "bio": "...",
    "skills": [...],
    "workExperience": [...],
    "education": [...]
  },
  "completion": {
    "percentage": 75,
    "missingFields": ["bio", "skills"]
  }
}
```

## Step 3: Common Issues & Solutions

### Issue A: Email Case Sensitivity
The database search normalizes emails to lowercase, but there might be a mismatch.

**Check:** Is the user's login email exactly the same as in the database?

### Issue B: User Not in Any Collection
The profile API searches these collections:
- `recruiter_db`
- `coach_db`
- `expert_db`
- `clientspoc`

**Solution:** Verify user exists in one of these Firestore collections.

### Issue C: JWT Token Expired
If authentication token is invalid, API returns 401/403.

**Solution:** Log out and log back in to get a fresh token.

### Issue D: Backend API Not Mounted Correctly
The profile router is mounted at `/api/profile`.

**Check:** Verify `Backend/index.js` has:
```javascript
const profile = require("./router/profile.js");
app.use("/api/profile", profile);
```

## Step 4: Manual Database Check

Run this query in Firebase Console to find user by email:

```javascript
// In Firebase Firestore Console
// Run in JavaScript console or use the query builder

// For recruiter_db
db.collection('recruiter_db')
  .where('email', '==', 'user@example.com')
  .get()

// For coach_db  
db.collection('coach_db')
  .where('email', '==', 'user@example.com')
  .get()

// For expert_db
db.collection('expert_db')
  .where('email', '==', 'user@example.com')
  .get()

// For clientspoc
db.collection('clientspoc')
  .where('email', '==', 'user@example.com')
  .get()
```

## Step 5: Test API Directly

Use curl or Postman to test the API:

```bash
# Get cookies from browser DevTools > Application > Cookies
# Copy the __session cookie value

curl -X GET "https://api.recruiterv.com/api/profile" \
  -H "Authorization: Bearer <idToken>" \
  -H "Cookie: __session=<sessionToken>"
```

## Step 6: Check Field Names Match

Database fields vs Frontend expectations:

| Database Field | Frontend Expects |
|---------------|------------------|
| `name` | ✅ |
| `email` | ✅ |
| `phone` | ✅ |
| `bio` | ✅ |
| `skills` | ✅ (array) |
| `workExperience` | ✅ (array, backend uses this name) |
| `education` | ✅ (array) |
| `currentCompany` | ✅ |
| `currentTitle` | ✅ |
| `linkedin` | ✅ |
| `twitter` | ✅ |
| `website` | ✅ |

## Step 7: Enable Debug Logging

Temporary fix to add more logging in `Backend/router/profile.js`:

```javascript
// Add at the top of findUserByEmail function
async function findUserByEmail(email) {
  console.log(`🔍 DEBUG: Searching for user with email: ${email}`);
  
  // Check recruiter
  let user = await recruiter.findRecruiterByEmail(email);
  if (user) {
    console.log(`✅ DEBUG: Found user in recruiter collection`);
    return { user, collection: 'recruiter' };
  }
  // ... rest of function
}
```

## Quick Fixes to Try

1. **Hard refresh page**: `Cmd + Shift + R`
2. **Clear browser cache**: As per PROFILE_CACHE_CLEAR.md
3. **Logout and login again**: Get fresh JWT token
4. **Try incognito window**: Bypass cache and test fresh
5. **Check on mobile**: Test on phone with cellular (not WiFi cache)

## If Still Not Working

Provide these details for debugging:
1. Browser console errors (screenshot)
2. Network tab response for `/api/profile` (screenshot)
3. User email being used to login
4. What data should be showing (specific fields)

