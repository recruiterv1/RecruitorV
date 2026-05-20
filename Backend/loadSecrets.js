const { defineSecret } = require("firebase-functions/params");

const SECRET_KEYS = [
  "EMAIL",
  "PASSW",
  "SECKEY",
  "LINKEDIN_CLIENT_ID",
  "LINKEDIN_CLIENT_SECRET",
  "LINKEDIN_REDIRECT_URI",
  "BREVO_SMTP_HOST",
  "BREVO_SMTP_PORT",
  "BREVO_SMTP_USER",
  "BREVO_SMTP_PASS",
  "BREVO_API_KEY",
  "FRONTURL"
];

const SECRETS = SECRET_KEYS.map(key => ({
  key,
  secret: defineSecret(key)
}));

function loadSecretsIntoProcessEnv() {
  for (const { key, secret } of SECRETS) {
    process.env[key] = secret.value();
  }
}

module.exports = { SECRET_KEYS, SECRETS, loadSecretsIntoProcessEnv };
