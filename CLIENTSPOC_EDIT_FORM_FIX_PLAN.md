# ClientSpoc Dashboard Edit Form Fix Plan

## Issues Identified

The edit form in `ClientSpocDashView.jsx` is missing critical fields that exist in `Ad_Pos.jsx`:

1. **Missing Add Coach field** - No autocomplete for selecting coaches
2. **Missing Add Expert field** - No autocomplete for selecting experts  
3. **Location field mismatch** - Simple text input vs. city selection grid with search

## Required Changes

### 1. Add Coach and Expert Fields

**In Ad_Pos.jsx:**
```jsx
// Add Coach - Optional Field
<Autocomplete
  multiple
  options={coaches}
  value={form.coach_ids}
  onChange={handleCoachChange}
  getOptionLabel={(option) => option?.name ? `${option.name} (${option.specialization || ''})` : ''}
  isOptionEqualToValue={(option, value) => option?.id === value?.id}
  loading={loadingCoaches}
  renderTags={(value, getTagProps) =>
    value.map((option, index) => (
      <Chip
        variant="outlined"
        label={option.name}
        size="small"
        {...getTagProps({ index })}
        onDelete={() => handleDeleteCoach(option)}
        key={option.id}
        sx={{ borderColor: '#3b82f6', color: '#1d4ed8', ... }}
      />
    ))
  }
  renderInput={(params) => (
    <TextField
      {...params}
      placeholder={loadingCoaches ? "Loading..." : "Select coaches"}
      variant="outlined"
      size="small"
      ...
    />
  )}
  filterOptions={(options, params) => {
    const filtered = options.filter(option =>
      option.name?.toLowerCase().includes(params.inputValue.toLowerCase()) ||
      option.specialization?.toLowerCase().includes(params.inputValue.toLowerCase())
    );
    return filtered;
  }}
/>

// Add Expert - Optional Field
<Autocomplete
  multiple
  options={experts}
  value={form.expert_ids}
  onChange={handleExpertChange}
  ...
/>
```

**Requirements:**
- Import Autocomplete, Chip, TextField from @mui/material
- Add state for coaches, experts, loading states
- Add useEffect to fetch coaches and experts from API
- Add handlers for selection and deletion
- Store coach_ids and expert_ids in editData state

### 2. Fix Location Field

**In Ad_Pos.jsx:**
```jsx
// Location with search and city grid
const [citySearch, setCitySearch] = useState("");

// Search Box
<input
  type="text"
  placeholder="Search cities..."
  value={citySearch}
  onChange={(e) => setCitySearch(e.target.value)}
  className="w-full h-9 sm:h-11 border-2 border-gray-200 rounded-lg ... "
/>

// Selected Cities Display
{form.location.length > 0 && (
  <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
    <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
      Selected Cities ({form.location.length}):
    </p>
    <div className="flex flex-wrap gap-2">
      {form.location.map(city => (
        <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white rounded-lg ...">
          {city}
          <button type="button" onClick={() => toggleCity(city)}>
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  </div>
)}

// Cities Grid
<div className="border-2 border-gray-200 rounded-xl p-3 sm:p-4 max-h-56 sm:max-h-64 overflow-y-auto">
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
    {filteredCities.map(city => (
      <button
        type="button"
        onClick={() => toggleCity(city)}
        className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${
          form.location.includes(city)
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {city}
      </button>
    ))}
  </div>
</div>
```

**Requirements:**
- Import indiaCities from Ad_Pos.jsx or define locally
- Add citySearch state
- Add filteredCities computed property
- Add toggleCity function
- Update editData.location to be an array instead of string
- Update save handler to convert array to comma-separated string for API

### 3. Update State Management

**Current editData state (incomplete):**
```jsx
setEditData({
  position: res.data.position || '',
  client: res.data.client || '',
  hr_name: res.data.hr_name || '',
  ctcStart: res.data.ctcStart || '',
  ctcEnd: res.data.ctcEnd || '',
  experience: res.data.experience || '',
  location: Array.isArray(res.data.location) ? res.data.location.join(', ') : res.data.location || '',
  job_desc: res.data.job_desc || '',
  commison: res.data.commison || 0,
  key_res: res.data.key_res || '',
  m_have: res.data.m_have || '',
  g_have: res.data.g_have || '',
  compet: res.data.compet || '',
  comp_view: res.data.comp_view || '',
  pos_cat: res.data.pos_cat || '',
  state: Array.isArray(res.data.state) ? res.data.state.join(', ') : res.data.state || ''
  // MISSING: coach_ids and expert_ids
});
```

**Updated editData state:**
```jsx
setEditData({
  position: res.data.position || '',
  client: res.data.client || '',
  hr_name: res.data.hr_name || '',
  ctcStart: res.data.ctcStart || '',
  ctcEnd: res.data.ctcEnd || '',
  experience: res.data.experience || '',
  location: Array.isArray(res.data.location) ? res.data.location : (res.data.location ? res.data.location.split(', ') : []),
  job_desc: res.data.job_desc || '',
  commison: res.data.commison || 0,
  key_res: res.data.key_res || '',
  m_have: res.data.m_have || '',
  g_have: res.data.g_have || '',
  compet: res.data.compet || '',
  comp_view: res.data.comp_view || '',
  pos_cat: res.data.pos_cat || '',
  // NEW: Coach and Expert fields
  coach_ids: res.data.coach_ids ? parseCoachExpertNames(res.data.coach_ids) : [],
  expert_ids: res.data.expert_ids ? parseCoachExpertNames(res.data.expert_ids) : []
});
```

### 4. Helper Functions Needed

```jsx
// Parse comma-separated names to objects for autocomplete
const parseCoachExpertNames = (namesString) => {
  if (!namesString) return [];
  if (Array.isArray(namesString)) return namesString;
  return namesString.split(', ').map(name => ({ name: name.trim(), id: name.trim(), email: '' }));
};

// Convert selected objects back to comma-separated names for API
const formatCoachExpertForSave = (idsArray) => {
  if (!Array.isArray(idsArray) || idsArray.length === 0) return '';
  return idsArray.map(item => item.name).join(', ');
};
```

### 5. API Endpoints Required

The frontend needs these endpoints to exist:
- `GET /api/coach-expert/coach/all` - Fetch all coaches
- `GET /api/coach-expert/expert/all` - Fetch all experts

### 6. Updated Save Handler

```jsx
const handleSaveEdit = async () => {
  setIsSaving(true);
  try {
    const res = await axios.put(`/candidate/pos/modify/${position.id}`, {
      ...editData,
      // Convert arrays to comma-separated strings for API
      location: Array.isArray(editData.location) ? editData.location.join(', ') : editData.location,
      coach_ids: formatCoachExpertForSave(editData.coach_ids),
      expert_ids: formatCoachExpertForSave(editData.expert_ids)
    }, {
      withCredentials: true
    });
    
    if (res.data.success) {
      setEditNotification({ type: 'success', message: 'Position updated successfully!' });
      // Refresh position data
      const refreshRes = await axios.get(`/candidate/position/${pos_id}`);
      setPosition(refreshRes.data);
      navigate(`/clientspoc-dash-view/${pos_id}`, { replace: true });
    } else {
      setEditNotification({ type: 'error', message: res.data.message || 'Failed to update position' });
    }
  } catch (err) {
    console.error('Error saving position:', err);
    setEditNotification({ type: 'error', message: err.response?.data?.message || 'Failed to update position' });
  } finally {
    setIsSaving(false);
  }
};
```

## Files to Modify

1. **Frontend/src/pages/ClientSpocDashView.jsx**
   - Add imports for Autocomplete, Chip, TextField from @mui/material
   - Add imports for PlusCircle, Search, X from lucide-react
   - Add imports for indiaCities data
   - Add state for coaches, experts, citySearch, loading states
   - Add useEffect to fetch coaches and experts
   - Add handler functions (handleCoachChange, handleExpertChange, toggleCity, etc.)
   - Update editData state initialization
   - Update the edit form JSX to include Coach, Expert, and Location grid
   - Update handleSaveEdit to format data for API

## Testing Checklist

- [ ] Add Coach field appears and allows selection of multiple coaches
- [ ] Add Expert field appears and allows selection of multiple experts  
- [ ] Location field shows city search and grid selection
- [ ] Selected cities display as chips with delete option
- [ ] Form saves successfully with all fields
- [ ] Existing position data loads correctly into edit form
- [ ] View mode shows coach and expert information correctly

## Estimated Effort

- 2-3 hours for implementation
- 1 hour for testing and fixes

