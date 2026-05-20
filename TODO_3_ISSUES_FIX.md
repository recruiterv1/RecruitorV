# TODO: Fix ClientSPOC Dashboard Sidebar Issues

## Issues to Fix:
1. ✅ Issue 1: Sidebar changes to recruiter sidebar for ClientSPOC users - **FIXED**
2. ✅ Issue 2: Missing "All Coach" and "All Expert" menu items - **FIXED**
3. ✅ Issue 3: Sidebar changes when clicking on profile - **FIXED**

## Implementation Steps:

### Step 1: Add All Coach and All Expert menu items to ClientSpocSidebar ✅
- **File**: `Frontend/src/components/Dash_View_ClientSpocSidebar.jsx`
- **Action**: Added menu items for "All Coaches" (/all-coaches) and "All Experts" (/all-experts)
- **Status**: ✅ COMPLETED

### Step 2: Update Profile page to use ClientSpocSidebar for ClientSPOC users ✅
- **File**: `Frontend/src/pages/Profile.jsx`
- **Action**: Imported ClientSpocSidebar and conditionally use it for ClientSPOC users
- **Status**: ✅ COMPLETED

### Step 3: Add routes and update AllCoaches page for proper sidebar ✅
- **File**: `Frontend/src/App.jsx` and `Frontend/src/pages/AllCoaches.jsx`
- **Action**: Added routes for /all-coaches and /all-experts, updated AllCoaches.jsx to use ClientSpocSidebar for ClientSPOC users
- **Status**: ✅ COMPLETED

## Completion Status:
- [x] All issues fixed
- [x] Profile page now uses ClientSpocSidebar for ClientSPOC users
- [x] All Coach and All Expert menu items appear in ClientSPOC sidebar
- [x] Routes for /all-coaches and /all-experts are configured
- [ ] Test Profile page for ClientSPOC users (manual verification needed)
- [ ] Test All Coaches page for ClientSPOC users (manual verification needed)

