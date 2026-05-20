# Manual Client SPOC Field Update Guide

## 🎯 Purpose
Update existing position records in `admin_AddPos` collection to store full email addresses in the `clientspoc` field instead of first names.

## 📋 Records to Update

Based on your database, you need to update positions where `clientspoc` contains first names to full email addresses:

### Mapping Table:
| Current Value (First Name) | New Value (Email) |
|----------------------------|-------------------|
| Chandan | Chandan.dhami@changeleaders.in |
| Manish | manish.prasad@changeleaders.in |
| Akansha | akansha.chaudhary@changeleaders.in |

## 🔧 Manual Update Steps

### Option 1: Firebase Console (Recommended for Small Updates)

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/project/recruitorv-1291c/firestore
   - Navigate to `admin_AddPos` collection

2. **Filter by Client SPOC:**
   - Click "Start collection"
   - Add filter: `clientspoc == "Chandan"`
   - This will show all positions created by Chandan

3. **Update Each Document:**
   - Click on each document
   - Find the `clientspoc` field
   - Change value from `"Chandan"` to `"Chandan.dhami@changeleaders.in"`
   - Click "Update"

4. **Repeat for Other Users:**
   - Filter: `clientspoc == "Manish"` → Update to `"manish.prasad@changeleaders.in"`
   - Filter: `clientspoc == "Akansha"` → Update to `"akansha.chaudhary@changeleaders.in"`

### Option 2: Firestore Rules Script (For Bulk Updates)

If you have many records, you can use this script in Firebase Console:

1. Go to Firebase Console → Firestore → Rules
2. Temporarily allow write access (ONLY for migration)
3. Run this in browser console on Firebase Console page:

```javascript
// WARNING: Only run this once during migration!
const updateClientSpoc = async () => {
  const mapping = {
    "Chandan": "Chandan.dhami@changeleaders.in",
    "Manish": "manish.prasad@changeleaders.in",
    "Akansha": "akansha.chaudhary@changeleaders.in"
  };

  for (const [firstName, email] of Object.entries(mapping)) {
    const snapshot = await firebase.firestore()
      .collection('admin_AddPos')
      .where('clientspoc', '==', firstName)
      .get();

    console.log(`Found ${snapshot.size} positions for ${firstName}`);

    const batch = firebase.firestore().batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        clientspoc: email,
        previousClientSpoc: firstName,
        migratedAt: new Date()
      });
    });

    await batch.commit();
    console.log(`✅ Updated ${snapshot.size} positions: ${firstName} → ${email}`);
  }

  console.log('🎉 Migration complete!');
};

// Run the migration
updateClientSpoc();
```

### Option 3: Using Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy the migration function
firebase deploy --only functions:migrateClientSpoc

# Call the function
firebase functions:call migrateClientSpoc
```

## ✅ Verification Steps

After updating records:

1. **Check a Sample Record:**
   - Open any position in Firebase Console
   - Verify `clientspoc` field now contains full email
   - Example: `"Chandan.dhami@changeleaders.in"` instead of `"Chandan"`

2. **Test Login:**
   - Login as Chandan.dhami@changeleaders.in
   - Navigate to "My Positions"
   - Verify positions are now visible

3. **Check All Users:**
   - Repeat for manish.prasad@changeleaders.in
   - Repeat for akansha.chaudhary@changeleaders.in

## 📊 Expected Results

### Before Update:
```javascript
{
  pos_id: "1234",
  position: "Senior Developer",
  client: "LTIMindtree",
  clientspoc: "Chandan",  // ❌ First name only
  // ... other fields
}
```

### After Update:
```javascript
{
  pos_id: "1234",
  position: "Senior Developer",
  client: "LTIMindtree",
  clientspoc: "Chandan.dhami@changeleaders.in",  // ✅ Full email
  previousClientSpoc: "Chandan",  // Backup of old value
  migratedAt: "2024-01-15T10:30:00Z",  // Migration timestamp
  // ... other fields
}
```

## 🚨 Important Notes

1. **Backup First:**
   - Export your Firestore data before making bulk changes
   - Go to: Firestore → Import/Export → Export

2. **One-Time Operation:**
   - This migration should only be run once
   - Future positions will automatically use email (after frontend deployment)

3. **Case Sensitivity:**
   - Ensure email addresses match exactly
   - Firebase queries are case-sensitive

4. **New Positions:**
   - After deployment, new positions will automatically store emails
   - No manual intervention needed for future records

## 🔄 Alternative: Wait for Natural Migration

If you prefer not to manually update:
- Deploy the updated frontend
- New positions will use email format
- Old positions will gradually become inactive
- Eventually all active positions will have email format

However, this means Client SPOCs won't see their old positions until they're manually updated.

## 📞 Support

If you encounter issues:
1. Check Firebase Console for error messages
2. Verify user emails in `recruiter_db` collection
3. Ensure `clientspoc` field exists in all position documents

---

**Recommendation:** Use Option 1 (Firebase Console) for immediate fix if you have < 50 positions to update. Use Option 2 (Script) if you have many positions.
