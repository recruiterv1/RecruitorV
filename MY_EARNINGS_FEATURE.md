# My Earnings Feature - Implementation Summary

## Overview
The "My Earnings" feature allows recruiters to view their estimated commission earnings from candidates who have received "Offer Accepted" or "Joining" status. This provides transparency and motivation for recruiters to track their successful placements.

## Feature Details

### What It Does
- Displays a table of all candidates with "Offer Accepted" or "Joining" status
- Shows Position Name, Candidate Name, CTC, Commission %, and calculated Commission Amount
- Calculates total estimated earnings
- Provides summary statistics (total earnings, successful placements, average commission)

### Commission Calculation
```
Commission Amount = (CTC Start × Commission Percent) / 100
```

For example:
- CTC Start: ₹10 Lakhs
- Commission: 8%
- Commission Amount: ₹80,000

## Files Created/Modified

### Backend Files

1. **Backend/model_fire/recruiterEarningsF.js** (NEW)
   - `getRecruiterEarnings(recruiterId, recruiterEmail)` - Fetches earnings data
   - `getEarningsSummary(recruiterId)` - Gets summary statistics
   - Filters candidates by recruiter ID and status
   - Joins with positions to get CTC and commission data
   - Calculates commission amounts

2. **Backend/router/recruiterEarnings.js** (NEW)
   - `GET /api/recruiter-earnings` - Main endpoint to get earnings
   - `GET /api/recruiter-earnings/summary` - Get summary stats
   - Authenticates user with `verifyToken` middleware
   - Returns earnings data with total

3. **Backend/index.js** (MODIFIED)
   - Added route: `app.use("/api/recruiter-earnings", recruiterEarnings)`

### Frontend Files

1. **Frontend/src/pages/MyEarnings.jsx** (NEW)
   - Main earnings page component
   - Displays summary cards (Total Earnings, Successful Placements, Average Commission)
   - Shows responsive table with earnings breakdown
   - Desktop table view and mobile card view
   - Includes loading and error states
   - Auto-refresh functionality

2. **Frontend/src/pages/Sidebar.jsx** (MODIFIED)
   - Added "My Earnings" menu item with DollarSign icon
   - Route: `/my-earnings`
   - Available to all recruiters

3. **Frontend/src/App.jsx** (MODIFIED)
   - Added route: `<Route path='/my-earnings' element={<MyEarnings/>} />`

## API Endpoints

### GET /api/recruiter-earnings
**Description:** Get earnings data for logged-in recruiter

**Authentication:** Required (verifyToken middleware)

**Response:**
```json
{
  "success": true,
  "data": {
    "earnings": [
      {
        "candidateId": "abc123",
        "candidateName": "John Doe",
        "positionId": "1001",
        "positionName": "Senior Developer",
        "ctcStart": 10,
        "ctcEnd": 12,
        "commissionPercent": 8,
        "commissionAmount": 80000,
        "status": "Offer Accepted",
        "dateAdded": "2024-01-15",
        "statusUpdatedAt": "2024-01-20"
      }
    ],
    "totalEstimatedEarnings": 80000,
    "totalCandidates": 1,
    "recruiterInfo": {
      "recruiterId": "rec123",
      "recruiterEmail": "recruiter@example.com"
    }
  }
}
```

### GET /api/recruiter-earnings/summary
**Description:** Get summary statistics

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSubmissions": 50,
    "acceptedOffers": 5,
    "conversionRate": "10.0"
  }
}
```

## Database Collections Used

### candidate_db
- **Fields Used:**
  - `recId` - Recruiter ID (for filtering)
  - `candidate` / `name` - Candidate name
  - `pos_id` - Position ID (for joining with positions)
  - `statusa` - Candidate status
  - `datePosted` / `createdAt` - Date added
  - `statusaDate` / `updatedAt` - Status update date

### admin_AddPos
- **Fields Used:**
  - `pos_id` - Position ID (for joining)
  - `position` - Position name
  - `ctcStart` - Starting CTC (used for commission calculation)
  - `ctcEnd` - Ending CTC
  - `commison` - Commission percentage

### recruiter_db
- **Fields Used:**
  - `id` - Recruiter ID
  - `email` - Recruiter email (for authentication)

## UI Features

### Summary Cards
1. **Total Estimated Earnings** (Green gradient)
   - Shows total commission from all accepted offers
   - Formatted in Indian Rupees

2. **Successful Placements** (Blue gradient)
   - Count of candidates with accepted offers

3. **Average Commission** (Orange gradient)
   - Average commission per placement

### Earnings Table
**Desktop View:**
- Full table with columns: Position Name, Candidate Name, CTC, Commission %, Commission Amount, Status
- Sortable by commission amount (highest first)
- Total row at bottom

**Mobile View:**
- Card-based layout
- Collapsible details
- Touch-friendly interface

### Empty State
- Displays when no earnings found
- Encourages recruiters to submit quality candidates

## Status Filters

The feature only shows candidates with these statuses:
- **Offer Accepted**
- **Joining**

These are considered "success" statuses that warrant commission payment.

## Testing Checklist

- [ ] Backend API returns correct data for authenticated recruiter
- [ ] Commission calculations are accurate
- [ ] Only "Offer Accepted" and "Joining" candidates are shown
- [ ] Total earnings calculation is correct
- [ ] Frontend displays data correctly
- [ ] Responsive design works on mobile and desktop
- [ ] Loading and error states work properly
- [ ] Refresh button updates data
- [ ] Navigation from sidebar works
- [ ] Authentication is enforced

## Deployment Steps

1. **Backend Deployment:**
   ```bash
   cd Backend
   # Deploy to Firebase Functions
   firebase deploy --only functions
   ```

2. **Frontend Deployment:**
   ```bash
   cd Frontend
   npm run build
   firebase deploy --only hosting
   ```

3. **Verify:**
   - Test the `/my-earnings` route
   - Check API endpoint `/api/recruiter-earnings`
   - Verify data accuracy with test recruiter account

## Future Enhancements

1. **Export Functionality**
   - Export earnings to CSV/PDF
   - Generate monthly/quarterly reports

2. **Filters & Search**
   - Filter by date range
   - Search by position or candidate name
   - Filter by commission amount

3. **Charts & Analytics**
   - Earnings trend over time
   - Commission breakdown by position
   - Monthly comparison charts

4. **Payment Tracking**
   - Mark commissions as paid/unpaid
   - Payment history
   - Invoice generation

5. **Notifications**
   - Alert when new offer is accepted
   - Monthly earnings summary email

## Notes

- Commission amounts are **estimated** based on CTC Start and Commission %
- Actual payout terms may vary based on recruiter agreements
- The feature is read-only; no data modification is allowed
- All currency is displayed in Indian Rupees (₹)
- Dates are formatted in DD-MMM-YYYY format (e.g., 15-Jan-2024)

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify backend logs in Firebase Console
3. Ensure recruiter has submitted candidates with accepted offers
4. Confirm authentication is working properly

---

**Feature Status:** ✅ Complete and Ready for Testing
**Created:** 2024
**Last Updated:** 2024
