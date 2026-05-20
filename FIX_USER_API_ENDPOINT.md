# Fix User Plan Expiry Date - API Endpoint

## New Endpoint Created

**POST** `/auth/admin/fix-user-plan-expiry`

This endpoint fixes the "0 days remaining" issue for free plan users by setting their `planExpiryDate` field.

## How to Use

### Using cURL (After Backend Deployment Completes)

```bash
curl -X POST https://api-myh3hnbr6q-uc.a.run.app/auth/admin/fix-user-plan-expiry \
  -H "Content-Type: application/json" \
  -d '{"userEmail": "atulkumar@yopmail.com"}'
```

### Using Postman

1. **Method:** POST
2. **URL:** `https://api-myh3hnbr6q-uc.a.run.app/auth/admin/fix-user-plan-expiry`
3. **Headers:**
   - Content-Type: application/json
4. **Body (raw JSON):**
   ```json
   {
     "userEmail": "atulkumar@yopmail.com"
   }
   ```

### Using JavaScript/Axios

```javascript
const axios = require('axios');

axios.post('https://api-myh3hnbr6q-uc.a.run.app/auth/admin/fix-user-plan-expiry', {
  userEmail: 'atulkumar@yopmail.com'
})
.then(response => {
  console.log('Success:', response.data);
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});
```

## Expected Responses

### Success - User Fixed
```json
{
  "success": true,
  "message": "User plan expiry date fixed successfully",
  "registrationDate": "2024-12-20T10:30:00.000Z",
  "planExpiryDate": "2025-01-19T10:30:00.000Z",
  "daysRemaining": 30
}
```

### Success - Already Fixed
```json
{
  "success": true,
  "message": "User already has planExpiryDate set",
  "planExpiryDate": "2025-01-19T10:30:00.000Z",
  "alreadyFixed": true
}
```

### Error - User Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### Error - Not Free Plan
```json
{
  "success": false,
  "message": "User is not on free plan",
  "currentPlanType": 1
}
```

## What It Does

1. Finds the user by email
2. Checks if user is on free plan (planType === 0)
3. Checks if `planExpiryDate` already exists
4. If missing, sets:
   - `registrationDate`: Current date (or existing if available)
   - `planExpiryDate`: Registration date + 30 days
5. Updates the database
6. Returns the new dates and days remaining

## After Running

1. User should logout and login again
2. Dashboard will show correct days remaining
3. No more "0 days" issue

## Security Note

This is an admin endpoint. In production, you should add authentication/authorization to ensure only admins can call this endpoint.

## Deployment Status

- ✅ Code added to `Backend/router/rout.js`
- 🔄 Deploying to Firebase Functions...
- ⏳ Will be live at: `https://api-myh3hnbr6q-uc.a.run.app/auth/admin/fix-user-plan-expiry`
