# Client SPOC Statistics - Troubleshooting Guide

## Current Status

**Deployment**: In progress (4th attempt)
**Issue**: "Failed to fetch Client SPOC statistics" persists
**Fixes Applied**:
1. ✅ Completed ClientSpocStats.jsx component
2. ✅ Added to SuperAdmin menu
3. ✅ Added vite.config.js proxy (dev only)
4. ✅ Added firebase.json rewrites (production)

## Diagnostic Steps

### 1. Check Browser Network Tab

Open DevTools → Network tab and look for:

```
Request URL: https://www.recruiterv.com/clientspocstats/all
Request Method: GET
Status Code: Should be 200 OK
```

**If you see:**
- `404 Not Found` → Rewrite rules not working
- `500 Internal Server Error` → Backend issue
- `CORS error` → CORS configuration issue
- `Failed to fetch` → Network/routing issue

### 2. Check Firebase Hosting Configuration

The firebase.json should have:

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/clientspocstats/**",
        "function": "api"
      }
    ]
  }
}
```

### 3. Verify Backend Route

Check that Backend/index.js has:

```javascript
const clientspocStats = require("./router/clientspocStats.js");
app.use("/clientspocstats", clientspocStats);
```

### 4. Test API Directly

Try accessing the API directly:

```bash
curl https://www.recruiterv.com/clientspocstats/all
```

Expected response: JSON with SPOC data
If 404: Rewrite rules not deployed
If 500: Backend error

### 5. Check Cloud Function Logs

1. Go to Firebase Console
2. Navigate to Functions
3. Check logs for the `api` function
4. Look for errors when `/clientspocstats/all` is called

## Possible Issues

### Issue 1: Firebase Hosting Cache

**Symptom**: Changes deployed but old version still showing

**Solution**:
```bash
# Clear browser cache
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Or use incognito mode
```

### Issue 2: Rewrite Rules Not Deployed

**Symptom**: 404 errors for /clientspocstats/all

**Check**:
```bash
# View deployed firebase.json
npx firebase hosting:channel:list

# Redeploy hosting only
npx firebase deploy --only hosting
```

### Issue 3: Backend Route Not Registered

**Symptom**: 404 from Cloud Function

**Check Backend/index.js**:
```javascript
// Should have this line
app.use("/clientspocstats", clientspocStats);
```

### Issue 4: CORS Issues

**Symptom**: CORS policy errors in console

**Check Backend/index.js**:
```javascript
app.use(cors({
  origin: true,
  credentials: true,
}));
```

### Issue 5: Function Not Deployed

**Symptom**: Function exists but not responding

**Solution**:
```bash
# Redeploy functions
npx firebase deploy --only functions
```

## Alternative Deployment Strategy

If standard deployment isn't working, try:

### Option 1: Deploy Hosting Only
```bash
cd Frontend
npm run build
cd ..
npx firebase deploy --only hosting
```

### Option 2: Deploy Functions Only
```bash
npx firebase deploy --only functions
```

### Option 3: Deploy Everything
```bash
npx firebase deploy
```

### Option 4: Force Redeploy
```bash
# Delete .firebase cache
rm -rf .firebase

# Rebuild and redeploy
cd Frontend && npm run build && cd ..
npx firebase deploy
```

## Debugging the API Call

Add console logging to ClientSpocStats.jsx:

```javascript
const fetchClientSpocStats = async () => {
  setLoading(true);
  setError(null);
  try {
    console.log('Fetching from:', '/clientspocstats/all');
    const response = await axios.get('/clientspocstats/all');
    console.log('Response:', response);
    
    if (response.data.success) {
      setSpocs(response.data.spocs);
    } else {
      setError('Failed to fetch Client SPOC statistics');
    }
  } catch (err) {
    console.error('Full error:', err);
    console.error('Error response:', err.response);
    console.error('Error request:', err.request);
    setError(err.response?.data?.message || 'Failed to load Client SPOC statistics');
  } finally {
    setLoading(false);
  }
};
```

## Check Axios Configuration

Verify axios is using relative URLs (not absolute):

```javascript
// ✅ Correct - relative URL
axios.get('/clientspocstats/all')

// ❌ Wrong - absolute URL
axios.get('http://localhost:5000/clientspocstats/all')
```

## Firebase Hosting Rewrite Rules Priority

Rules are processed in order. Make sure `/clientspocstats/**` comes BEFORE the catch-all `**`:

```json
{
  "rewrites": [
    { "source": "/clientspocstats/**", "function": "api" },  // ← Must be before **
    { "source": "**", "destination": "/index.html" }         // ← Catch-all last
  ]
}
```

## Test with RecruiterStats

Since RecruiterStats works, compare:

1. **API Call**:
   - RecruiterStats: `/recruiterstats/all` ✅ Works
   - ClientSpocStats: `/clientspocstats/all` ❌ Fails

2. **Firebase Rewrites**:
   - `/recruiterstats/**` → Present in firebase.json
   - `/clientspocstats/**` → Should be present now

3. **Backend Routes**:
   - `app.use("/recruiterstats", recruiterStats)` ✅
   - `app.use("/clientspocstats", clientspocStats)` ✅

## Manual Verification Steps

### Step 1: Check Deployed firebase.json

```bash
# Download currently deployed hosting config
npx firebase hosting:channel:list

# Or check Firebase Console → Hosting → View deployed files
```

### Step 2: Test Backend Locally

```bash
cd Backend
npm start

# In another terminal
curl http://localhost:5000/clientspocstats/all
```

### Step 3: Check Production Function

```bash
# Get function URL
npx firebase functions:config:get

# Test directly
curl https://us-central1-recruitorv-1291c.cloudfunctions.net/api/clientspocstats/all
```

## Common Mistakes

1. ❌ Forgot to rebuild frontend after changes
2. ❌ Deployed functions but not hosting
3. ❌ Deployed hosting but not functions
4. ❌ Browser cache showing old version
5. ❌ Rewrite rule in wrong order
6. ❌ Typo in route name
7. ❌ Backend route not registered

## Next Steps

If issue persists after deployment:

1. **Check browser console** for exact error
2. **Check network tab** for request/response
3. **Check Firebase Console** for function logs
4. **Test API directly** with curl
5. **Compare with working RecruiterStats** implementation

## Emergency Rollback

If needed, rollback to previous version:

```bash
# List previous deployments
npx firebase hosting:releases:list

# Rollback to specific version
npx firebase hosting:rollback
```

## Contact Points

- Firebase Console: https://console.firebase.google.com/project/recruitorv-1291c
- Function Logs: Console → Functions → Logs
- Hosting: Console → Hosting → Dashboard

---

**Last Updated**: Deployment in progress
**Status**: Troubleshooting active deployment
