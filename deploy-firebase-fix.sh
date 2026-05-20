#!/bin/bash

echo "🔧 Deploying Firebase Connection Fix..."
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}❌ Error: firebase.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Changes being deployed:${NC}"
echo "  ✓ Updated Backend/router/firebase_ad.js with proper Firebase Admin initialization"
echo "  ✓ Added connection health check"
echo "  ✓ Updated Backend/.gitignore to exclude service account keys"
echo ""

# Ask for confirmation
read -p "Do you want to proceed with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Deployment cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🚀 Deploying to Firebase...${NC}"
echo ""

# Deploy only functions (backend)
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next Steps:${NC}"
    echo "  1. Test position creation in your app"
    echo "  2. Check Firebase Functions logs: firebase functions:log"
    echo "  3. Look for these messages in logs:"
    echo "     - '✅ Firebase Admin initialized with default credentials'"
    echo "     - '✅ Firestore connection successful'"
    echo ""
    echo -e "${YELLOW}🔍 To view logs:${NC}"
    echo "  firebase functions:log --only api"
    echo ""
    echo -e "${YELLOW}🧪 To test locally:${NC}"
    echo "  cd Backend"
    echo "  npm start"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  1. Make sure you're logged in: firebase login"
    echo "  2. Check your Firebase project: firebase use"
    echo "  3. Verify your internet connection"
    echo "  4. Check the error message above"
    echo ""
    exit 1
fi
