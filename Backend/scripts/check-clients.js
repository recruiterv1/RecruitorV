const { db } = require('../router/firebase_ad');
const companyF = require('../model_fire/companyF');

// Full client list from task
const clientList = [
  "Tech Mahindra",
  "Know Max", 
  "Acuvate",
  "Asian Paints",
  "AU Bank",
  "RBL Bank",
  "Tata Capital",
  "Aditya Birla Capital",
  "Muthoot Fincorp",
  "Dainik Bhaskar",
  "Brillio",
  "LTIMindtree",
  "Affine Analytics",
  "Shriram Wealth"
];

async function checkClients() {
  console.log('🔍 Checking clients in Company_Overview...\n');
  
  let existing = 0;
  let missing = 0;
  const results = [];
  
  for (const client of clientList) {
    try {
      const companyData = await companyF.fetchCompanyOverview(client);
      
      if (companyData) {
        console.log(`✅ ${client.padEnd(25)} | EXISTS`);
        existing++;
        results.push({ client, status: 'EXISTS', data: companyData });
      } else {
        console.log(`❌ ${client.padEnd(25)} | MISSING (NEW)`);
        missing++;
        results.push({ client, status: 'MISSING' });
      }
    } catch (error) {
      console.log(`⚠️  ${client.padEnd(25)} | ERROR: ${error.message}`);
      results.push({ client, status: 'ERROR', error: error.message });
    }
  }
  
  console.log('\n📊 SUMMARY:');
  console.log(`Existing: ${existing}`);
  console.log(`New/Missing: ${missing}`);
  console.log(`Total: ${clientList.length}`);
  
  console.log('\n📋 NEW CLIENTS TO ADD:');
  const newClients = results.filter(r => r.status === 'MISSING');
  newClients.forEach(r => console.log(`  - ${r.client}`));
  
  console.log('\n✅ Check complete!');
}

checkClients().catch(console.error);
