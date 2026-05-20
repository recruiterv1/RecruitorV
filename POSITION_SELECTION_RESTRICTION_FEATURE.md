# Position Selection Restriction for Free Plan Users

## Date
December 2024

## Feature Overview
Prevent free plan users (planType: 0) who have reached their 2-position limit from selecting/clicking on additional positions in the Open Positions table.

## Implementation

### File Modified
`Frontend/src/pages/Dash_Pos.jsx`

### Changes Made

#### 1. Added Imports
```javascript
import { useContext } from 'react';
import { Lock } from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
```

#### 2. Added State and Context
```javascript
const { user } = useContext(UserStateContext);
const [planInfo, setPlanInfo] = useState(null);
```

#### 3. Added Plan Info Fetching
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

#### 4. Added Selection Check
```javascript
const canSelectPosition = user?.planType !== 0 || planInfo?.canCreatePosition !== false;
```

#### 5. Updated Row Click Handler
```javascript
muiTableBodyRowProps: ({ row }) => ({
  onClick: () => {
    if (!canSelectPosition) {
      alert('You have reached your Free Plan limit of 2 positions. Please upgrade to Paid Plan to work on more positions.');
      return;
    }
    navigate(`/dash_view/${row.original.pos_id}`);
  },
  sx: {
    cursor: canSelectPosition ? 'pointer' : 'not-allowed',
    opacity: canSelectPosition ? 1 : 0.6,
    '&:hover': {
      backgroundColor: canSelectPosition ? '#eff6ff' : '#fee2e2',
    },
    transition: 'all 0.3s',
  },
}),
```

## User Experience

### For Paid Plan Users (planType: 1)
- ✅ Can click on any position
- ✅ Normal cursor (pointer)
- ✅ Normal opacity (100%)
- ✅ Blue hover effect

### For Free Plan Users with Credits Available
- ✅ Can click on positions
- ✅ Normal cursor (pointer)
- ✅ Normal opacity (100%)
- ✅ Blue hover effect

### For Free Plan Users with Exhausted Credits (2/2 positions)
- ❌ Cannot click on positions
- 🚫 Cursor shows "not-allowed"
- 👁️ Reduced opacity (60%)
- 🔴 Red hover effect
- ⚠️ Alert message: "You have reached your Free Plan limit of 2 positions. Please upgrade to Paid Plan to work on more positions."

## Visual Indicators

### Normal State (Can Select)
- Cursor: `pointer`
- Opacity: `1` (100%)
- Hover: Blue background (`#eff6ff`)

### Restricted State (Cannot Select)
- Cursor: `not-allowed`
- Opacity: `0.6` (60%)
- Hover: Red background (`#fee2e2`)

## Logic Flow

```
User clicks on position row
    ↓
Check: canSelectPosition?
    ↓
    ├─ YES (Paid or Free with credits)
    │   └─ Navigate to position details
    │
    └─ NO (Free with 2 positions)
        └─ Show alert message
        └─ Prevent navigation
```

## Backend Integration

Uses the existing `/auth/check-plan-limits` endpoint which returns:

```json
{
  "success": true,
  "planInfo": {
    "canCreatePosition": false,  // ← Key field
    "currentPositionCount": 2,
    "maxPositions": 2,
    "daysRemaining": 25
  }
}
```

## Testing Scenarios

### Test 1: Paid User
1. Login as paid user (planType: 1)
2. Go to Open Positions page
3. Click any position
4. ✅ Should navigate to position details

### Test 2: Free User with 0 Positions
1. Login as free user with 0 positions
2. Go to Open Positions page
3. Click any position
4. ✅ Should navigate to position details

### Test 3: Free User with 1 Position
1. Login as free user with 1 position
2. Go to Open Positions page
3. Click any position
4. ✅ Should navigate to position details

### Test 4: Free User with 2 Positions (Exhausted)
1. Login as free user with 2 positions
2. Go to Open Positions page
3. Notice rows are dimmed (60% opacity)
4. Hover over row → Red background
5. Cursor shows "not-allowed"
6. Click any position
7. ❌ Alert appears: "You have reached your Free Plan limit..."
8. ❌ Does NOT navigate to position details

## Benefits

1. **Clear Visual Feedback:** Users immediately see they can't select more positions
2. **Prevents Confusion:** Alert message explains why they can't proceed
3. **Encourages Upgrades:** Prompts users to upgrade to Paid Plan
4. **Consistent UX:** Matches the dashboard banner restrictions
5. **No Backend Changes:** Uses existing API endpoint

## Related Features

- Dashboard "Credits Exhausted" banner
- Position creation validation in backend
- Plan type registration form
- Pricing page

## Files Modified

1. ✅ `Frontend/src/pages/Dash_Pos.jsx` - Position selection restriction

## Deployment

```bash
cd Frontend
npm run build
npx firebase-tools deploy --only hosting
```

## Production URL

https://www.recruiterv.com/dash_position
