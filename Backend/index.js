const functions = require("firebase-functions");
const express = require("express");
const app = express();

// Force deployment timestamp: Sun Jan 26 21:25:00 IST 2026 - Profile API fix: uid in /auth/check

app.set("trust proxy", 1);

const cors = require("cors");
app.use(express.json());

// CORS configuration - handle both simple and preflight requests
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow these origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://recruitorv-1291c.web.app',
      'https://www.recruiterv.com',
      'https://recruitorv-1291c--www-recruiterv-com-xxvlyqb4.web.app',
      undefined // for file:// protocol
    ];
    
    if (allowedOrigins.includes(origin) || origin.endsWith('.web.app') || origin.endsWith('.googleusercontent.com')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // 24 hours
}));

// Handle OPTIONS preflight requests - use middleware instead of route
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    // CORS preflight request
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.status(204).end();
      return;
    }
  }
  next();
});

app.use(express.urlencoded({ extended: true }));

// Load Firebase secrets
const { loadSecretsIntoProcessEnv, SECRETS } = require("./loadSecrets.js");

// Local .env support
if (!process.env.K_SERVICE) {
  // Not running on Firebase Cloud Run → local environment
  const dotenv = require("dotenv");
  dotenv.config();
  console.log("Loaded .env for local development");
}


// Routers
const authGoogla = require("./router/authGoogle");
const authLink = require("./router/authLink");
const admin = require("./router/admin");
const adminFixEmail = require("./router/adminFixEmail");
const recReg = require("./router/rout");
const position = require("./router/position");
const candi = require("./router/candidate");
const download = require("./router/download");
const clientspoc=require("./router/clientspoc.js")
const recruiterStats=require("./router/recruiterStats.js")
const clientspocStats=require("./router/clientspocStats.js")
const positionStats=require("./router/positionStats.js")
const dashboardStats=require("./router/dashboardStats.js")
const candidateStats=require("./router/candidateStats.js")
const clientStats=require("./router/clientStats.js")
const blog = require("./router/blog.js");
const positionAccess = require("./router/positionAccess.js");
const recruiterEarnings = require("./router/recruiterEarnings.js");
const coachExpert = require("./router/coachExpert.js");
const profile = require("./router/profile.js");


const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use("/auth", recReg);
app.use("/api/profile", profile);
app.use("/admin", admin);
app.use("/admin-fix-email", adminFixEmail);
app.use("/candidate", position);
app.use("/addit", candi);
app.use("/download", download);
app.use("/api/linkedin", authLink);
app.use("/api/googla", authGoogla);
app.use("/clientspoc",clientspoc);
app.use("/recruiterstats",recruiterStats);
app.use("/clientspocstats",clientspocStats);
app.use("/clientstats",clientStats);
app.use("/positionstats",positionStats);
app.use("/dashboardstats",dashboardStats);
app.use("/candidatestats",candidateStats);
app.use("/blog", blog);
app.use("/api/position-access", positionAccess);
app.use("/api/recruiter-earnings", recruiterEarnings);
app.use("/api/notifications", require("./router/notification"));
app.use("/api/coach-expert", coachExpert);
app.use("/api/debug", require("./router/checkUser"));


app.get("/", (req, res) => {
  res.cookie("name", "utkarsg");
  res.send("RecruitorV Backend is running on Firebase!");
});

// ---- LOCAL DEVELOPMENT SERVER ----
if (!process.env.K_SERVICE) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: Local Development`);
  });
}

// ---- FINAL EXPORT (CommonJS, working) ----
exports.api = functions.https.onRequest(
  { 
    secrets: SECRETS.map(s => s.secret),
    region: 'us-central1',
    invoker: 'public'  // Allow public access
  },
  (req, res) => {
    loadSecretsIntoProcessEnv();
    app(req, res);
  }
);
