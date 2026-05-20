# Profile Form Edit Plan

## Objective
Simplify the profile creation flow by showing the profile form directly when a user clicks on their avatar, instead of showing a "Create My Profile" button first.

## Current Behavior
1. User clicks avatar → Navigates to `/profile`
2. If profile not found → Shows "Create My Profile" card with button
3. User clicks button → Profile created → Form shown

## Desired Behavior
1. User clicks avatar → Navigates to `/profile`
2. Always show profile form directly (whether profile exists or not)
3. If new user → Form has pre-filled name, email, phone from registration
4. User fills and saves form

## Changes Required

### File: `Frontend/src/pages/Profile.jsx`

1. **Remove ProfileNotFoundCard component usage**
   - Remove the conditional rendering that shows `ProfileNotFoundCard`
   - Instead, when `profileNotFound` is true, show the form with pre-filled data

2. **Modify the profile loading flow**
   - Keep the form data pre-filled from auth context/Firebase
   - Remove the "Create My Profile" button
   - User can directly edit and save the form

3. **Key changes:**
   - When `profileNotFound` is true, still show the full form (all tabs)
   - Pre-filled fields should be editable
   - Auto-save will work for new profile creation
   - Add a "Create Profile" auto-save trigger when form is first loaded

## Implementation Steps

1. Remove the `profileNotFound` conditional that returns `ProfileNotFoundCard`
2. Show the form directly - the form will be in edit mode
3. Pre-filled fields (name, email, phone) should be disabled (auto-filled from registration)
4. Other fields like bio, skills, etc. will be empty for new users
5. First save will create the profile
6. Auto-save functionality will handle the profile creation

## Files to Edit
- `Frontend/src/pages/Profile.jsx`

## Testing Checklist
- [ ] New user sees profile form with pre-filled basic info
- [ ] Pre-filled fields (name, email, phone) are displayed but not editable
- [ ] User can edit and save the profile
- [ ] Existing user sees their profile data
- [ ] All tabs work correctly for new users
- [ ] Profile creation works on first save

