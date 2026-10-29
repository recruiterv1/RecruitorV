// Single entry point for the data layer. DB_DRIVER=mysql selects the MySQL document store;
// anything else keeps the original Firestore client.
const driver = (process.env.DB_DRIVER || 'firestore').toLowerCase();

if (driver === 'mysql') {
  module.exports = { driver, ...require('./mysql') };
} else {
  const { FieldValue, Timestamp, FieldPath } = require('firebase-admin/firestore');
  module.exports = { driver, FieldValue, Timestamp, FieldPath, get db() { return require('../router/firebase_ad').db; } };
}
