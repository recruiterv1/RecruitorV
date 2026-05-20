const { findRecruiterByEmail } = require('./model_fire/recruiterF');

async function testRecruiterLookup() {
  try {
    console.log('Testing recruiter lookup for: dhamichandan@yahoo.in');

    const recruiter = await findRecruiterByEmail('dhamichandan@yahoo.in');

    if (recruiter) {
      console.log('✅ Recruiter found:', JSON.stringify(recruiter, null, 2));
    } else {
      console.log('❌ Recruiter not found');
    }
  } catch (error) {
    console.error('Error during lookup:', error);
  }
}

testRecruiterLookup();
