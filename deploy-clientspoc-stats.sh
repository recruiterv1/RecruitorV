#!/bin/bash

# 🚀 Deployment Script for Client SPOC Statistics Feature
# This script builds and deploys the Client SPOC Stats feature to Firebase

set -e  # Exit on error

echo "🚀 Starting Client SPOC Statistics Feature Deployment..."
echo ""

# Display changes
echo "📋 Changes being deployed:"
echo "  ✅ Completed ClientSpocStats.jsx component (added 282 lines)"
echo "  ✅ Integrated into SuperAdmin navigation menu"
echo "  ✅ All features implemented:"
echo "     - SPOC statistics dashboard"
echo "     - Inactivity detection (3+ days)"
echo "     - Email functionality for inactive SPOCs"
echo "     - Detailed client-wise position breakdown"
echo "     - Search, sort, pagination, export features"
echo ""

# Step 1: Build Frontend
echo "📦 Step 1: Building Frontend..."
cd Frontend
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend built successfully!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi
cd ..
echo ""

# Step 2: Deploy to Firebase
echo "🔥 Step 2: Deploying to Firebase..."
npx firebase deploy
if [ $? -eq 0 ]; then
    echo "✅ Firebase deployment complete!"
else
    echo "❌ Firebase deployment failed!"
    exit 1
fi
echo ""

# Step 3: Success Message
echo "🎉 Client SPOC Statistics Feature Deployed Successfully!"
echo ""
echo "🌐 Your application is now live at: https://www.recruiterv.com/"
echo ""
echo "📝 Please verify the deployment:"
echo "  1. Visit https://www.recruiterv.com/"
echo "  2. Login as Super Admin"
echo "  3. Navigate to 'Client SPOC Statistics' in the sidebar"
echo "  4. Verify all features work:"
echo "     ✓ Statistics load correctly"
echo "     ✓ Search and sort functionality"
echo "     ✓ Inactive SPOC detection (😔 emoji badge)"
echo "     ✓ Email sending to inactive SPOCs"
echo "     ✓ Row expansion for detailed breakdown"
echo "     ✓ CSV export"
echo ""
echo "📚 Documentation:"
echo "  - Feature Guide: CLIENT_SPOC_STATS_FEATURE.md"
echo "  - Quick Reference: CLIENT_SPOC_QUICK_GUIDE.md"
echo ""
echo "✨ Deployment completed at: $(date)"
