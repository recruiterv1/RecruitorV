# Deploying RecruitorV on Hostinger (Node.js) with Firebase on Spark

Firebase stays only for Firestore/Storage/Auth data. Hostinger runs the Express
backend AND serves the built frontend (same origin, so login cookies work).

## 1. Firebase service account
Firebase Console → Project settings → Service accounts → Generate new private key.
Base64 it: `base64 -i key.json | tr -d '\n'` → use as `FIREBASE_SERVICE_ACCOUNT`.

## 2. Hostinger hPanel → Websites → Add website → Node.js Web App
- Import from GitHub (this repo), branch `main`, root directory `/`
- Build command: `npm run build`
- Start command: `npm start`   (Node 20)

## 3. Environment variables (hPanel → Node.js → Environment)
NODE_ENV=production
FIREBASE_SERVICE_ACCOUNT=<base64 from step 1>
EMAIL, PASSW, SECKEY, FRONTURL (=https://www.recruiterv.com),
LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI,
BREVO_SMTP_HOST, BREVO_SMTP_PORT, BREVO_SMTP_USER, BREVO_SMTP_PASS, BREVO_API_KEY,
GMAIL_REPLY_USER, GMAIL_REPLY_PASS, ANTHROPIC_API_KEY, RESEND_API_KEY,
RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_PLAN_MONTHLY, RAZORPAY_PLAN_6MONTH,
RAZORPAY_PLAN_1YEAR, RAZORPAY_WEBHOOK_SECRET, RAZORPAY_CURRENCY
Optional: WARM_INDEX_CRON (default `*/10 * * * *`, see warning below)
Copy the values from Firebase Console → Secret Manager (or your old .env.local).

## 4. Domain
Point recruiterv.com / www to Hostinger (DNS A/CNAME as hPanel shows), enable SSL.
Update the Razorpay webhook and LinkedIn redirect URL if they pointed at the old host.

## Warnings
- Firestore Spark quota: 50k reads / 20k writes per day. The `warmResumeBankIndex`
  job reads the whole candidate pool every 10 min and can exhaust it. Set
  WARM_INDEX_CRON to something sparse (e.g. `0 */3 * * *`) or watch usage.
- Cloud Storage for Firebase may require Blaze for new/ongoing use; uploads
  (resumes, certificates) go through `admin.storage()`. Verify uploads work.
- Cron jobs run inside the Node process; the app must stay always-on.
