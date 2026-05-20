# ⚠️ BACKEND DEPLOYMENT REQUIRED

## Issue Identified

You registered a new recruiter, but the `planType`, `registrationDate`, `maxPositions`, and `planExpiryDate` fields were not added to the database.

**Root Cause:** The backend code has been updated locally, but **has NOT been deployed to your production server yet**.

---

## ✅ What's Already Done

**Frontend (DEPLOYED ✅):**
- Registration form with plan selection
- OTP redirect logic
- Pricing page with header link
- All frontend changes are LIVE at https://recruitorv-1291c.web.app

**Backend (CODE READY, NOT DEPLOYED ⚠️):**
- `Backend/router/rout.js` - Updated registration endpoint
- `Backend/model_fire/recruiterF.js` - Plan validation functions
- `Backend/router/position.js` - Position creation validation
- Code is ready but needs to be deployed to production server

---

## 🚀 How to Deploy Backend

### Option 1: If Using Firebase App Hosting / Cloud Functions

```bash
# From project root
firebase deploy --only functions
```

### Option 2: If Using Railway / Heroku / Similar Platform

```bash
# 1. Commit the changes
git add .
git commit -m "Add plan type feature to backend"

# 2. Push to your deployment branch
git push origin main  # or your deployment branch

# 3. Your platform should auto-deploy
# Check your platform's dashboard for deployment status
```

### Option 3: If Using Custom VPS / Server

```bash
# 1. SSH into your server
ssh user@your-server-ip

# 2. Navigate to your backend directory
cd /path/to/your/backend

# 3. Pull latest changes
git pull origin main

# 4. Install dependencies (if needed)
npm install

# 5. Restart the Node.js process
pm2 restart all  # if using PM2
# OR
systemctl restart your-app-name  # if using systemd
# OR
kill the process and restart: node index.js
```

---

## 🔍 How to Verify Backend is Deployed

### Test 1: Check Registration Endpoint

```bash
curl -X POST https://your-backend-url/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "mobile": "1234567890",
    "password": "test123",
    "roleCategory": "Recruiter",
    "experienceCategory": "Fresher",
    "planType": "0"
  }'
```

**Expected Response:** OTP sent message

### Test 2: Check Database After Registration

After registering a new user, check Firebase Console:
1. Go to Firestore Database
2. Open `recruiter_db` collection
3. Find the new user document
4. **Should see these fields:**
   - `planType`: 0 or 1
   - `registrationDate`: timestamp
   - `maxPositions`: 2 (for free) or null (for paid)
   - `planExpiryDate`: date (for free) or null (for paid)

---

## 📝 Backend Changes Summary

### File: `Backend/router/rout.js`

**Registration endpoint (`/register`) now:**
1. Accepts `planType` parameter from frontend
2. Calculates `registrationDate`, `maxPositions`, `planExpiryDate`
3. Stores all plan-related fields in database

**Code snippet:**
```javascript
// Add plan type fields only for Recruiters
if (roleCategory === "Recruiter") {
    const registrationDate = new Date();
    const selectedPlanType = parseInt(planType) || 1;
    
    recruiterData.planType = selectedPlanType;
    recruiterData.registrationDate = registrationDate;
    
    if (selectedPlanType === 0) {
        // Free plan: 2 positions max, 30 days limit
        recruiterData.maxPositions = 2;
        const expiryDate = new Date(registrationDate);
        expiryDate.setDate(expiryDate.getDate() + 30);
        recruiterData.planExpiryDate = expiryDate;
    } else {
        // Paid plan: unlimited
        recruiterData.maxPositions = null;
        recruiterData.planExpiryDate = null;
    }
}
```

### File: `Backend/model_fire/recruiterF.js`

**New functions added:**
- `checkPlanLimits(recruiterId)` - Validates plan restrictions
- `getRecruiterPositionCount(recruiterId)` - Counts positions
- `findRecruiterById(id)` - Get recruiter by ID
- `getAllRecruiters()` - For migration

### File: `Backend/router/position.js`

**Position creation now:**
1. Checks authentication
2. Validates plan limits before creating position
3. Returns clear error messages if limits exceeded

---

## 🎯 Next Steps

1. **Deploy Backend** using one of the options above
2. **Test Registration** with a new email
3. **Verify Database** has all plan fields
4. **Test Position Creation** with free plan (should limit to 2)
5. **Migrate Existing Users** (optional, see MIGRATION_GUIDE_EXISTING_USERS.md)

---

## 💡 Quick Test After Deployment

1. Go to: https://recruitorv-1291c.web.app/reg
2. Register as Recruiter with Free Plan
3. Verify OTP
4. Check Firebase Console → recruiter_db
5. Your new user should have:
   - `planType: 0`
   - `registrationDate: <timestamp>`
   - `maxPositions: 2`
   - `planExpiryDate: <30 days from now>`

---

## ❓ Need Help?

If you're unsure how to deploy your backend:
1. Check your hosting platform's documentation
2. Look for deployment logs in your platform's dashboard
3. Verify your backend URL is correct in frontend axios configuration

---

**Last Updated:** January 18, 2025
