#!/bin/bash

echo "🚀 Deploying Position Creation Fix to Production"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found. Please install it first:${NC}"
    echo "npm install -g firebase-tools"
    exit 1
fi

echo -e "${BLUE}📋 Changes to be deployed:${NC}"
echo "  - Frontend/src/pages/Ad_Pos.jsx (Position creation fix)"
echo "  - Added withCredentials: true to axios request"
echo "  - Enhanced error handling for authentication"
echo ""

# Step 1: Build Frontend
echo -e "${YELLOW}Step 1/3: Building Frontend...${NC}"
cd Frontend
if npm run build; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
cd ..
echo ""

# Step 2: Deploy to Firebase
echo -e "${YELLOW}Step 2/3: Deploying to Firebase...${NC}"
echo "This will deploy:"
echo "  - Hosting (Frontend)"
echo "  - Functions (Backend - no changes, but will redeploy)"
echo ""

if firebase deploy --only hosting,functions; then
    echo -e "${GREEN}✅ Deployment successful${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
echo ""

# Step 3: Verification
echo -e "${YELLOW}Step 3/3: Post-Deployment Verification${NC}"
echo ""
echo -e "${BLUE}📝 Please verify the following:${NC}"
echo "  1. Login to admin panel"
echo "  2. Navigate to 'Add Position' page"
echo "  3. Fill out the form and submit"
echo "  4. Verify position is created successfully"
echo "  5. Check browser console for any errors"
echo ""

echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "  - Fix Applied: Position creation authentication"
echo "  - Files Modified: Frontend/src/pages/Ad_Pos.jsx"
echo "  - Status: Deployed to Production"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "  - Users must be logged in to create positions"
echo "  - Authentication cookies are now sent with requests"
echo "  - Better error messages for failed attempts"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "  - FIREBASE_CONNECTION_DIAGNOSTIC.md"
echo "  - POSITION_CREATION_FIX.md"
echo "  - FIREBASE_AND_POSITION_FIX_SUMMARY.md"
echo ""
echo "Deployment completed at: $(date)"
