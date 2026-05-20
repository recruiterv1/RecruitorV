# Dash Candidate Filters Feature

## Summary
Added comprehensive filtering functionality to the Dash_Candi component with the following filters:
1. Date Range (Submitted Date)
2. Positions
3. Client
4. Location
5. Status (with 3 specific options)

## Changes Made

### File Modified: `Frontend/src/pages/Dash_Candi.jsx`

#### 1. Added Filter States
- `dateRange`: { startDate: null, endDate: null }
- `position`: string (default: '')
- `client`: string (default: '')
- `location`: string (default: '')
- `status`: string (default: 'active')

#### 2. Added Helper Functions
- `getUniqueValues(field)`: Extracts unique values from data for dropdowns
- `filteredData`: useMemo hook that applies all filters to the candidate data
- `resetFilters()`: Resets all filters to default values
- `handleFilterChange(key, value)`: Updates individual filter states

#### 3. Filter Logic Implementation

**Date Filter:**
- Filters candidates within the selected date range
- Uses `datePosted._seconds` field from candidate data

**Position Filter:**
- Exact match with `pos_name` field
- Dropdown populated with unique positions from data

**Client Filter:**
- Exact match with `client` field
- Dropdown populated with unique clients from data

**Location Filter:**
- Exact match with `curr_loc` field
- Dropdown populated with unique locations from data

**Status Filter:**
- **Show All**: Displays all candidates
- **Active (Default)**: Excludes all statuses containing "reject" (case-insensitive)
  - This means "Screen Reject", "L1 Reject", "L2 Reject", etc. are all excluded
- **Reject**: Includes only statuses containing "reject" (case-insensitive)
  - Shows all candidates with any status that includes "reject"

#### 4. UI Components Added

**Filter Section:**
- Located above the Material React Table
- Responsive grid layout (1 column on mobile, 2 on tablet, 5 on desktop)
- Each filter has a label and input/select element

**Active Filters Display:**
- Shows currently applied filters as colored badges
- Each badge has an X button to remove that specific filter
- Only displays when filters are active

**Reset Filters Button:**
- Located in the filter section header
- Resets all filters to default values
- Active status is the default (excludes rejects)

**Updated Header:**
- Shows filtered count: "X of Y candidates shown"
- Helps users understand how many candidates match their filters

## Features

### 1. Date Range Filter
- Start date and end date pickers
- Filters candidates submitted within the selected range
- Can use just start date, just end date, or both

### 2. Position Filter
- Dropdown with all unique positions from the data
- "All Positions" option to clear the filter
- Sorted alphabetically

### 3. Client Filter
- Dropdown with all unique clients from the data
- "All Clients" option to clear the filter
- Sorted alphabetically

### 4. Location Filter
- Dropdown with all unique locations from the data
- "All Locations" option to clear the filter
- Sorted alphabetically

### 5. Status Filter
Three options as requested:
- **Show All**: No status filtering
- **Active (Default)**: Excludes all statuses containing "reject"
  - This is the default state when the page loads
  - Candidates with statuses like "Screen Reject", "L1 Reject", "L2 Reject", etc. are hidden
- **Reject**: Shows only candidates with statuses containing "reject"
  - Displays all candidates with any reject status

### 6. Active Filters Display
- Visual representation of currently applied filters
- Color-coded badges:
  - Blue: Date range filters
  - Green: Position filter
  - Purple: Client filter
  - Orange: Location filter
  - Red: Status filter
- Each badge has an X button to remove that specific filter

### 7. Reset Filters
- Single button to clear all filters
- Resets to default state (Active status filter)

## Technical Details

### State Management
- Uses React useState for filter states
- Uses useMemo for efficient filtering (only recalculates when dependencies change)

### Performance
- Filtering is done on the frontend after data is fetched
- useMemo ensures filtering only happens when filters or data change
- Unique values are calculated dynamically from the data

### Styling
- Uses Tailwind CSS for styling
- Responsive design that works on mobile, tablet, and desktop
- Consistent with existing design system (blue/orange gradient theme)

### User Experience
- Filters are intuitive and easy to use
- Active filters are clearly visible
- Individual filters can be removed without resetting all
- Reset button provides quick way to clear all filters
- Filtered count helps users understand the impact of their filters

## Testing Recommendations

1. **Date Filter:**
   - Test with start date only
   - Test with end date only
   - Test with both start and end dates
   - Verify date boundaries are correct

2. **Position Filter:**
   - Test selecting different positions
   - Verify dropdown shows all unique positions
   - Test clearing the filter

3. **Client Filter:**
   - Test selecting different clients
   - Verify dropdown shows all unique clients
   - Test clearing the filter

4. **Location Filter:**
   - Test selecting different locations
   - Verify dropdown shows all unique locations
   - Test clearing the filter

5. **Status Filter:**
   - Test "Show All" - should show all candidates
   - Test "Active" - should exclude all reject statuses
   - Test "Reject" - should show only reject statuses
   - Verify "Active" is the default state

6. **Combined Filters:**
   - Test multiple filters together
   - Verify filters work correctly in combination
   - Test removing individual filters

7. **Reset Filters:**
   - Test reset button clears all filters
   - Verify status resets to "Active"

8. **Active Filters Display:**
   - Verify badges appear when filters are active
   - Test removing individual filters via X buttons
   - Verify badges disappear when filters are cleared

## Deployment

No backend changes required. This is a frontend-only feature.

To deploy:
1. The changes are already in `Frontend/src/pages/Dash_Candi.jsx`
2. No additional dependencies needed
3. Can be deployed immediately

## Future Enhancements (Optional)

1. **Save Filter Preferences:** Store user's filter preferences in localStorage
2. **Export Filtered Data:** Add option to export only filtered candidates
3. **Advanced Date Filter:** Add preset date ranges (Last 7 days, Last 30 days, etc.)
4. **Search in Dropdowns:** Add search functionality to position, client, and location dropdowns
5. **Filter Combinations:** Save and load filter combinations
6. **Filter Statistics:** Show count of candidates matching each filter option

## Notes

- The status filter logic is case-insensitive for "reject" matching
- "Active" filter excludes ALL statuses containing "reject" (Screen Reject, L1 Reject, etc.)
- "Reject" filter includes ALL statuses containing "reject"
- Default state shows Active candidates (no rejects)
- Filtered count updates in real-time as filters change
