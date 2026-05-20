# RecruiterV - Local Development Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** (v20.x or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

Check your versions:
```bash
node --version
npm --version
```

---

## 🚀 Quick Start Guide

### Step 1: Install Dependencies

#### Install Root Dependencies
```bash
npm install
```

#### Install Backend Dependencies
```bash
cd Backend
npm install
cd ..
```

#### Install Frontend Dependencies
```bash
cd Frontend
npm install
cd ..
```

---

### Step 2: Configure Environment Variables

#### Backend Configuration

Create a `.local.env` file in the `Backend` directory:

```bash
cd Backend
touch .local.env
```

Add the following environment variables to `Backend/.local.env`:

```env
# Email Configuration (for OTP)
EMAIL=your-email@gmail.com
PASSW=your-app-password

# JWT Secret Key
SECKEY=your-secret-key-here

# LinkedIn OAuth (if using LinkedIn login)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_REDIRECT_URI=http://localhost:5173/api/linkedin/callback

# Brevo SMTP Configuration (for email sending)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-brevo-smtp-user
BREVO_SMTP_PASS=your-brevo-smtp-password
BREVO_API_KEY=your-brevo-api-key

# Frontend URL
FRONTURL=http://localhost:5173
```

**Important Notes:**
- Replace all placeholder values with your actual credentials
- For Gmail, you need to generate an "App Password" (not your regular password)
- The SECKEY can be any random string (e.g., `my-super-secret-jwt-key-12345`)
- Brevo is used for email services (you can sign up at https://www.brevo.com/)

#### Firebase Configuration

The Firebase configuration is already set up in `Frontend/src/firebase.js`. No additional configuration needed for local development.

---

### Step 3: Start the Development Servers

You'll need **TWO terminal windows** - one for backend, one for frontend.

#### Terminal 1: Start Backend Server

```bash
cd Backend
node index.js
```

You should see:
```
Server running on port 5000 (or similar message)
```

The backend will run on: **http://localhost:5000**

#### Terminal 2: Start Frontend Development Server

Open a new terminal window:

```bash
cd Frontend
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

The frontend will run on: **http://localhost:5173**

---

### Step 4: Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

You should see the RecruiterV homepage! 🎉

---

## 🔧 Troubleshooting

### Issue: "Port already in use"

**Backend (Port 5000):**
```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
kill -9 $(lsof -ti:5000)
```

**Frontend (Port 5173):**
```bash
# Find process using port 5173
lsof -ti:5173

# Kill the process
kill -9 $(lsof -ti:5173)
```

### Issue: "Module not found"

Make sure you've installed all dependencies:
```bash
# Root
npm install

# Backend
cd Backend && npm install && cd ..

# Frontend
cd Frontend && npm install && cd ..
```

### Issue: "Firebase connection error"

The Firebase configuration is already set up. If you see Firebase errors:
1. Check your internet connection
2. Verify the Firebase config in `Frontend/src/firebase.js`
3. Make sure Firebase project is active

### Issue: "CORS errors"

The Vite proxy is configured to handle CORS. Make sure:
1. Backend is running on port 5000
2. Frontend is running on port 5173
3. Check `Frontend/vite.config.js` proxy settings

### Issue: "Cannot connect to backend"

1. Verify backend is running: `http://localhost:5000`
2. Check backend terminal for errors
3. Verify `.local.env` file exists in Backend directory
4. Check if all required environment variables are set

---

## 📁 Project Structure

```
finalrecuiter/
├── Backend/
│   ├── auth/              # Authentication middleware
│   ├── model_fire/        # Firebase Firestore models
│   ├── models/            # Other data models
│   ├── router/            # API routes
│   ├── index.js           # Main backend server
│   ├── loadSecrets.js     # Environment variable loader
│   ├── .local.env         # Local environment variables (create this)
│   └── package.json
│
├── Frontend/
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   ├── condition/     # Conditional components
│   │   ├── firebase.js    # Firebase configuration
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── vite.config.js     # Vite configuration
│   └── package.json
│
├── package.json           # Root package.json
└── README.md
```

---

## 🎯 Available Routes

### Public Routes
- `/` - Homepage
- `/reg` - Registration
- `/otp` - OTP Verification
- `/log_rec` - Recruiter Login
- `/about` - About Us
- `/pricing` - Pricing Plans

### User Category Routes
- `/fresher` - Freshers Dashboard
- `/switch-career` - Career Switchers
- `/corporate` - Corporate Recruiters
- `/restart` - Career Restart
- `/freelance` - Freelance Recruiters
- `/established` - Elite Partners

### Protected Routes (Requires Login)
- `/dash_rec` - Main Recruiter Dashboard
- `/dash_position` - Position Management
- `/dash_candidate` - Candidate Management
- `/cv_repo` - CV Repository
- `/superadmin` - Super Admin Panel
- `/ad_panel` - Admin Panel
- `/clientspoc` - Client SPOC Login

---

## 🔐 Test Accounts

### Super Admin Access
To access the Super Admin panel (`/superadmin`), you'll need to:
1. Register as a user with role "Super Admin"
2. Or configure admin credentials in Firebase

### Client SPOC Access
To access Client SPOC panel (`/clientspoc`), you'll need admin credentials configured in your Firebase database.

---

## 🛠️ Development Tips

### Hot Reload
Both frontend and backend support hot reload:
- **Frontend**: Vite automatically reloads on file changes
- **Backend**: Use `nodemon` for auto-restart (optional)

To use nodemon for backend:
```bash
cd Backend
npm install -g nodemon
nodemon index.js
```

### API Testing
Backend API is available at: `http://localhost:5000`

Test endpoints:
```bash
# Test backend is running
curl http://localhost:5000

# Test auth endpoint
curl http://localhost:5000/auth/test
```

### Browser DevTools
- Press `F12` to open browser developer tools
- Check Console for errors
- Check Network tab for API calls
- Check Application tab for cookies and local storage

---

## 📦 Building for Production

### Build Frontend
```bash
cd Frontend
npm run build
```

This creates an optimized production build in `Frontend/dist/`

### Preview Production Build
```bash
cd Frontend
npm run preview
```

---

## 🆘 Getting Help

If you encounter issues:

1. **Check the console** - Both browser console and terminal output
2. **Verify environment variables** - Make sure `.local.env` is properly configured
3. **Check dependencies** - Run `npm install` in all directories
4. **Clear cache** - Sometimes clearing browser cache helps
5. **Restart servers** - Stop and restart both backend and frontend

---

## ✅ Verification Checklist

Before starting development, verify:

- [ ] Node.js v20+ installed
- [ ] All dependencies installed (root, Backend, Frontend)
- [ ] `.local.env` file created in Backend directory
- [ ] Environment variables configured
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] Can access http://localhost:5173 in browser
- [ ] No console errors in browser
- [ ] No errors in backend terminal

---

## 🎉 You're Ready!

Once everything is set up and running, you can:
1. Register a new user
2. Verify with OTP
3. Access the dashboard
4. Start developing new features (like the blog!)

Happy coding! 🚀
