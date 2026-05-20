# 🚀 Quick Start - RecruiterV Local Setup

## Step 1: Install Dependencies

Open terminal in the project root directory and run:

```bash
# Install root dependencies
npm install

# Install Backend dependencies
cd Backend
npm install
cd ..

# Install Frontend dependencies
cd Frontend
npm install
cd ..
```

## Step 2: Configure Environment Variables

Edit the file `Backend/.local.env` and update these important variables:

```env
# Minimum required configuration:
SECKEY=your-secret-key-here
FRONTURL=http://localhost:5173
```

**Note:** For full functionality (OTP, emails), you'll need to configure email settings. See `SETUP_GUIDE.md` for details.

## Step 3: Start the Servers

### Option A: Manual Start (Recommended)

**Terminal 1 - Backend:**
```bash
cd Backend
node index.js
```
Keep this terminal running. You should see the backend start successfully.

**Terminal 2 - Frontend:**
Open a NEW terminal window and run:
```bash
cd Frontend
npm run dev
```
Keep this terminal running too.

### Option B: Using Start Script (macOS/Linux)

```bash
./start-dev.sh
```

## Step 4: Open the Application

Open your browser and go to:
```
http://localhost:5173
```

You should see the RecruiterV homepage! 🎉

---

## 🔍 Verify Everything is Working

1. **Backend Check:** Open http://localhost:5000 - you should see "RecruiterV Backend is running on Firebase!"
2. **Frontend Check:** Open http://localhost:5173 - you should see the homepage
3. **Console Check:** No errors in browser console (F12)

---

## 🛑 Stopping the Servers

Press `Ctrl + C` in each terminal window to stop the servers.

---

## ⚠️ Common Issues

### "Port already in use"
```bash
# Kill process on port 5000 (Backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173 (Frontend)
lsof -ti:5173 | xargs kill -9
```

### "Module not found"
Make sure you ran `npm install` in all three directories (root, Backend, Frontend)

### "Cannot connect to backend"
1. Make sure Backend is running on port 5000
2. Check Backend terminal for errors
3. Verify `.local.env` file exists in Backend directory

---

## 📚 Next Steps

Once the application is running:
1. Explore the homepage
2. Try registering a new user
3. Check out different user categories
4. Ready to add the blog feature!

For detailed setup information, see `SETUP_GUIDE.md`

---

## 🆘 Need Help?

If you encounter any issues:
1. Check both terminal windows for error messages
2. Check browser console (F12) for frontend errors
3. Verify all dependencies are installed
4. Make sure `.local.env` is configured

Happy coding! 🚀
