const { findRecruiterByEmail } = require('./model_fire/recruiterF');

async function checkRecruiterStatus() {
  const email = 'dhamichandan@yahoo.in';
  
  console.log('='.repeat(60));
  console.log(`🔍 COMPREHENSIVE RECRUITER STATUS CHECK`);
  console.log(`📧 Email: ${email}`);
  console.log('='.repeat(60));
  
  try {
    const recruiter = await findRecruiterByEmail(email);
    
    if (!recruiter) {
      console.log('❌ RECRUITER NOT FOUND IN DATABASE');
      console.log('\nPossible causes:');
      console.log('1. User may have registered with a different email');
      console.log('2. User account may have been deleted');
      console.log('3. Email may have typo or different case');
      console.log('\nCheck: Firebase Console → Firestore → recruiter_db');
      return;
    }
    
    console.log('✅ RECRUITER FOUND IN DATABASE');
    console.log(`🆔 Document ID: ${recruiter.id}`);
    console.log('\n📋 Full Recruiter Data:');
    console.log(JSON.stringify(recruiter, null, 2));
    
    // Critical checks
    console.log('\n' + '='.repeat(60));
    console.log('🔍 CRITICAL STATUS CHECKS');
    console.log('='.repeat(60));
    
    // Check isVerified
    console.log(`\n1. Email Verification Status:`);
    console.log(`   isVerified: ${recruiter.isVerified}`);
    if (recruiter.isVerified) {
      console.log('   ✅ User is verified - Can login');
    } else {
      console.log('   ❌ User is NOT verified - Cannot login until OTP verified');
      console.log('   Solution: User needs to complete OTP verification');
    }
    
    // Check password exists
    console.log(`\n2. Password Status:`);
    console.log(`   Has password field: ${!!recruiter.password}`);
    console.log(`   Password hash length: ${recruiter.password ? recruiter.password.length : 0}`);
    
    // Check roleCategory
    console.log(`\n3. Role Category:`);
    console.log(`   roleCategory: ${recruiter.roleCategory || 'NOT SET (old user)'}`);
    if (recruiter.roleCategory) {
      console.log('   ✅ Role is set');
    } else {
      console.log('   ⚠️ Role is undefined - May affect routing after login');
    }
    
    // Check planType
    console.log(`\n4. Plan Type:`);
    console.log(`   planType: ${recruiter.planType}`);
    if (recruiter.planType === 0) {
      console.log('   📋 Free Plan - Has limits');
      console.log(`   Max Positions: ${recruiter.maxPositions}`);
      if (recruiter.planExpiryDate) {
        console.log(`   Plan Expiry: ${recruiter.planExpiryDate}`);
      } else {
        console.log('   ⚠️ Plan Expiry Date is MISSING - May cause "0 days" issue');
      }
    } else if (recruiter.planType === 1) {
      console.log('   💰 Paid Plan - Unlimited access');
    } else {
      console.log('   ⚠️ planType is undefined - May be old user');
    }
    
    // Check OTP fields
    console.log(`\n5. OTP Status:`);
    console.log(`   Has OTP field: ${!!recruiter.otp}`);
    console.log(`   Has OTP Expires: ${!!recruiter.otpExpires}`);
    if (recruiter.otpExpires) {
      console.log(`   OTP Expires at: ${new Date(Number(recruiter.otpExpires)).toISOString()}`);
      console.log(`   OTP Expired: ${Number(recruiter.otpExpires) < Date.now() ? 'YES' : 'NO'}`);
    }
    
    // Check lastActive
    console.log(`\n6. Last Active Status:`);
    if (recruiter.lastActive) {
      const lastActive = recruiter.lastActive.toDate ? recruiter.lastActive.toDate() : new Date(recruiter.lastActive);
      console.log(`   Last Active: ${lastActive.toISOString()}`);
      const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`   Days Since Active: ${daysSinceActive}`);
      if (daysSinceActive >= 3) {
        console.log('   ⚠️ User appears inactive (3+ days)');
      } else {
        console.log('   ✅ User is recently active');
      }
    } else {
      console.log('   lastActive field: NOT SET');
      console.log('   ⚠️ User may have never logged in or lastActive tracking not implemented');
    }
    
    // Summary and recommendations
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY & RECOMMENDATIONS');
    console.log('='.repeat(60));
    
    const issues = [];
    
    if (!recruiter.isVerified) {
      issues.push('User needs to verify OTP before logging in');
    }
    
    if (!recruiter.password) {
      issues.push('User has no password - may have registered via Google OAuth');
    }
    
    if (!recruiter.roleCategory) {
      issues.push('User role is undefined - may affect post-login routing');
    }
    
    if (recruiter.planType === 0 && !recruiter.planExpiryDate) {
      issues.push('Free plan user missing planExpiryDate - will show "0 days remaining"');
    }
    
    if (issues.length === 0) {
      console.log('\n✅ No critical issues found - User should be able to login');
      console.log('If login still fails:');
      console.log('1. Check browser console for errors');
      console.log('2. Verify network request is reaching backend');
      console.log('3. Check if password is correct');
    } else {
      console.log('\n❌ Issues Found:');
      issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
      
      console.log('\n🛠️ Solutions:');
      if (!recruiter.isVerified) {
        console.log('   - Send new OTP and have user verify email');
      }
      if (!recruiter.password) {
        console.log('   - User should login via Google OAuth instead');
        console.log('   - Or reset password to create password hash');
      }
      if (!recruiter.roleCategory) {
        console.log('   - Update user record with default role: "Recruiter"');
      }
      if (recruiter.planType === 0 && !recruiter.planExpiryDate) {
        console.log('   - Run fix script: node scripts/fixUserPlanExpiryDate.js dhamichandan@yahoo.in');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ ERROR during status check:', error);
    console.error(error.stack);
  }
}

checkRecruiterStatus();

