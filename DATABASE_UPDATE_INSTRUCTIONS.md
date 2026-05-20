# Database Update Instructions - Fix Case-Sensitivity

## 🎯 Purpose
Update all existing position records to use lowercase emails in the `clientspoc` field to fix the case-sensitivity matching issue.

## ⚠️ IMPORTANT: Run This AFTER Deployment Completes

Wait for the Firebase deployment to finish before running this script.

---

## 📋 Option 1: Run the Automated Script (Recommended)

### Step 1: Navigate to Backend Directory
```bash
cd Backend
```

### Step 2: Run the Update Script
```bash
node scripts/updateClientSpocToLowercase.js
```

### Expected Output:
```
🚀 Starting Client SPOC Email Case-Sensitivity Fix

🔍 Fetching all positions...
📊 Found 45 total positions

✅ Already lowercase: 12 positions
⚠️  Need update: 33 positions

📋 Positions that will be updated:
┌─────────┬──────────┬────────────────────────────┬─────────────────────────────────────┬─────────────────────────────────────┐
│ (index) │  pos_id  │         position           │              current                │               new                   │
├─────────┼──────────┼────────────────────────────┼─────────────────────────────────────┼─────────────────────────────────────┤
│    0    │  '1234'  │ 'Senior Developer'         │ 'Chandan.dhami@changeleaders.in'    │ 'chandan.dhami@changeleaders.in'    │
│    1    │  '1235'  │ 'Project Manager'          │ 'Manish.prasad@changeleaders.in'    │ 'manish.prasad@changeleaders.in'    │
└─────────┴──────────┴────────────────────────────┴─────────────────────────────────────┴─────────────────────────────────────┘

🔄 Starting batch update...

✅ Successfully updated 33 positions!

📊 Summary:
   - Total positions: 45
   - Already lowercase: 12
   - Updated to lowercase: 33

🎯 Next Steps:
   1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
   2. Test login with each Client SPOC user
   3. Verify 'My Positions' page shows positions for all users

✨ Script completed successfully!
```

---

## 📋 Option 2: Manual Update via Firebase Console

If you prefer to update manually or the script fails:

### Step 1: Open Firebase Console
```
https://console.firebase.google.com/project/recruitorv-1291c/firestore
```

### Step 2: Navigate to Collection
- Click on `admin_AddPos` collection

### Step 3: Update Each Record
For each position record where `clientspoc` has mixed case:

**Find and Replace:**
```
Chandan.dhami@changeleaders.in  →  chandan.dhami@changeleaders.in
Manish.prasad@changeleaders.in  →  manish.prasad@changeleaders.in
Akansha.chaudhary@changeleaders.in  →  akansha.chaudhary@changeleaders.in
Diksha.sethi@changeleaders.in  →  diksha.sethi@changeleaders.in
Narendra.negi@changeleaders.in  →  narendra.negi@changeleaders.in
Roshan.rawat@changeleaders.in  →  roshan.rawat@changeleaders.in
```

### Step 4: Save Each Record
Click "Update" after changing each `clientspoc` value.

---

## 🧪 Verification After Update

### Test Each Client SPOC User:

1. **Chandan (chandan.dhami@changeleaders.in)**
   ```bash
   # Login credentials
   Email: chandan.dhami@changeleaders.in
   Password: 123123
   ```
   - Navigate to "My Positions"
   - Should see all positions where clientspoc = "chandan.dhami@changeleaders.in"

2. **Manish (manish.prasad@changeleaders.in)**
   ```bash
   Email: manish.prasad@changeleaders.in
   Password: 234234
   ```
   - Navigate to "My Positions"
   - Should see all his positions

3. **Akansha (akansha.chaudhary@changeleaders.in)**
   ```bash
   Email: akansha.chaudhary@changeleaders.in
   Password: 345345
   ```
   - Navigate to "My Positions"
   - Should continue to see positions (was already working)

4. **Diksha (diksha.sethi@changeleaders.in)**
   ```bash
   Email: diksha.sethi@changeleaders.in
   Password: 456456
   ```
   - Navigate to "My Positions"
   - Should see all her positions

5. **Narendra (narendra.negi@changeleaders.in)**
   ```bash
   Email: narendra.negi@changeleaders.in
   Password: 567567
   ```
   - Navigate to "My Positions"
   - Should see all his positions

6. **Roshan (roshan.rawat@changeleaders.in)**
   ```bash
   Email: roshan.rawat@changeleaders.in (note: lowercase r)
   Password: [ask user for password]
   ```
   - Navigate to "My Positions"
   - Should see all his positions

---

## 🔍 Verification Query

To check if update was successful, run this in Firebase Console:

```javascript
// Check for any remaining mixed-case emails
db.collection('admin_AddPos')
  .get()
  .then(snapshot => {
    const mixedCase = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.clientspoc && data.clientspoc !== data.clientspoc.toLowerCase()) {
        mixedCase.push({
          pos_id: data.pos_id,
          position: data.position,
          clientspoc: data.clientspoc
        });
      }
    });
    
    if (mixedCase.length === 0) {
      console.log("✅ All emails are lowercase!");
    } else {
      console.log(`⚠️ Found ${mixedCase.length} records still with mixed case:`);
      console.table(mixedCase);
    }
  });
```

---

## ✅ Success Criteria

After running the update script:
- [ ] Script completes without errors
- [ ] All Client SPOC users can see their positions
- [ ] New positions are created with lowercase emails
- [ ] Verification query shows 0 mixed-case emails

---

## 🆘 Troubleshooting

### Issue: Script fails with "Firebase not initialized"
**Solution:** Make sure you're in the Backend directory and have proper Firebase credentials

### Issue: "Permission denied" error
**Solution:** Check Firebase security rules allow admin access

### Issue: Some users still can't see positions
**Solution:** 
1. Verify the email in database matches exactly (check for typos)
2. Clear browser cache completely
3. Check if user is logging in with correct email (lowercase)

---

## 📝 What the Script Does

1. **Fetches** all positions from `admin_AddPos` collection
2. **Identifies** positions with mixed-case `clientspoc` emails
3. **Updates** them to lowercase
4. **Backs up** original value in `previousClientSpoc` field
5. **Adds** metadata: `caseFixedAt` and `caseFixedBy`

---

## 🎉 After Successful Update

All Client SPOCs will be able to:
- ✅ See their positions in "My Positions" page
- ✅ Create new positions (automatically saved with lowercase email)
- ✅ Use all filters and search functionality
- ✅ View candidate details in expandable rows

---

**Status:** Ready to run after deployment completes
**Estimated Time:** 1-2 minutes
**Risk Level:** Low (backs up original values)
