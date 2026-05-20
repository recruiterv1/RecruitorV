# Coach & Expert User Types Implementation

## Summary
Added 2 new user types (Coach and Expert) with separate database tables and admin menu items.

## Completed Steps

### Backend Changes ✅
1. ✅ Created `Backend/model_fire/coachF.js` - Firebase model for coach_db
   - Fields: name, email, phone, specialization, userType (paid/free)
   
2. ✅ Created `Backend/model_fire/expertF.js` - Firebase model for expert_db
   - Fields: name, email, phone, specialization, userType (paid/free)
   
3. ✅ Created `Backend/router/coachExpert.js` - Backend routes
   - POST `/api/coach-expert/coach/add` - Add new coach
   - POST `/api/coach-expert/expert/add` - Add new expert
   - GET `/api/coach-expert/coach/all` - Get all coaches
   - GET `/api/coach-expert/expert/all` - Get all experts
   - Additional CRUD endpoints for both entities

4. ✅ Updated `Backend/index.js`
   - Added coachExpert router import
   - Mounted router at `/api/coach-expert`

### Frontend Changes ✅
5. ✅ Created `Frontend/src/pages/AddCoach.jsx` - Add Coach form page
   - Fields: name, email, phone, specialization dropdown, userType (radio)
   
6. ✅ Created `Frontend/src/pages/AddExpert.jsx` - Add Expert form page
   - Fields: name, email, phone, specialization dropdown, userType (radio)
   
7. ✅ Updated `Frontend/src/components/Admin.jsx`
   - Added UserPlus and Award icons for new menu items
   - Imported AddCoach and AddExpert components
   - Added "Add Coach" menu item (Admin only)
   - Added "Add Expert" menu item (Admin only)

## Specialization Options
- Tech, Banking, Finance, IT, Database, Testing, Marketing, HR, Operations, Sales, Other

## User Type Options
- paid
- free

## Deployment Instructions

### Backend Deployment
```bash
cd Backend
npm run deploy
# or
firebase deploy --only functions
```

### Frontend Deployment
```bash
cd Frontend
npm run build
# Deploy to hosting
```

## API Endpoints

### Coach Endpoints
- `POST /api/coach-expert/coach/add` - Create coach
- `GET /api/coach-expert/coach/all` - Get all coaches
- `GET /api/coach-expert/coach/:id` - Get coach by ID
- `PATCH /api/coach-expert/coach/:id` - Update coach
- `DELETE /api/coach-expert/coach/:id` - Delete coach

### Expert Endpoints
- `POST /api/coach-expert/expert/add` - Create expert
- `GET /api/coach-expert/expert/all` - Get all experts
- `GET /api/coach-expert/expert/:id` - Get expert by ID
- `PATCH /api/coach-expert/expert/:id` - Update expert
- `DELETE /api/coach-expert/expert/:id` - Delete expert

### Common Endpoints
- `GET /api/coach-expert/specializations` - Get all specialization options

## Notes
- Both "Add Coach" and "Add Expert" menu items are visible only to Admin/SuperAdmin users
- Database collections created: `coach_db` and `expert_db`
- All specializations are pre-defined and validated on backend
- UserType defaults to 'free' if not specified

