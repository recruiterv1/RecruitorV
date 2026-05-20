#!/bin/bash

# 🚀 Deployment Script for Recruiter Activity Tracking & Auto-Logout Features
# This script builds and deploys the new features to Firebase production

set -e  # Exit on error

echo "🚀 Starting deployment for Activity Tracking & Auto-Logout Features..."
echo ""
echo "📋 Features being deployed:"
echo "  1. Last Active Date/Time Display in Recruiter Statistics"
echo "  2. Auto-Logout After 30 Minutes of Inactivity"
echo ""

# Confirmation
read -p "⚠️  This will deploy to PRODUCTION. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Deployment cancelled."
    exit 1
fi

echo ""
echo "📦 Step 1: Installing dependencies..."
echo ""

# Install Backend dependencies
echo "  → Installing Backend dependencies..."
cd Backend
npm install
cd ..
echo "  ✅ Backend dependencies installed"

# Install Frontend dependencies
echo "  → Installing Frontend dependencies..."
cd Frontend
npm install
cd ..
echo "  ✅ Frontend dependencies installed"

echo ""
echo "🔨 Step 2: Building Frontend..."
cd Frontend
npm run build
cd ..
echo "✅ Frontend built successfully!"
echo ""

# Step 3: Deploy to Firebase
echo "🔥 Step 3: Deploying to Firebase..."
echo "  → Deploying Functions (Backend)..."
echo "  → Deploying Hosting (Frontend)..."
echo "  → Deploying Firestore Rules..."
firebase deploy
echo "✅ Deployment complete!"
echo ""

# Step 4: Summary
echo "🎉 Deployment successful!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 DEPLOYED FEATURES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Feature 1: Last Active Date/Time Display"
echo "   • Recruiter statistics now show last active instead of ID"
echo "   • Smart date formatting (e.g., '2 hours ago')"
echo "   • Sortable and exportable to CSV"
echo ""
echo "✅ Feature 2: Auto-Logout After 30 Minutes"
echo "   • Automatic logout after 30 minutes of inactivity"
echo "   • Activity tracking (mouse, keyboard, scroll)"
echo "   • Clear notification on login page"
echo "   • Only affects recruiters (not admins)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VERIFICATION STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Visit: https://www.recruiterv.com/"
echo ""
echo "2. Test Last Active Feature:"
echo "   • Login as Super Admin"
echo "   • Navigate to Recruiter Statistics"
echo "   • Verify 'Last active' shows instead of ID"
echo "   • Test sorting by clicking recruiter name"
echo "   • Export CSV and verify last active column"
echo ""
echo "3. Test Auto-Logout Feature:"
echo "   • Login as a recruiter"
echo "   • Wait 30 minutes without any activity"
echo "   • Verify automatic logout occurs"
echo "   • Check login page shows inactivity message"
echo ""
echo "4. Test Activity Tracking:"
echo "   • Login as a recruiter"
echo "   • Perform actions (click, type, scroll)"
echo "   • Check browser console for activity logs"
echo "   • Verify no logout occurs while active"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 IMPORTANT NOTES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "• Existing recruiters will show 'Never' until next login"
echo "• Admin users are NOT affected by auto-logout"
echo "• Activity updates backend every 5 minutes"
echo "• Inactivity timeout is set to 30 minutes"
echo ""
echo "📚 Documentation:"
echo "   • IMPLEMENTATION_SUMMARY.md - Complete overview"
echo "   • LAST_ACTIVE_FEATURE.md - Last active details"
echo "   • AUTO_LOGOUT_FEATURE.md - Auto-logout details"
echo "   • TODO.md - Implementation checklist"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Deployment completed successfully!"
echo ""
