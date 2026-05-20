# Firebase Deployment Plan

## Project Configuration
- **Project ID:** `recruitorv-1291c`
- **Firebase CLI Version:** 15.3.1
- **Node.js Version:** 20 (for Cloud Functions)

## Deployment Steps

### Step 1: Verify Firebase Login
- Check if logged in to Firebase CLI

### Step 2: Deploy Cloud Functions (Backend)
- Navigate to Backend directory
- Deploy all functions to Firebase
- This includes all API endpoints for:
  - `/auth/**`
  - `/clientspoc/**`
  - `/admin/**`
  - `/candidate/**`
  - `/addit/**`
  - `/download/**`
  - `/api/**`
  - `/blog/**`
  - `/recruiterstats/**`
  - `/clientspocstats/**`
  - `/positionstats/**`
  - `/dashboardstats/**`
  - `/candidatestats/**`
  - `/clientstats/**`

### Step 3: Deploy Firebase Hosting (Frontend)
- Deploy the built frontend from `Frontend/dist/`
- Configure rewrites to Cloud Functions
- Apply headers for CORS

### Step 4: Verify Deployment
- Test frontend URL
- Test API endpoints
- Verify all rewrites are working

## Configuration Files
- `.firebaserc` - Project mapping
- `firebase.json` - Hosting, Functions, and Firestore configuration
- `Backend/package.json` - Node.js 20 runtime with dependencies
- `Frontend/package.json` - React + Vite build configuration

## Deployment Commands
```bash
# Deploy backend (Cloud Functions)
cd Backend && firebase deploy --only functions

# Deploy frontend (Hosting)
firebase deploy --only hosting

# Deploy both together
firebase deploy
```

## Expected Output
- Frontend URL: https://recruitorv-1291c.web.app
- API URL: https://recruitorv-1291c.cloudfunctions.net/api

