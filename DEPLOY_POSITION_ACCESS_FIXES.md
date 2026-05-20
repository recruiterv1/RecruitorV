# Position Access Request System - Deployment Guide

## Files Modified

### 1. Frontend/src/pages/Dash_See.jsx
**Changes**: Fixed success notification message
- Added separate `showSuccessNotification` state
- Changed message from "Share link copied to clipboard!" to "Request sent successfully!"

### 2. Frontend/src/components/Admin.jsx  
**Changes**: Added Access Requests menu for ClientSPOC
- Imported `UserCheck` icon
- Imported `AccessRequestsManagement` component
- Added "Access Requests" menu item in sidebar

### 3. Frontend/src/pages/Dash_Pos.jsx
**Changes**: Added position selection limits enforcement
- Fetches access stats for free users
- Shows stats banner (X/4 positions, Y/2 approved, pending, days remaining)
- Displays warning/error messages when limits reached
- Prevents position selection when at limits
- Added link to "My Access Requests" page

### 4. Frontend/src/pages/Sidebar.jsx
**Changes**: Added "My Access Requests" link for free users
- Imported `ClipboardList` icon
- Conditionally shows "My Access Requests" menu item for planType = 0 users

## Deployment Steps

### Step 1: Rebuild Frontend
```bash
cd Frontend
npm run build
```

### Step 2: Deploy to Firebase (if using Firebase Hosting)
```bash
firebase deploy --only hosting
```

### Step 3: Clear Browser Cache
**Important**: Users must clear their browser cache to see the changes:
- Chrome/Edge: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
- Or use Incognito/Private mode for testing

### Step 4: Restart Backend (if needed)
```bash
cd Backend
# If using PM2
pm2 restart all

# Or if running directly
npm start
```

## Testing Checklist

### For Recruiter (planType = 0):

1. **Login and Navigate**
   - [ ] Login as free user
   - [ ] See "My Access Requests" in sidebar
   - [ ] Navigate to "Open Positions"

2. **Position List Page**
   - [ ] See stats banner showing:
     - Total Requested (X/4)
     - Currently Approved (Y/2)
     - Pending Approval
     - Days Remaining
   - [ ] See info banner explaining limits

3. **Request Access**
   - [ ] Click on a position
   - [ ] Click "Request Access" button
   - [ ] See "Request sent successfully!" notification (NOT "Share link copied")

4. **My Access Requests Page**
   - [ ] Click "My Access Requests" in sidebar
   - [ ] See list of all requests
   - [ ] See status (pending, approved, waitlist, rejected)
   - [ ] Can close approved positions

5. **Limit Testing**
   - [ ] With 2 approved positions: See warning banner
   - [ ] With 4 total requests: Cannot select more positions
   - [ ] Close 1 position: Can now request another

### For ClientSPOC:

1. **Dashboard Access**
   - [ ] Login as ClientSPOC
   - [ ] See "Access Requests" in sidebar menu

2. **Access Requests Management**
   - [ ] Click "Access Requests" menu
   - [ ] See AccessRequestsManagement page
   - [ ] See all requests for their positions
   - [ ] Filter by status works

3. **Manage Requests**
   - [ ] Can approve requests
   - [ ] Can waitlist requests
   - [ ] Can reject requests
   - [ ] Status updates correctly

## Troubleshooting

### Issue: Changes not visible after deployment
**Solution**: Clear browser cache completely or test in Incognito mode

### Issue: "My Access Requests" link not showing
**Solution**: 
- Verify user has planType = 0
- Check browser console for errors
- Rebuild frontend

### Issue: Stats banner not showing in position list
**Solution**:
- Verify user has planType = 0
- Check API endpoint `/api/position-access/recruiter/stats` is working
- Check browser console for errors

### Issue: "Access Requests" not in ClientSPOC sidebar
**Solution**:
- Rebuild frontend
- Clear browser cache
- Verify user is logged in as ClientSPOC

## API Endpoints Used

All these endpoints are already implemented in the backend:

- `GET /api/position-access/recruiter/stats` - Get recruiter access statistics
- `POST /api/position-access/request` - Create access request
- `GET /api/position-access/check/:positionId` - Check access to position
- `GET /api/position-access/recruiter` - Get all recruiter requests
- `GET /api/position-access/clientspoc` - Get all ClientSPOC requests
- `PUT /api/position-access/:requestId/status` - Update request status
- `DELETE /api/position-access/:requestId/close` - Close position request

## Environment Variables

No new environment variables required. All existing configuration works.

## Database Collections Used

- `position_access_requests` - Stores all access requests
- `recruiter_db` - Recruiter information
- `admin_AddPos` - Position information (includes clientspoc)
- `admin_db` - ClientSPOC information

## Success Criteria

✅ Recruiter sees correct success message when requesting access
✅ Recruiter sees "My Access Requests" link in sidebar (planType = 0 only)
✅ Recruiter sees stats banner in position list
✅ Position selection limits are enforced (max 4, max 2 approved)
✅ ClientSPOC sees "Access Requests" in sidebar
✅ ClientSPOC can manage requests (approve/waitlist/reject)

## Rollback Plan

If issues occur, revert these files to previous versions:
1. `Frontend/src/pages/Dash_See.jsx`
2. `Frontend/src/components/Admin.jsx`
3. `Frontend/src/pages/Dash_Pos.jsx`
4. `Frontend/src/pages/Sidebar.jsx`

Then rebuild and redeploy frontend.

---

**Deployment Date**: December 2024
**Status**: Ready for Production
