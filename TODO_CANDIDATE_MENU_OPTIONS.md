# Candidate Menu Options Implementation

## Task: Add new status options to candidate status dropdown

### New Status Options Added:
1. **Test Assigned** - Hiring status (blue)
2. **Test Select** - Hiring status (blue)  
3. **Test Reject** - Rejection status (red, excluded from counts)
4. **Client Drop** - Rejection status (red, excluded from counts)
5. **Candidate Drop** - Rejection status (red, excluded from counts)
6. **Duplicate** - Excluded from counts (gray)

---

## Files Modified:

### Backend:
1. **`Backend/model_fire/adminF.js`** - Added new rejection statuses:
   - Test Reject, Client Drop, Candidate Drop, Duplicate

2. **`Backend/router/position.js`** - Added API endpoints for status updates

### Frontend:
3. **`Frontend/src/pages/Ad_Candi.jsx`** - Added 6 new status options to dropdown

---

## Status Color Coding:
- **Test Assigned**: Blue (in-progress)
- **Test Select**: Blue (in-progress)
- **Test Reject**: Red (rejection - excluded from counts)
- **Client Drop**: Red (rejection - excluded from counts)
- **Candidate Drop**: Red (rejection - excluded from counts)
- **Duplicate**: Gray (excluded from counts)
