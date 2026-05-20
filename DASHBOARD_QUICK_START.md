# Dashboard & Candidate Statistics - Quick Start Guide

## 🚀 Quick Start

### Start Development Servers

```bash
# Terminal 1 - Backend
cd Backend
npm start

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

### Access the Features

1. **Login as Super Admin**
   - Navigate to http://localhost:5173 (or your frontend URL)
   - Login with Super Admin credentials

2. **Dashboard (Default View)**
   - Should load automatically after login
   - You'll see 6 metric cards

3. **Candidate Statistics**
   - Click "Candidate Statistics" in the sidebar menu

## 📊 Testing Dashboard

### Test Metric Cards
1. Verify all 6 cards show numbers:
   - Total Clients
   - Total Recruiters
   - Total SPOCs
   - Total Positions
   - Total HRs
   - Total Candidates

### Test Time Filters
1. Click "Today" - numbers should update
2. Click "This Week" - numbers should update
3. Click "This Month" - numbers should update
4. Click "All Time" - back to full counts

### Test Card Details
1. Click any card (e.g., "Total Recruiters")
2. Modal should open with detailed records
3. Verify data shows:
   - Name
   - Phone
   - Email
   - Date Added
4. Test pagination if more than 20 records
5. Close modal with X button

## 📋 Testing Candidate Statistics

### Test Table Load
1. Navigate to "Candidate Statistics"
2. Table should load with candidates
3. Verify columns:
   - Name (with avatar)
   - Contact (Phone & Email)
   - Position
   - Client
   - Status (color-coded badge)
   - Dates (Added & Updated)
   - Recruiter

### Test Filters
1. **Name Filter**
   - Type a name in "Name" field
   - Click "Apply Filters"
   - Verify results match

2. **Phone Filter**
   - Type phone number
   - Click "Apply Filters"
   - Verify results match

3. **Email Filter**
   - Type email
   - Click "Apply Filters"
   - Verify results match

4. **Position Filter**
   - Type position name
   - Click "Apply Filters"
   - Verify results match

5. **Status Filter**
   - Select a status from dropdown
   - Click "Apply Filters"
   - Verify only that status shows

6. **Date Filter**
   - Select a date
   - Click "Apply Filters"
   - Verify only records after that date show

7. **Multiple Filters**
   - Apply multiple filters together
   - Verify results match all criteria

8. **Clear Filters**
   - Click "Clear Filters"
   - All filters should reset
   - Full list should show

### Test Export
1. Click "Export CSV" button
2. CSV file should download
3. Open CSV and verify data

### Test Pagination
1. Change "Rows per page" dropdown
2. Verify table updates
3. Click page navigation buttons
4. Verify correct page loads

## ✅ Success Criteria

### Dashboard
- [ ] All 6 cards display numbers
- [ ] Time filters work correctly
- [ ] Cards are clickable
- [ ] Details modal opens and shows data
- [ ] Modal pagination works
- [ ] Modal closes properly
- [ ] Refresh button works
- [ ] No console errors

### Candidate Statistics
- [ ] Table loads with data
- [ ] All columns display correctly
- [ ] Summary cards show correct numbers
- [ ] All filters work individually
- [ ] Multiple filters work together
- [ ] Clear filters resets everything
- [ ] Export CSV downloads file
- [ ] Pagination works
- [ ] Rows per page selector works
- [ ] Refresh button works
- [ ] No console errors

## 🐛 Common Issues

### Dashboard not loading
- Check backend is running
- Check `/dashboardstats/summary` endpoint
- Check browser console for errors

### Cards show 0
- Check if database has data
- Check backend logs
- Verify collections exist

### Modal not opening
- Check browser console
- Verify click handler is working
- Check if data is being fetched

### Candidate Statistics empty
- Check if candidates exist in database
- Check `/candidatestats/all` endpoint
- Verify backend is running

### Filters not working
- Check if "Apply Filters" is clicked
- Verify filter values are being sent
- Check backend logs

### Export not working
- Check if candidates array has data
- Verify browser allows downloads
- Check console for errors

## 📱 Mobile Testing

1. Open on mobile device or use browser dev tools
2. Verify responsive design:
   - Cards stack vertically
   - Filters in single column
   - Table scrolls horizontally
   - Modal is full-screen
   - Buttons are touch-friendly

## 🔍 Browser Console

Keep browser console open during testing:
- Should see no errors
- Network tab should show successful API calls
- Check for any warnings

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review DASHBOARD_CANDIDATE_STATS_FEATURE.md
3. Check backend logs
4. Review browser console
5. Contact development team

## 🎉 Next Steps

After successful testing:
1. Deploy to staging (if available)
2. Get user feedback
3. Deploy to production
4. Monitor for issues

---

**Happy Testing! 🚀**
