#!/bin/bash

# Deployment Script for Candidate Activity Table Feature
# This script deploys the candidate activity table to the SuperAdmin Dashboard

echo "=========================================="
echo "Candidate Activity Table Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root directory.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking Frontend changes...${NC}"
if [ ! -f "Frontend/src/pages/Dashboard.jsx" ]; then
    echo -e "${RED}Error: Dashboard.jsx not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dashboard.jsx found${NC}"
echo ""

echo -e "${YELLOW}Step 2: Installing Frontend dependencies (if needed)...${NC}"
cd Frontend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install frontend dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 3: Building Frontend...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Frontend build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

cd ..

echo -e "${YELLOW}Step 4: Deploying to Firebase...${NC}"
firebase deploy --only hosting
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Firebase deployment failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Deployed to Firebase successfully${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Navigate to SuperAdmin Dashboard"
echo "3. Verify the Candidate Activity Table appears after overview cards"
echo "4. Test all filters (Position, Status, Date)"
echo "5. Test pagination controls"
echo ""
echo "Documentation: CANDIDATE_ACTIVITY_TABLE_FEATURE.md"
echo "Quick Start: CANDIDATE_ACTIVITY_TABLE_QUICK_START.md"
echo ""
