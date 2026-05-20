#!/bin/bash

echo "=========================================="
echo "Dashboard & Candidate Statistics Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Deployment Steps:${NC}"
echo "1. Deploy Backend Functions"
echo "2. Build Frontend"
echo "3. Deploy Frontend Hosting"
echo ""

# Step 1: Deploy Backend
echo -e "${YELLOW}Step 1: Deploying Backend Functions...${NC}"
cd Backend
echo "Running: firebase deploy --only functions"
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
else
    echo -e "${RED}❌ Backend deployment failed!${NC}"
    exit 1
fi

cd ..

# Step 2: Build Frontend
echo ""
echo -e "${YELLOW}Step 2: Building Frontend...${NC}"
cd Frontend
echo "Running: npm run build"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully!${NC}"
else
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi

# Step 3: Deploy Frontend
echo ""
echo -e "${YELLOW}Step 3: Deploying Frontend Hosting...${NC}"
echo "Running: firebase deploy --only hosting"
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
else
    echo -e "${RED}❌ Frontend deployment failed!${NC}"
    exit 1
fi

cd ..

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo "=========================================="
echo ""
echo "📋 Deployed Components:"
echo "  ✅ Backend Functions (Dashboard & Candidate Stats APIs)"
echo "  ✅ Frontend Hosting (Dashboard & Candidate Stats Pages)"
echo ""
echo "🔗 New Features Available:"
echo "  • Dashboard with 6 metric cards"
echo "  • Time-based filters (Today, Week, Month)"
echo "  • Candidate Statistics page"
echo "  • Advanced filtering and export"
echo ""
echo "📝 Next Steps:"
echo "  1. Test Dashboard at: https://your-app.web.app/superadmin"
echo "  2. Verify all 6 cards display correctly"
echo "  3. Test time filters"
echo "  4. Test Candidate Statistics page"
echo "  5. Verify all filters work"
echo ""
echo "📚 Documentation:"
echo "  • DASHBOARD_CANDIDATE_STATS_FEATURE.md"
echo "  • DASHBOARD_DEPLOYMENT_SUMMARY.md"
echo "  • DASHBOARD_QUICK_START.md"
echo ""
echo "=========================================="
