# ClientSpoc Edit Form Fix - TODO List

## Phase 1: Setup and Imports
- [x] 1.1 Add MUI imports (Autocomplete, Chip, TextField)
- [x] 1.2 Add lucide-react imports (PlusCircle, Search, X)
- [x] 1.3 Add indiaStatesAndCities and indiaCities data

## Phase 2: State Management
- [x] 2.1 Add state for coaches, experts, citySearch
- [x] 2.2 Add loading states for coaches and experts
- [x] 2.3 Update editData state initialization to handle arrays

## Phase 3: API Integration
- [x] 3.1 Add useEffect to fetch coaches from /api/coach-expert/coach/all
- [x] 3.2 Add useEffect to fetch experts from /api/coach-expert/expert/all

## Phase 4: Helper Functions
- [x] 4.1 Add parseCoachExpertNames helper function
- [x] 4.2 Add formatCoachExpertForSave helper function
- [x] 4.3 Add toggleCity function
- [x] 4.4 Add handleCoachChange handler
- [x] 4.5 Add handleExpertChange handler
- [x] 4.6 Add handleDeleteCoach handler
- [x] 4.7 Add handleDeleteExpert handler

## Phase 5: Form UI Updates
- [x] 5.1 Add city search input field
- [x] 5.2 Add selected cities display with chips
- [x] 5.3 Add cities grid selection
- [x] 5.4 Add Coach autocomplete field
- [x] 5.5 Add Expert autocomplete field
- [x] 5.6 Add filtering for filteredCities

## Phase 6: Save Handler Update
- [x] 6.1 Update handleSaveEdit to format arrays for API

## Phase 7: ClientSPOC Sidebar Fix
- [x] 7.1 Updated ClientSpocMyPositions.jsx with sidebar
- [ ] 7.2 Update ClientSpocPositionStats.jsx with sidebar
- [ ] 7.3 Update MyAddedPositions.jsx with sidebar
- [ ] 7.4 Update ClientSpocStats.jsx with sidebar

## Status: ✅ COMPLETED (Edit Form) + IN PROGRESS (Sidebar)

All edit form changes have been successfully implemented in ClientSpocDashView.jsx:
1. ✅ Add Coach autocomplete field (same as Add Position form)
2. ✅ Add Expert autocomplete field (same as Add Position form)
3. ✅ City selection grid with search (same as Add Position form)

Sidebar fixes in progress for ClientSPOC pages:
1. ✅ ClientSpocMyPositions.jsx - COMPLETED
2. ⏳ ClientSpocPositionStats.jsx - NEXT
3. ⏳ MyAddedPositions.jsx - PENDING
4. ⏳ ClientSpocStats.jsx - PENDING

