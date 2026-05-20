# Dashboard Credits Banner Feature

## Overview
Added visual banners on the recruiter dashboard to display plan limits and "Credits Exhausted" message for Free Plan users who have reached their 2-position limit.

## Implementation Date
December 2024

## Features Implemented

### 1. Credits Exhausted Banner (Free Plan - Limit Reached)
**Displayed When:**
- User has `planType: 0` (Free Plan)
- User has created 2 or more positions
- `canCreatePosition: false` from backend

**Banner Design:**
- Red/Orange gradient background
- Alert icon
- "Credits Exhausted!" heading
- Clear message about reaching limit
- Shows: Positions Used (2/2)
- Shows: Plan Type (Free Plan)
- "Upgrade to Paid Plan" button → redirects to /pricing
- Dismissible with X button

### 2. Free Plan Info Banner (Free Plan - Credits Available)
**Displayed When:**
- User has `planType: 0` (Free Plan)
- User has NOT reached 2-position limit
- Still has credits available

**Banner Design:**
- Blue/Purple gradient background
- Trending Up icon
- "Free Plan Active" heading
- Shows remaining positions available
- Shows: Positions Used (e.g., 1/2)
- Shows: Days Remaining (e.g., 25 days)
- "Upgrade for Unlimited Access" button → redirects to /pricing
- Dismissible with X button

### 3. Quick Actions Banner (Paid Plan or Free with Credits)
**Displayed When:**
- User has `planType: 1` (Paid Plan), OR
- User has `planType: 0` but still has credits available

**Banner Design:**
- Blue/Orange gradient background
- "Ready to earn more?" message
- "View Positions" button

## Technical Implementation

### Frontend Changes

**File:** `Frontend/src/components/Dash_rec.jsx`

**New Imports:**
```javascript
import { useEffect } from 'react';
import { UserStateContext } from '../context/AuthPro';
import axios from 'axios';
import { AlertCircle, TrendingUp, X } from 'lucide-react';
```

**New State:**
```javascript
const { user } = useContext(UserStateContext);
const [planInfo, setPlanInfo] = useState(null);
const [showBanner, setShowBanner] = useState(true);
```

**API Call:**
```javascript
useEffect(() => {
  const fetchPlanInfo = async () => {
    if (user?.planType === 0) {
      try {
        const response = await axios.get('/auth/check-plan-limits', {
          withCredentials: true
        });
        if (response.data.success) {
          setPlanInfo(response.data.planInfo);
        }
      } catch (error) {
        console.error('Error fetching plan info:', error);
      }
    }
  };
  
  fetchPlanInfo();
}, [user]);
```

**Logic:**
```javascript
const isCreditsExhausted = user?.planType === 0 && planInfo?.canCreatePosition === false;
const isFreeUser = user?.planType === 0;
```

### Backend API Endpoint

**Endpoint:** `GET /auth/check-plan-limits`

**Already Implemented In:** `Backend/router/rout.js`

**Response Format:**
```json
{
  "success": true,
  "planInfo": {
    "planType": 0,
    "maxPositions": 2,
    "currentPositionCount": 2,
    "canCreatePosition": false,
    "daysRemaining": 25,
    "planExpiryDate": "2025-01-15T00:00:00.000Z"
  }
}
```

## User Experience Flow

### Scenario 1: Free User with 0 Positions
1. User logs in to dashboard
2. Sees "Free Plan Active" banner (blue/purple)
3. Banner shows: "You can create 2 more position(s)"
4. Shows days remaining
5. Can dismiss banner or click "Upgrade"

### Scenario 2: Free User with 1 Position
1. User logs in to dashboard
2. Sees "Free Plan Active" banner (blue/purple)
3. Banner shows: "You can create 1 more position(s)"
4. Shows: Positions Used 1/2
5. Shows days remaining

### Scenario 3: Free User with 2 Positions (Exhausted)
1. User logs in to dashboard
2. Sees "Credits Exhausted!" banner (red/orange)
3. Banner shows: "You've reached your Free Plan limit of 2 positions"
4. Shows: Positions Used 2/2
5. Prominent "Upgrade to Paid Plan" button
6. Quick Actions banner is HIDDEN

### Scenario 4: Paid User
1. User logs in to dashboard
2. NO plan limit banners shown
3. Sees normal "Ready to earn more?" Quick Actions banner
4. Full access to all features

## Visual Design

### Colors
- **Credits Exhausted:** Red (#EF4444) to Orange (#F97316) gradient
- **Free Plan Info:** Blue (#3B82F6) to Purple (#A855F7) gradient
- **Quick Actions:** Blue (#2563EB) to Orange (#F97316) gradient

### Icons
- **Credits Exhausted:** AlertCircle (warning icon)
- **Free Plan Info:** TrendingUp (growth icon)
- **Close Button:** X icon

### Responsive Design
- Mobile: Stacked layout
- Desktop: Horizontal layout with icon, content, and action button
- All banners are dismissible
- Smooth animations on show/hide

## Benefits

1. **Clear Communication:** Users immediately see their plan status
2. **Upgrade Prompts:** Strategic placement of upgrade buttons
3. **Transparency:** Shows exact usage (1/2, 2/2)
4. **Time Awareness:** Shows days remaining for free users
5. **Non-Intrusive:** Banners can be dismissed
6. **Visual Hierarchy:** Different colors for different states

## Testing Checklist

- [ ] Free user with 0 positions sees blue banner
- [ ] Free user with 1 position sees blue banner with "1 more position"
- [ ] Free user with 2 positions sees red "Credits Exhausted" banner
- [ ] Paid user sees NO plan limit banners
- [ ] Upgrade buttons redirect to /pricing page
- [ ] Banners can be dismissed with X button
- [ ] Banner state persists during session (until dismissed)
- [ ] Days remaining calculation is accurate
- [ ] Position count is accurate
- [ ] Mobile responsive design works correctly

## Future Enhancements

1. **Persistent Dismissal:** Store dismissed state in localStorage
2. **Animation:** Add slide-in animation on page load
3. **Progress Bar:** Visual progress bar for positions used
4. **Email Notifications:** Send email when credits are exhausted
5. **Grace Period:** Allow 1-2 extra days after expiry
6. **Upgrade Modal:** In-page upgrade modal instead of redirect

## Related Files

- `Frontend/src/components/Dash_rec.jsx` - Main dashboard component
- `Frontend/src/context/AuthPro.jsx` - User authentication context
- `Backend/router/rout.js` - Plan limits API endpoint
- `Frontend/src/pages/Pricing.jsx` - Pricing page for upgrades

## Deployment

**Frontend:** Deployed to Firebase Hosting
**Backend:** Already deployed (API endpoint exists)
**Status:** ✅ LIVE IN PRODUCTION

## Production URL

https://www.recruiterv.com/dash_rec
