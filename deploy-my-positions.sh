#!/bin/bash

echo "🚀 Deploying My Positions Feature..."
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build Frontend
echo -e "${BLUE}📦 Step 1: Building Frontend...${NC}"
cd Frontend
npm run build

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}❌ Frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build successful!${NC}"
echo ""

# Step 2: Deploy to Firebase
cd ..
echo -e "${BLUE}🔥 Step 2: Deploying to Firebase...${NC}"
firebase deploy --only hosting,functions

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}❌ Firebase deployment failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "======================================"
echo "📋 Post-Deployment Checklist:"
echo "======================================"
echo "1. ✅ Clear browser cache (Ctrl+Shift+R)"
echo "2. ✅ Login to admin panel"
echo "3. ✅ Verify 'All Positions' label (not 'Open Positions')"
echo "4. ✅ Check 'My Positions' menu item appears"
echo "5. ✅ Click 'My Positions' and verify:"
echo "   - Positions are filtered by your clientspoc"
echo "   - Candidate count column appears"
echo "   - Click count to expand candidate details"
echo "   - Candidates grouped by recruiter"
echo "   - Status colors display correctly"
echo ""
echo "🌐 Live URL: https://recruitorv-1291c.web.app"
echo ""
echo -e "${GREEN}🎉 All done!${NC}"
