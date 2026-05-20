/**
 * Script to verify clientspoc data in admin_AddPos collection
 * This will show what values are currently stored and help identify any issues
 */

const { db } = require("../router/firebase_ad");

async function verifyClientSpocData() {
  try {
    console.log("🔍 Verifying clientspoc data in admin_AddPos collection...\n");
    
    const snapshot = await db.collection('admin_AddPos').get();
    console.log(`📊 Total positions found: ${snapshot.size}\n`);

    const clientSpocData = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const clientspoc = data.clientspoc || 'NOT SET';
      
      if (!clientSpocData[clientspoc]) {
        clientSpocData[clientspoc] = {
          count: 0,
          isEmail: emailPattern.test(clientspoc),
          isLowercase: clientspoc === clientspoc.toLowerCase(),
          positions: []
        };
      }
      
      clientSpocData[clientspoc].count++;
      clientSpocData[clientspoc].positions.push({
        pos_id: data.pos_id,
        position: data.position,
        client: data.client
      });
    });

    console.log("📋 Client SPOC Values Summary:\n");
    console.log("┌─────────────────────────────────────────┬───────┬─────────┬────────────┐");
    console.log("│ Client SPOC Value                       │ Count │ IsEmail │ IsLowercase│");
    console.log("├─────────────────────────────────────────┼───────┼─────────┼────────────┤");
    
    Object.entries(clientSpocData)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([value, data]) => {
        const displayValue = value.length > 39 ? value.substring(0, 36) + '...' : value;
        const paddedValue = displayValue.padEnd(39);
        const paddedCount = data.count.toString().padStart(5);
        const isEmail = data.isEmail ? '   ✓   ' : '   ✗   ';
        const isLower = data.isLowercase ? '     ✓     ' : '     ✗     ';
        
        console.log(`│ ${paddedValue} │ ${paddedCount} │${isEmail}│${isLower}│`);
      });
    
    console.log("└─────────────────────────────────────────┴───────┴─────────┴────────────┘\n");

    // Detailed breakdown
    console.log("📊 Detailed Analysis:\n");
    
    const emailValues = Object.entries(clientSpocData).filter(([_, data]) => data.isEmail);
    const nonEmailValues = Object.entries(clientSpocData).filter(([_, data]) => !data.isEmail);
    const mixedCaseEmails = emailValues.filter(([_, data]) => !data.isLowercase);
    const lowercaseEmails = emailValues.filter(([_, data]) => data.isLowercase);
    
    console.log(`✉️  Email addresses: ${emailValues.length} unique values`);
    console.log(`   - Lowercase: ${lowercaseEmails.length}`);
    console.log(`   - Mixed case: ${mixedCaseEmails.length}`);
    console.log(`\n📝 Non-email values: ${nonEmailValues.length} unique values`);
    
    if (mixedCaseEmails.length > 0) {
      console.log(`\n⚠️  Mixed-case emails found (need to be converted to lowercase):`);
      mixedCaseEmails.forEach(([value, data]) => {
        console.log(`   - "${value}" → "${value.toLowerCase()}" (${data.count} positions)`);
      });
    }
    
    if (nonEmailValues.length > 0) {
      console.log(`\n⚠️  Non-email values found (may need to be converted to emails):`);
      nonEmailValues.forEach(([value, data]) => {
        if (value !== 'NOT SET') {
          console.log(`   - "${value}" (${data.count} positions)`);
          console.log(`     Sample positions:`);
          data.positions.slice(0, 3).forEach(pos => {
            console.log(`       • ${pos.pos_id}: ${pos.position} @ ${pos.client}`);
          });
        }
      });
    }

    // Recommendations
    console.log(`\n💡 Recommendations:\n`);
    
    if (mixedCaseEmails.length > 0) {
      console.log(`1. Run updateClientSpocToLowercase.js to convert ${mixedCaseEmails.length} mixed-case emails to lowercase`);
    } else {
      console.log(`1. ✅ All email addresses are already lowercase`);
    }
    
    if (nonEmailValues.length > 0 && nonEmailValues.some(([v]) => v !== 'NOT SET')) {
      console.log(`2. ⚠️  Found ${nonEmailValues.length} non-email values - these may need manual review`);
      console.log(`   - If these are first names, they should be converted to emails`);
      console.log(`   - Check with the team to get the correct email addresses`);
    } else {
      console.log(`2. ✅ All clientspoc values are email addresses`);
    }

    console.log(`\n✨ Verification complete!`);
    
  } catch (error) {
    console.error("❌ Error verifying data:", error);
    throw error;
  }
}

// Run the script
console.log("🚀 Starting Client SPOC Data Verification\n");
verifyClientSpocData()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
