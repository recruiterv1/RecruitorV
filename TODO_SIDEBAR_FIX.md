# Sidebar Fix Plan

## Issue
Sidebar positioning issues on ClientSpoc dashboard pages:
- ClientSpocPositionStats
- AllCoaches  
- AllExperts

## Root Cause
Inconsistent sidebar implementation across pages:
- Missing `SidebarProvider` wrapper in ClientSpocPositionStats
- Different sidebar positioning strategies
- Mobile sidebar toggle implementation differences

## Files to Fix
1. `Frontend/src/pages/ClientSpocPositionStats.jsx`
2. `Frontend/src/pages/AllCoaches.jsx`
3. `Frontend/src/pages/AllExperts.jsx`

## Fix Strategy
1. Add `SidebarProvider` wrapper to ClientSpocPositionStats
2. Use consistent sidebar positioning (`fixed inset-y-0 left-0`)
3. Use consistent main content padding (`lg:pl-20` / `lg:pl-64`)
4. Implement mobile sidebar toggle consistently
5. Use ClientSpocSidebar for client spoc users

## Progress
- [x] Fix ClientSpocPositionStats.jsx
- [x] Fix AllCoaches.jsx
- [x] Fix AllExperts.jsx
- [x] Test all pages (Ready for testing in browser)

