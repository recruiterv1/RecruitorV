# Quick Start Guide - Admin Candidate Advanced Search & Excel Export

## 🚀 Quick Access

**Location**: Admin Panel → Candidates Tab

## 📋 Features at a Glance

### 1. Advanced Filters
Filter candidates by:
- ✅ Submitted Date (From/To)
- ✅ Recruiter Name (Multi-select)
- ✅ Client Name (Multi-select)
- ✅ Status (Multi-select)
- ✅ HR Name (Multi-select)

### 2. Excel Export
- ✅ Export filtered results to .xlsx
- ✅ Includes all candidate details
- ✅ Auto-formatted columns
- ✅ Timestamped filename

## 🎯 How to Use

### Opening Filters
1. Click the **"Filters"** button in the toolbar
2. Filter panel opens below the header
3. Select your criteria
4. Filters apply in real-time

### Applying Filters

#### Date Range:
```
Submitted Date From: [Select date]
Submitted Date To:   [Select date]
```
- Leave blank to ignore date filtering
- Use one or both dates

#### Multi-Select Filters:
```
Recruiter Name: [Type to search] → Select multiple
Client Name:    [Type to search] → Select multiple
Status:         [Type to search] → Select multiple
HR Name:        [Type to search] → Select multiple
```
- Click field to see all options
- Type to search/filter options
- Select multiple values
- Click X on chip to remove selection

### Viewing Results
- **Header shows**: "Showing X of Y candidates" (when filtered)
- **Filter button shows**: Badge with active filter count
- **Bottom of filter panel**: "X candidates match your filters"

### Clearing Filters
- **Clear All button**: Removes all filters at once
- **Individual removal**: Click X on any chip
- **Manual clear**: Delete date or deselect items

### Exporting to Excel
1. Apply filters (optional)
2. Click **"Export Excel"** button
3. File downloads automatically
4. Filename format:
   - `Candidates_2025-01-15.xlsx` (all data)
   - `Candidates_2025-01-15_Filtered.xlsx` (filtered)

## 💡 Common Use Cases

### 1. Find Candidates by Recruiter
```
Filter: Recruiter Name = "John Doe"
Result: All candidates submitted by John
Action: Export to Excel for John's performance review
```

### 2. Client-Specific Report
```
Filter: Client Name = "ABC Corporation"
Result: All candidates for ABC Corp
Action: Export to share with client
```

### 3. Pipeline Status Report
```
Filter: Status = "L1 Scheduled", "L2 Scheduled"
Result: All candidates in interview stages
Action: Export for daily standup meeting
```

### 4. Monthly Submissions
```
Filter: Date From = "2025-01-01"
        Date To = "2025-01-31"
Result: All January submissions
Action: Export for monthly report
```

### 5. HR Workload Analysis
```
Filter: HR Name = "Sarah Smith"
Result: All candidates assigned to Sarah
Action: Export to analyze workload
```

### 6. Complex Multi-Filter
```
Filter: Date From = "2025-01-01"
        Recruiter = "John", "Mary"
        Client = "ABC Corp"
        Status = "Submitted", "L1 Scheduled"
Result: Specific subset matching all criteria
Action: Export for targeted follow-up
```

## 🎨 Visual Indicators

### Filter Button States:
- **Default**: White background, blue text
- **Active**: Orange background, white text
- **Badge**: Shows count of active filters (e.g., "3")

### Header Display:
- **No filters**: "500 candidates submitted"
- **With filters**: "45 of 500 candidates [Filtered]"

### Export Button:
- **No filters**: "Export Excel"
- **With filters**: "Export Excel (Filtered)"

## ⚡ Pro Tips

1. **Combine Filters**: Use multiple filters together for precise results
2. **Date Ranges**: Use date filters for time-based reports
3. **Multi-Select**: Select multiple recruiters/clients to compare
4. **Export Often**: Export filtered data before changing filters
5. **Clear Between Searches**: Use "Clear All" to start fresh
6. **Real-time Updates**: Filters apply instantly as you select

## 📊 Excel Export Details

### Exported Columns (16 total):
1. Submitted Date
2. Candidate Name
3. Email
4. Phone
5. Recruiter Name
6. Position
7. Client
8. HR Name
9. Current CTC
10. Expected CTC
11. Current Location
12. Preferred Location
13. Experience
14. Offer in Hand
15. Offer & DOJ
16. Status

### File Features:
- ✅ Proper .xlsx format (not CSV)
- ✅ Auto-sized columns
- ✅ Formatted headers
- ✅ Ready to open in Excel/Google Sheets
- ✅ No additional formatting needed

## 🔧 Troubleshooting

### Filter not working?
- Check if you've selected values in the dropdown
- Verify date format is correct
- Try clearing and reapplying filters

### Excel export not downloading?
- Check browser's download settings
- Disable popup blockers
- Try a different browser

### No results showing?
- Check if filters are too restrictive
- Try removing some filters
- Verify data exists for selected criteria

### Filter panel won't close?
- Click "Apply Filters" button
- Or click "Filters" button again
- Or click X in top-right of panel

## 📱 Mobile Usage

- Filter panel is responsive
- Filters stack vertically on mobile
- All features work on mobile browsers
- Export works on mobile devices

## ⌨️ Keyboard Shortcuts

- **Tab**: Navigate between filter fields
- **Enter**: Select highlighted option in dropdown
- **Escape**: Close dropdown menus
- **Backspace**: Remove last selected chip

## 🎓 Training Tips

### For New Users:
1. Start with single filter (e.g., just Recruiter)
2. See how results change
3. Add more filters gradually
4. Practice exporting
5. Try different combinations

### For Power Users:
1. Create common filter combinations
2. Export regularly for reports
3. Use date ranges for trends
4. Combine with table sorting
5. Use with row selection for bulk actions

## 📞 Need Help?

- Check the full documentation: `ADMIN_CANDIDATE_ADVANCED_SEARCH_FEATURE.md`
- Contact system administrator
- Report bugs with screenshots

## ✨ Summary

**3 Simple Steps:**
1. **Click "Filters"** → Select criteria
2. **View results** → Real-time filtering
3. **Click "Export Excel"** → Download data

**That's it!** You now have powerful search and export capabilities for candidate management.
