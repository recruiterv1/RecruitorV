# Recruiter Plan Type Feature - Complete Implementation Guide

## Overview
This document describes the implementation of the Free vs Paid plan type feature for recruiters in the RecruiterV platform.

## Feature Requirements
- **Free Plan (planType: 0)**: 
  - Maximum 2 positions
  - 30 days access from registration date
  - Basic features
  
- **Paid Plan (planType: 1)**: 
  - Unlimited positions
  - No time limit
  - All premium features
  
- **Existing Recruiters**: 
  - Automatically assigned planType: 1 (Paid)
  - Unlimited access maintained

---

## Implementation Details

### 1. Database Schema Changes

#### New Fields Added to `recruiter_db`:
```javascript
{
  planType: Number,           // 0 = Free, 1 = Paid
  registrationDate: Date,     // Date of registration
  maxPositions: Number|null,  // 2 for free, null for paid (unlimited)
  planExpiryDate: Date|null   // registrationDate + 30 days for free, null for paid
}
```

### 2. Backend Changes

#### A. Model Updates (`Backend/model_fire/recruiterF.js`)
**New Functions Added:**
- `findRecruiterById(id)` - Get recruiter by document ID
- `checkPlanLimits(recruiterId)` - Validate plan restrictions
- `getRecruiterPositionCount(recruiterEmail)` - Count positions created by recruiter
- `getAllRecruiters()` - Get all recruiters (for migration)

**Plan Validation Logic:**
```javascript
// Returns object with:
{
  valid: boolean,              // Can create position?
  isPaid: boolean,             // Is paid plan?
  message: string,             // Error message if invalid
  expired: boolean,            // Plan expired?
  limitReached: boolean,       // Position limit reached?
  positionsUsed: number,       // Current position count
  positionsRemaining: number,  // Remaining positions
  daysRemaining: number        // Days until expiry
}
```

#### B. Registration Endpoint (`Backend/router/rout.js`)
**Updated `/register` endpoint:**
- Accepts `planType` parameter
- Calculates `registrationDate`, `maxPositions`, `planExpiryDate` based on plan
- Defaults to paid plan (planType: 1) for non-recruiters

**Logic:**
```javascript
if (roleCategory === "Recruiter") {
  if (planType === 0) {
    // Free plan
    maxPositions = 2
    planExpiryDate = registrationDate + 30 days
  } else {
    // Paid plan
    maxPositions = null (unlimited)
    planExpiryDate = null
  }
}
```

#### C. Login/Session Endpoints (`Backend/router/rout.js`)
**Updated to return plan information:**
- `/rec_verify` (login)
- `/check` (session check)

**Returns:**
```javascript
{
  user: {
    name, email, roleCategory, experienceCategory,
    planType, maxPositions, planExpiryDate, registrationDate
  }
}
```

#### D. New Endpoint (`Backend/router/rout.js`)
**`GET /check-plan-limits`** - Check current plan status
- Requires authentication
- Returns plan info and validation status

#### E. Position Creation Validation (`Backend/router/position.js`)
**Updated `POST /pos` endpoint:**
- Added authentication middleware
- Validates plan limits before creating position
- Returns appropriate error messages for:
  - Expired free plans
  - Position limit reached
  - Unauthorized access

**Error Responses:**
```javascript
// Plan expired
{
  success: false,
  message: "Your free plan has expired (30 days limit). Please upgrade to continue.",
  expired: true
}

// Limit reached
{
  success: false,
  message: "You have reached the maximum limit of 2 positions for the free plan.",
  limitReached: true,
  planInfo: { planType, currentCount, maxPositions }
}
```

### 3. Frontend Changes

#### A. Registration Form (`Frontend/src/components/Register.jsx`)
**Added Plan Type Selection:**
- Radio button group for Free vs Paid plan
- Only shown when roleCategory === "Recruiter"
- Visual comparison of plan features
- Default selection: Paid plan

**UI Features:**
- Free Plan Card:
  - ₹0 pricing
  - Up to 2 positions
  - 30 days access
  - Basic features
  
- Paid Plan Card:
  - Contact Us pricing
  - Unlimited positions
  - No time limit
  - All premium features
  - "POPULAR" badge

**Form State:**
```javascript
{
  planType: "1",  // Default to paid
  // ... other fields
}
```

**Submission:**
- Sends `planType` as integer (0 or 1)
- Only for recruiters (others default to paid)

### 4. Migration Script

#### File: `Backend/scripts/migratePlanType.js`
**Purpose:** Update existing recruiters with plan type fields

**What it does:**
1. Fetches all recruiters from database
2. Checks if already has `planType` field
3. Updates missing fields with:
   - `planType: 1` (Paid)
   - `registrationDate: current date`
   - `maxPositions: null` (unlimited)
   - `planExpiryDate: null` (no expiry)

**How to run:**
```bash
cd Backend
node scripts/migratePlanType.js
```

**Output:**
- Success count
- Skip count (already migrated)
- Error count
- Detailed logs for each recruiter

---

## API Endpoints Summary

### Registration & Authentication
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/register` | POST | No | Register with plan type |
| `/auth/rec_verify` | POST | No | Login (returns plan info) |
| `/auth/check` | GET | Yes | Session check (returns plan info) |
| `/auth/check-plan-limits` | GET | Yes | Check current plan limits |

### Position Management
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/admin/pos` | POST | Yes | Create position (validates plan) |
| `/admin/pos/show` | GET | No | List all positions |

---

## Testing Checklist

### Registration Testing
- [ ] Register as Recruiter with Free plan
- [ ] Register as Recruiter with Paid plan
- [ ] Register as Coach (should default to paid)
- [ ] Register as Expert (should default to paid)
- [ ] Verify plan fields in database

### Position Creation Testing
- [ ] Free plan: Create 1st position (should succeed)
- [ ] Free plan: Create 2nd position (should succeed)
- [ ] Free plan: Create 3rd position (should fail with limit error)
- [ ] Paid plan: Create multiple positions (should succeed)
- [ ] Free plan after 30 days: Create position (should fail with expiry error)

### Migration Testing
- [ ] Run migration script
- [ ] Verify all existing recruiters have planType: 1
- [ ] Verify existing recruiters can create positions
- [ ] Run migration again (should skip already migrated)

### Login Testing
- [ ] Login returns plan information
- [ ] Session check returns plan information
- [ ] Plan limits endpoint works correctly

---

## Database Queries for Verification

### Check recruiter plan type:
```javascript
db.collection('recruiter_db')
  .where('email', '==', 'test@example.com')
  .get()
```

### Count positions by recruiter:
```javascript
db.collection('position_db')
  .where('hr_name', '==', 'test@example.com')
  .get()
  .then(snapshot => snapshot.size)
```

### Find recruiters without planType:
```javascript
db.collection('recruiter_db')
  .where('planType', '==', null)
  .get()
```

---

## Error Handling

### Common Errors and Solutions

**Error: "Plan expired"**
- Cause: Free plan user trying to create position after 30 days
- Solution: Upgrade to paid plan or contact admin

**Error: "Position limit reached"**
- Cause: Free plan user trying to create 3rd position
- Solution: Upgrade to paid plan or delete existing positions

**Error: "Unauthorized"**
- Cause: Not logged in or invalid token
- Solution: Login again

**Error: "User not found"**
- Cause: Invalid email or deleted account
- Solution: Register again or contact support

---

## Future Enhancements

### Potential Features:
1. **Plan Upgrade Flow**
   - In-app upgrade button
   - Payment integration
   - Automatic plan upgrade

2. **Plan Dashboard**
   - Show current plan status
   - Display usage statistics
   - Show days/positions remaining

3. **Email Notifications**
   - Plan expiry warnings (7 days, 3 days, 1 day)
   - Position limit warnings
   - Upgrade reminders

4. **Admin Panel**
   - Manually upgrade users
   - View plan statistics
   - Generate reports

5. **Multiple Plan Tiers**
   - Basic (2 positions, 30 days)
   - Standard (10 positions, 90 days)
   - Premium (unlimited, lifetime)

---

## Deployment Steps

1. **Backup Database**
   ```bash
   # Create Firestore backup before deployment
   ```

2. **Deploy Backend**
   ```bash
   cd Backend
   npm install
   # Deploy to production
   ```

3. **Run Migration**
   ```bash
   node scripts/migratePlanType.js
   ```

4. **Deploy Frontend**
   ```bash
   cd Frontend
   npm install
   npm run build
   # Deploy to production
   ```

5. **Verify Deployment**
   - Test registration with both plans
   - Test position creation limits
   - Verify existing users can login
   - Check database for plan fields

---

## Support & Maintenance

### Monitoring
- Track plan type distribution
- Monitor position creation failures
- Track plan expiry rates
- Analyze upgrade conversion

### Maintenance Tasks
- Regular database backups
- Monitor plan expiry dates
- Clean up expired free accounts (optional)
- Update plan features as needed

---

## Contact & Documentation

**Implementation Date:** [Current Date]
**Version:** 1.0.0
**Status:** ✅ Complete

For questions or issues, please contact the development team.
