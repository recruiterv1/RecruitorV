# Registration Page Error Fix Plan

## Problem
The registration page shows "Something went wrong" error due to a JavaScript runtime error.

## Root Cause
In `Frontend/src/components/Register.jsx`, the `isRoleSelected` function references `roleComparisonMap` which is undefined, causing a runtime error that triggers the ErrorBoundary.

## Fixes Required

### 1. Fix undefined variable reference
**File:** `Frontend/src/components/Register.jsx`
- Change `roleComparisonMap` to `roleDisplayLabelMap` in the `isRoleSelected` function
- Line ~270: `roleComparisonMap[currentRole]` should be `roleDisplayLabelMap[currentRole]`

### 2. Add try-catch wrapper for form submission
- Wrap the API call in try-catch with better error handling
- Add validation for empty fields before submission
- Add console.error for debugging

### 3. Add defensive checks in handleChange
- Prevent errors when accessing undefined properties

## Implementation Steps
1. Read the current Register.jsx file
2. Fix the roleComparisonMap → roleDisplayLabelMap typo
3. Add error boundary improvements
4. Test the registration flow

## Files to Modify
- `Frontend/src/components/Register.jsx`

## Expected Outcome
The registration page should load without errors and users can successfully register.

