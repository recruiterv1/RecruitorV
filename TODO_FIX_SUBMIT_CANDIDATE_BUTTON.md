# TODO: Fix Submit Candidate Button Visibility

## Issue
The "Submit Candidate" button is visible to recruiters on positions that are not assigned/approved by ClientSPOC.

## Root Cause
The current logic in `Dash_See.jsx` has separate checks for free users and assignment, but doesn't properly validate access status for all scenarios.

## Solution
Consolidate access check logic so the "Submit Candidate" button ONLY shows when:
1. Access status is 'approved' OR
2. The recruiter owns the position (created by them)

## Implementation Plan

### Step 1: Consolidate Access Check Logic
- [x] Check access status for ALL users (not just free users)
- [x] Check position ownership (created by recruiter)
- [x] Combine checks into single `canSubmitCandidate` state

### Step 2: Update Button Display Logic
- [x] If approved → Show "Submit Candidate"
- [x] If pending/waitlist → Show "Access Pending" (disabled)
- [x] If rejected/no request → Show "Assign Me" / "Request Again"

### Step 3: Simplify Assignment Logic
- [x] Keep "Assign Me" functionality for requesting access
- [x] Remove the complex assignment check that incorrectly grants Submit Candidate permission

## Files Modified
- `Frontend/src/pages/Dash_See.jsx`

## Changes Made

### 1. Added new state variable
- `isPositionOwner` - tracks if the recruiter created this position

### 2. Updated access check useEffect
- Now checks access status for ALL users (not just free users)
- Gets stats only for free users (to check 4 position limit)

### 3. Consolidated checkAssignment useEffect
- Step 1: Check if user owns the position (created by them)
- Step 2: Check access status - only 'approved' grants Submit Candidate
- Step 3: Handle pending, waitlist, rejected statuses properly

### 4. Updated button display logic
- Added "Access Pending" button (yellow, disabled) for pending/waitlist
- Added proper loading state for checking access
- Main "Submit Candidate" only shows when properly authorized

## Status
- [x] Plan created
- [x] Implementation complete
- [ ] Testing

## Testing Scenarios
1. Free user with no request → Should see "Assign Me"
2. Free user with pending request → Should see "Access Pending" (disabled)
3. Free user with waitlist request → Should see "Access Pending" (disabled)
4. Free user with rejected request → Should see "Request Again"
5. Free user with approved request → Should see "Submit Candidate"
6. Position owner (created by recruiter) → Should see "Submit Candidate"
7. Paid user with approved request → Should see "Submit Candidate"

