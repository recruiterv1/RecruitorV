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
  "FRONTURL",
  "GMAIL_REPLY_USER",
  "GMAIL_REPLY_PASS",
  "ANTHROPIC_API_KEY",
  "RESEND_API_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_PLAN_MONTHLY",
  "RAZORPAY_PLAN_6MONTH",
  "RAZORPAY_PLAN_1YEAR",
  "RAZORPAY_WEBHOOK_SECRET",
  "RAZORPAY_CURRENCY",
  "RIPPLEHIRE_USER",
  "RIPPLEHIRE_PASS"
];

const SECRETS = SECRET_KEYS.map(key => ({
  key,
  secret: defineSecret(key)
}));

function loadSecretsIntoProcessEnv() {
  for (const { key, secret } of SECRETS) {
    const val = secret.value();
    process.env[key] = typeof val === 'string' ? val.trim() : val;
  }
}

module.exports = { SECRET_KEYS, SECRETS, loadSecretsIntoProcessEnv };
