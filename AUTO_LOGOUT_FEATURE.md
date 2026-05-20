# Auto-Logout After 30 Minutes Inactivity - Implementation Summary

## Overview
This feature automatically logs out recruiters after 30 minutes of inactivity to enhance security and maintain accurate "last active" tracking. The system monitors user activity and gracefully handles the logout process with user notification.

## Key Features

### 1. Activity Monitoring
- Tracks multiple types of user interactions:
  - Mouse movements
  - Mouse clicks
  - Keyboard input
  - Scrolling
  - Touch events (mobile support)

### 2. Smart Activity Updates
- **Throttling**: Activity events are throttled to once per second to prevent excessive processing
- **Backend Updates**: Sends activity updates to backend every 5 minutes (not on every action)
- **Efficient**: Minimizes API calls while maintaining accurate tracking

### 3. Inactivity Detection
- Checks for inactivity every 1 minute
- Auto-logout triggers after exactly 30 minutes of no activity
- Clean logout process with proper state management

### 4. User Experience
- Displays clear message on login page: "You have been logged out due to inactivity."
- Seamless redirect to login page
- No data loss or corruption

### 5. Selective Application
- **Only affects recruiters** - Admin users are NOT subject to auto-logout
- Activates only when user is logged in and verified
- Automatically disabled when user logs out

## Technical Implementation

### Backend Changes

#### New Endpoint: `/auth/update-activity`
```javascript
POST /auth/update-activity
Authentication: Required (JWT token in cookie)
```

**Purpose**: Updates the recruiter's `lastActive` timestamp without requiring full re-authentication

**Response**:
```json
{
  "message": "Activity updated successfully",
  "lastActive": "2024-01-15T10:30:00.000Z"
}
```

**Error Handling**:
- 401/403: Triggers immediate logout on frontend
- 404: User not found
- 500: Server error

### Frontend Changes

#### 1. Custom Hook: `useInactivityLogout.js`

**Location**: `Frontend/src/hooks/useInactivityLogout.js`

**Parameters**:
- `onLogout` (Function): Callback to execute when logout should occur
- `isActive` (Boolean): Whether the hook should be active

**Key Constants**:
```javascript
INACTIVITY_TIMEOUT = 30 * 60 * 1000;        // 30 minutes
ACTIVITY_UPDATE_INTERVAL = 5 * 60 * 1000;   // 5 minutes
CHECK_INTERVAL = 60 * 1000;                  // 1 minute
```

**How It Works**:
1. Attaches event listeners for user activity
2. Throttles events to once per second
3. Updates `lastActivityTime` on any activity
4. Sends backend update every 5 minutes when active
5. Checks for inactivity every minute
6. Triggers logout callback after 30 minutes of inactivity
7. Cleans up all timers and listeners on unmount

#### 2. Auth Context Integration: `AuthPro.jsx`

**Changes Made**:
- Imported `useInactivityLogout` hook
- Added `handleInactivityLogout` function
- Integrated hook with proper activation logic

**Activation Logic**:
```javascript
const isRecruiterLoggedIn = state.user?.type === "recruiter" && !isChecking;
useInactivityLogout(handleInactivityLogout, isRecruiterLoggedIn);
```

**Logout Handler**:
```javascript
const handleInactivityLogout = async () => {
  // 1. Call logout API
  await axios.post("/auth/logout", {}, { withCredentials: true });
  
  // 2. Update auth state
  dispatch({ type: "LOGOUT" });
  
  // 3. Redirect with message
  navigate("/log_rec", { 
    state: { message: "You have been logged out due to inactivity." } 
  });
};
```

#### 3. Login Page Enhancement: `Login.jsx`

**Changes Made**:
- Added `useLocation` hook to detect navigation state
- Displays inactivity message if present
- Clears message from browser history after display

**Message Display**:
```javascript
useEffect(() => {
  if (location.state?.message) {
    setMessage(location.state.message);
    window.history.replaceState({}, document.title);
  }
}, [location]);
```

## User Flow

### Normal Activity Flow
```
1. User logs in
   ↓
2. Inactivity hook activates
   ↓
3. User performs actions (clicks, types, scrolls)
   ↓
4. Activity tracked locally (throttled)
   ↓
5. Backend updated every 5 minutes
   ↓
6. User continues working normally
```

### Inactivity Flow
```
1. User stops all activity
   ↓
2. Timer continues counting
   ↓
3. After 30 minutes of no activity
   ↓
4. Logout callback triggered
   ↓
5. API logout call made
   ↓
6. Auth state cleared
   ↓
7. Redirect to login page
   ↓
8. Message displayed: "You have been logged out due to inactivity."
```

## Security Benefits

1. **Session Security**: Prevents unauthorized access to unattended sessions
2. **Data Protection**: Reduces risk of data exposure on shared computers
3. **Compliance**: Helps meet security compliance requirements
4. **Audit Trail**: Accurate last active timestamps for monitoring

## Performance Considerations

### Optimizations Implemented

1. **Event Throttling**: 
   - Activity events throttled to 1 per second
   - Prevents excessive function calls

2. **Backend Update Batching**:
   - Updates sent every 5 minutes, not on every action
   - Reduces API calls by ~99%

3. **Efficient Timers**:
   - Single interval for inactivity checks (1 minute)
   - Proper cleanup prevents memory leaks

4. **Passive Event Listeners**:
   - Uses `{ passive: true }` for scroll/touch events
   - Improves scrolling performance

### Resource Usage

- **Memory**: Minimal (3 timers + event listeners)
- **CPU**: Negligible (throttled events + 1-minute checks)
- **Network**: ~12 API calls per hour when active (1 every 5 minutes)

## Configuration

### Adjustable Parameters

To modify timeout durations, edit `Frontend/src/hooks/useInactivityLogout.js`:

```javascript
// Change inactivity timeout (currently 30 minutes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Change backend update frequency (currently 5 minutes)
const ACTIVITY_UPDATE_INTERVAL = 5 * 60 * 1000;

// Change inactivity check frequency (currently 1 minute)
const CHECK_INTERVAL = 60 * 1000;
```

## Testing Checklist

### Functional Testing
- [ ] User activity is detected (mouse, keyboard, scroll)
- [ ] Backend receives activity updates every 5 minutes
- [ ] Auto-logout occurs after 30 minutes of inactivity
- [ ] Logout message displays on login page
- [ ] User can log back in after auto-logout
- [ ] Admin users are NOT affected by auto-logout

### Edge Cases
- [ ] Multiple tabs/windows handling
- [ ] Network failure during activity update
- [ ] Browser tab in background
- [ ] Mobile device sleep/wake
- [ ] Rapid login/logout cycles

### Performance Testing
- [ ] No memory leaks after extended use
- [ ] Event throttling works correctly
- [ ] No UI lag during activity tracking
- [ ] Proper cleanup on component unmount

## Troubleshooting

### Issue: Auto-logout not working

**Possible Causes**:
1. Hook not activated (check `isRecruiterLoggedIn` condition)
2. Event listeners not attached
3. Backend endpoint not responding

**Debug Steps**:
```javascript
// Add console logs in useInactivityLogout.js
console.log('Hook active:', isActive);
console.log('Last activity:', new Date(lastActivityTime.current));
console.log('Time since activity:', timeSinceLastActivity);
```

### Issue: Too frequent logouts

**Possible Causes**:
1. Activity not being detected
2. Backend updates failing
3. Timeout value too low

**Solution**:
- Check browser console for errors
- Verify `/auth/update-activity` endpoint is working
- Increase `INACTIVITY_TIMEOUT` if needed

### Issue: Admin users being logged out

**Possible Causes**:
1. User type not set correctly
2. Activation condition incorrect

**Solution**:
- Verify `state.user?.type === "recruiter"` check
- Ensure admin users have `type: "admin"` in state

## Files Modified

1. **Backend**:
   - `Backend/router/rout.js` - Added `/auth/update-activity` endpoint

2. **Frontend**:
   - `Frontend/src/hooks/useInactivityLogout.js` - New custom hook
   - `Frontend/src/context/AuthPro.jsx` - Integrated hook
   - `Frontend/src/components/Login.jsx` - Display inactivity message

3. **Documentation**:
   - `TODO.md` - Updated progress tracker
   - `AUTO_LOGOUT_FEATURE.md` - This file

## Future Enhancements (Optional)

1. **Warning Before Logout**:
   - Show modal 2 minutes before auto-logout
   - Allow user to extend session

2. **Configurable Timeout**:
   - Admin panel setting for timeout duration
   - Different timeouts for different user roles

3. **Activity Dashboard**:
   - Show real-time activity status
   - Display time until auto-logout

4. **Session Extension**:
   - "Keep me logged in" option
   - Extend session without full re-login

5. **Multi-Tab Sync**:
   - Sync activity across browser tabs
   - Prevent logout in one tab while active in another

## Conclusion

The auto-logout feature enhances security while maintaining a smooth user experience. It works seamlessly with the existing last active tracking feature and provides accurate activity monitoring for all recruiters.
