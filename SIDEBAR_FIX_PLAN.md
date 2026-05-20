# ClientSpoc Sidebar Fix Plan

## Pages to Fix

### 1. ClientSpocPositionStats.jsx
**Current Issue:** Missing sidebar, header, and footer structure

**Fix Required:**
- Import `ClientSpocSidebar` component
- Add sidebar state management (isSidebarOpen, isCollapsed)
- Add desktop sidebar (fixed position)
- Add mobile sidebar overlay
- Wrap main content with responsive padding
- Add header with navigation and user info
- Add footer with logo

### 2. ClientSpocStats.jsx
**Current Issue:** Missing sidebar, header, and footer structure

**Fix Required:**
- Import `UserStateContext` and `SidebarContext`
- Import `ClientSpocSidebar` component
- Import icons (Menu, ArrowLeft)
- Add sidebar state management
- Add desktop sidebar (fixed position)
- Add mobile sidebar overlay
- Wrap main content with responsive padding
- Add header with navigation and user info
- Add footer with logo

## Implementation Pattern (from ClientSpocMyPositions.jsx)

### Required Imports:
```javascript
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ArrowLeft, RefreshCw } from 'lucide-react';
import { UserStateContext } from '../context/AuthPro';
import { SidebarContext } from '../context/Sidebarcontext';
import ClientSpocSidebar from '../components/Dash_View_ClientSpocSidebar';
```

### State Management:
```javascript
const { user } = useContext(UserStateContext);
const { isSidebarCollapsed, setIsSidebarCollapsed } = useContext(SidebarContext);
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [isMounted, setIsMounted] = useState(false);

const isCollapsed = isSidebarCollapsed || false;

useEffect(() => {
  setIsMounted(true);
}, []);
```

### Component Structure:
1. Loading spinner with isMounted check
2. Sidebar (desktop fixed, mobile overlay)
3. Main content wrapper with responsive padding
4. Header with navigation
5. Content area
6. Footer

## Files to Modify:
1. `Frontend/src/pages/ClientSpocPositionStats.jsx`
2. `Frontend/src/pages/ClientSpocStats.jsx`

## Status
- [ ] Fix ClientSpocPositionStats.jsx
- [ ] Fix ClientSpocStats.jsx

