# Dashboard & Candidate Statistics Feature

## Overview
This feature adds a comprehensive Dashboard with metric cards and a detailed Candidate Statistics page to the SuperAdmin panel.

## Implementation Date
December 2024

## Features Implemented

### 1. Dashboard Page
- **6 Metric Cards:**
  - Total Clients
  - Total Recruiters
  - Total SPOCs
  - Total Positions
  - Total HRs
  - Total Candidates

- **Time-based Filters:**
  - All Time (default)
  - Today
  - This Week (last 7 days)
  - This Month (last 30 days)

- **Interactive Cards:**
  - Click any card to view detailed records
  - Modal popup with paginated details
  - Shows: Name, Phone, Email, Date Added
  - Additional fields based on card type (Company, Position, etc.)

### 2. Candidate Statistics Page
- **Comprehensive Table View:**
  - Name with avatar
  - Contact information (Phone & Email)
  - Position
  - Client
  - Status with color-coded badges
  - Date Added & Last Update
  - Recruiter Name

- **Advanced Filtering:**
  - Filter by Name
  - Filter by Phone
  - Filter by Email
  - Filter by Position
  - Filter by Status (dropdown with all available statuses)
  - Filter by Last Update Date

- **Additional Features:**
  - Summary statistics cards at top
  - Export to CSV functionality
  - Pagination with customizable rows per page
  - Responsive design
  - Real-time data refresh

## Technical Implementation

### Backend Files Created

1. **Backend/model_fire/dashboardStatsF.js**
   - `getDashboardSummary(filter)` - Get counts for all 6 metrics
   - `getDetailedRecords(type, filter, page, limit)` - Get detailed records with pagination
   - Supports time-based filtering (today, week, month)

2. **Backend/router/dashboardStats.js**
   - `GET /dashboardstats/summary?filter=<today|week|month>` - Get summary counts
   - `GET /dashboardstats/details/:type?filter=<filter>&page=<page>&limit=<limit>` - Get detailed records
   - Types: clients, recruiters, spocs, positions, hrs, candidates

3. **Backend/model_fire/candidateStatsF.js**
   - `getAllCandidates(filters, page, limit)` - Get candidates with filtering
   - `getCandidateStatistics()` - Get summary statistics
   - `getUniqueStatuses()` - Get list of all status values

4. **Backend/router/candidateStats.js**
   - `GET /candidatestats/all` - Get all candidates with filters
   - `GET /candidatestats/statistics` - Get statistics summary
   - `GET /candidatestats/statuses` - Get unique status values

### Frontend Files Created

1. **Frontend/src/pages/Dashboard.jsx**
   - Dashboard component with 6 metric cards
   - Time filter buttons
   - Details modal with pagination
   - Responsive grid layout

2. **Frontend/src/pages/CandidateStats.jsx**
   - Candidate statistics table
   - Advanced filter panel
   - Export to CSV
   - Pagination controls
   - Summary statistics cards

### Files Modified

1. **Backend/index.js**
   - Added routes for `/dashboardstats` and `/candidatestats`

2. **Frontend/src/components/SuperAdmin.jsx**
   - Added Dashboard as first menu item
   - Added Candidate Statistics as second menu item
   - Imported new components

## API Endpoints

### Dashboard Stats API

#### Get Summary
```
GET /dashboardstats/summary?filter=<today|week|month>
```

Response:
```json
{
  "success": true,
  "data": {
    "totalClients": 10,
    "totalRecruiters": 25,
    "totalSpocs": 8,
    "totalPositions": 50,
    "totalHRs": 5,
    "totalCandidates": 200,
    "filter": "week"
  }
}
```

#### Get Details
```
GET /dashboardstats/details/:type?filter=<filter>&page=<page>&limit=<limit>
```

Types: `clients`, `recruiters`, `spocs`, `positions`, `hrs`, `candidates`

Response:
```json
{
  "success": true,
  "data": {
    "records": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 100,
      "recordsPerPage": 20
    },
    "filter": "week",
    "type": "candidates"
  }
}
```

### Candidate Stats API

#### Get All Candidates
```
GET /candidatestats/all?name=<name>&phone=<phone>&email=<email>&position=<position>&status=<status>&lastUpdateDate=<date>&page=<page>&limit=<limit>
```

Response:
```json
{
  "success": true,
  "data": {
    "candidates": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalRecords": 200,
      "recordsPerPage": 20
    },
    "filters": {...}
  }
}
```

#### Get Statistics
```
GET /candidatestats/statistics
```

Response:
```json
{
  "success": true,
  "data": {
    "totalCandidates": 200,
    "uniquePositions": 50,
    "uniqueClients": 10,
    "recentCandidates": 15,
    "statusBreakdown": {...},
    "topPositions": [...]
  }
}
```

#### Get Statuses
```
GET /candidatestats/statuses
```

Response:
```json
{
  "success": true,
  "data": ["Submitted", "On Process", "Offer Accepted", "Rejected", ...]
}
```

## Database Collections Used

1. **recruiter_db** - For recruiters and HRs (filtered by roleCategory)
2. **admin_db** - For client SPOCs
3. **candidate_db** - For candidates
4. **Company_Overview** - For clients/companies

## Key Features

### Dashboard
- ✅ Real-time metric counts
- ✅ Time-based filtering (Today, Week, Month)
- ✅ Clickable cards with detailed views
- ✅ Paginated details modal
- ✅ Responsive design
- ✅ Auto-refresh capability

### Candidate Statistics
- ✅ Comprehensive candidate listing
- ✅ Multi-field filtering
- ✅ Status-based filtering with dropdown
- ✅ Date-based filtering
- ✅ Export to CSV
- ✅ Pagination with customizable rows
- ✅ Summary statistics
- ✅ Color-coded status badges
- ✅ Responsive table design

## Usage

### Accessing Dashboard
1. Login as Super Admin
2. Dashboard is the first tab (default view)
3. Use filter buttons to view metrics by time period
4. Click any card to see detailed records

### Accessing Candidate Statistics
1. Login as Super Admin
2. Click "Candidate Statistics" in the sidebar
3. Use filters to narrow down results
4. Click "Apply Filters" to search
5. Export data using "Export CSV" button

## Testing Checklist

- [ ] Dashboard loads with correct counts
- [ ] Time filters work correctly (Today, Week, Month)
- [ ] Cards are clickable and show details
- [ ] Details modal pagination works
- [ ] Candidate Statistics page loads
- [ ] All filters work correctly
- [ ] Status dropdown shows all statuses
- [ ] Export to CSV works
- [ ] Pagination works correctly
- [ ] Responsive design on mobile
- [ ] Data refreshes correctly

## Future Enhancements

1. Add charts/graphs to dashboard
2. Add date range picker for custom periods
3. Add bulk actions for candidates
4. Add candidate status update from table
5. Add email/SMS functionality from candidate list
6. Add advanced analytics and reports
7. Add data export in multiple formats (Excel, PDF)

## Notes

- All dates are stored as Firestore Timestamps
- Filters are case-insensitive
- Pagination defaults to 20 items per page (Dashboard details) and 20 items per page (Candidate Stats)
- CSV export includes all filtered records, not just current page
- Status colors: Green (Success), Red (Rejected), Yellow (In Progress)

## Deployment

1. Backend changes are automatically deployed with Firebase Functions
2. Frontend changes require rebuild and deployment
3. No database migrations needed
4. No environment variables added

## Support

For issues or questions, contact the development team.
