#!/bin/bash

# Deployment script for Recruiter Stats Plan Type Filter Feature
# This script deploys both backend and frontend changes

echo "========================================="
echo "Deploying Plan Type Filter Feature"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "Backend" ] || [ ! -d "Frontend" ]; then
    echo -e "${RED}Error: Must be run from project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}Step 1: Deploying Backend Changes${NC}"
echo "-----------------------------------"
cd Backend

# Check if firebase is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI not found. Please install it first.${NC}"
    echo "Run: npm install -g firebase-tools"
    exit 1
fi

# Deploy backend functions
echo "Deploying Firebase Functions..."
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend deployed successfully${NC}"
else
    echo -e "${RED}✗ Backend deployment failed${NC}"
    exit 1
fi

cd ..

echo ""
echo -e "${BLUE}Step 2: Building Frontend${NC}"
echo "-----------------------------------"
cd Frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build frontend
echo "Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend built successfully${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 3: Deploying Frontend${NC}"
echo "-----------------------------------"

# Deploy frontend
echo "Deploying to Firebase Hosting..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend deployed successfully${NC}"
else
    echo -e "${RED}✗ Frontend deployment failed${NC}"
    exit 1
fi

cd ..

echo ""
echo "========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "========================================="
echo ""
echo "Changes deployed:"
echo "  ✓ Backend: Added planType field to recruiter stats API"
echo "  ✓ Frontend: Added plan type filter UI and logic"
echo ""
echo "Next steps:"
echo "  1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
echo "  2. Navigate to Recruiter Statistics page"
echo "  3. Verify filter buttons appear below search bar"
echo "  4. Test filtering by Free Plan (0) and Paid Plan (1)"
echo "  5. Verify plan type badges appear next to recruiter names"
echo ""
echo "For detailed information, see: RECRUITER_STATS_PLANTYPE_FILTER.md"
echo ""
