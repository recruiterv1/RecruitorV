# Migration Guide: Adding Plan Type to Existing Recruiters

## Overview
This guide explains how to update existing recruiters in your database to have the new `planType` field set to 1 (Paid plan), ensuring they maintain unlimited access.

---

## ⚠️ IMPORTANT: Why Migration is Needed

All existing recruiters need to be updated with:
- `planType: 1` (Paid plan - unlimited access)
- `registrationDate: <current date>`
- `maxPositions: null` (unlimited)
- `planExpiryDate: null` (no expiry)

**Without this migration, existing users may face issues logging in or creating positions.**

---

## 🔧 Migration Options

### Option 1: Manual Update via Firebase Console (Recommended for Small Number of Users)

#### Step-by-Step Instructions:

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select your project: `recruitorv-1291c`

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - You should see your collections

3. **Open recruiter_db Collection**
   - Click on the `recruiter_db` collection
   - You'll see a list of all recruiter documents

4. **Update Each Recruiter Document**
   
   For EACH recruiter document:
   
   a. Click on the document ID to open it
   
   b. Check if it already has `planType` field:
      - If YES: Skip this document
      - If NO: Continue to step c
   
   c. Click "Add field" button (+ icon)
   
   d. Add these 4 fields:
   
   **Field 1:**
   - Field name: `planType`
   - Type: `number`
   - Value: `1`
   
   **Field 2:**
   - Field name: `registrationDate`
   - Type: `timestamp`
   - Value: Click "Set to current time"
   
   **Field 3:**
   - Field name: `maxPositions`
   - Type: `null`
   - Value: (leave empty)
   
   **Field 4:**
   - Field name: `planExpiryDate`
   - Type: `null`
   - Value: (leave empty)
   
   e. Click "Update" to save changes
   
   f. Repeat for all recruiter documents

5. **Verify Updates**
   - Check a few documents to ensure fields were added correctly
   - All existing recruiters should now have `planType: 1`

---

### Option 2: Using Firebase Console Bulk Edit (Faster for Many Users)

Unfortunately, Firebase Console doesn't support bulk updates directly. You'll need to use Option 1 or Option 3.

---

### Option 3: Run Migration Script on Production Server

If you have access to your production server where the backend is deployed:

1. **SSH into your production server**
   ```bash
   ssh your-server
   ```

2. **Navigate to Backend directory**
   ```bash
   cd /path/to/your/backend
   ```

3. **Run the migration script**
   ```bash
   node scripts/migratePlanType.js
   ```

4. **Check the output**
   - The script will show progress for each recruiter
   - It will display a summary at the end
   - Existing recruiters with planType will be skipped

---

### Option 4: Create a Temporary Admin Endpoint (Advanced)

If you have many users and want to automate, you can create a temporary admin endpoint:

1. **Add this endpoint to `Backend/router/admin.js`:**

```javascript
// TEMPORARY: Migrate existing recruiters to paid plan
router.post('/migrate-plan-types', async (req, res) => {
    try {
        const { adminSecret } = req.body;
        
        // Security check - use a secret key
        if (adminSecret !== process.env.ADMIN_MIGRATION_SECRET) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const recruiterF = require('../model_fire/recruiterF');
        const recruiters = await recruiterF.getAllRecruiters();
        
        let updated = 0;
        let skipped = 0;
        
        for (const recruiter of recruiters) {
            if (recruiter.planType !== undefined) {
                skipped++;
                continue;
            }
            
            await recruiterF.updateRecruiter(recruiter.id, {
                planType: 1,
                registrationDate: new Date(),
                maxPositions: null,
                planExpiryDate: null
            });
            
            updated++;
        }
        
        res.json({
            success: true,
            message: "Migration complete",
            updated,
            skipped,
            total: recruiters.length
        });
        
    } catch (error) {
        console.error("Migration error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});
```

2. **Set environment variable:**
   ```bash
   export ADMIN_MIGRATION_SECRET="your-secret-key-here"
   ```

3. **Call the endpoint:**
   ```bash
   curl -X POST https://your-backend-url/admin/migrate-plan-types \
     -H "Content-Type: application/json" \
     -d '{"adminSecret": "your-secret-key-here"}'
   ```

4. **Remove the endpoint after migration** (for security)

---

## ✅ Verification Steps

After migration, verify that it worked:

### 1. Check Firebase Console
- Open a few recruiter documents
- Verify they have all 4 new fields
- Confirm `planType: 1`

### 2. Test Login
- Try logging in with an existing recruiter account
- Login should work normally
- No errors should appear

### 3. Test Position Creation
- As an existing recruiter, try creating a position
- It should work without any limits
- No "plan limit" errors should appear

### 4. Check Backend Logs
- Monitor your backend logs for any errors
- Look for "planType" related issues

---

## 🔍 How to Check if Migration is Needed

### Quick Check:
1. Go to Firebase Console
2. Open `recruiter_db` collection
3. Click on any recruiter document
4. Look for `planType` field:
   - **If present:** Migration already done ✅
   - **If missing:** Migration needed ⚠️

---

## 📊 Expected Results

After successful migration:

| Field | Value | Meaning |
|-------|-------|---------|
| `planType` | `1` | Paid plan (unlimited) |
| `registrationDate` | `<timestamp>` | Current date |
| `maxPositions` | `null` | Unlimited positions |
| `planExpiryDate` | `null` | No expiry |

---

## ⚠️ Troubleshooting

### Issue: "Permission denied" in Firebase Console
**Solution:** Make sure you're logged in with an account that has Firestore write permissions.

### Issue: Can't find recruiter_db collection
**Solution:** 
- Check if you're in the correct Firebase project
- Verify the collection name (it might be named differently)

### Issue: Too many recruiters to update manually
**Solution:** Use Option 3 (server script) or Option 4 (admin endpoint)

### Issue: Existing users can't login after deployment
**Solution:** 
- This is expected if migration isn't done yet
- The code is backward compatible, but migration is recommended
- Complete the migration ASAP

---

## 🎯 Recommended Approach

**For Small Number of Users (< 20):**
- Use **Option 1** (Manual via Firebase Console)
- Takes 5-10 minutes
- Most straightforward

**For Medium Number of Users (20-100):**
- Use **Option 3** (Server script) if you have server access
- OR use **Option 4** (Admin endpoint)

**For Large Number of Users (> 100):**
- Use **Option 4** (Admin endpoint)
- Most efficient for bulk updates

---

## 📝 Migration Checklist

- [ ] Backup Firestore database (optional but recommended)
- [ ] Choose migration method (Option 1, 3, or 4)
- [ ] Perform migration
- [ ] Verify a few sample documents
- [ ] Test login with existing user
- [ ] Test position creation with existing user
- [ ] Monitor for errors
- [ ] Mark migration as complete

---

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review Firebase Console for error messages
3. Check backend logs for detailed errors
4. Verify Firebase permissions

---

## ✨ After Migration

Once migration is complete:
- ✅ All existing recruiters will have unlimited access
- ✅ They can create unlimited positions
- ✅ No time restrictions
- ✅ New recruiters can choose Free or Paid during registration

**The migration is a one-time process and doesn't need to be repeated.**

---

**Last Updated:** January 18, 2025
