#!/bin/bash

# ClientSPOC My Positions Fix - Deployment Script
# This script deploys the fix for ClientSPOC users not seeing their positions

echo "=================================================="
echo "ClientSPOC My Positions Fix - Deployment"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}Error: firebase.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Pre-Deployment Checklist:${NC}"
echo "✓ Modified: Backend/router/position.js"
echo "✓ Added: ClientSPOC user lookup in /pos/my-positions endpoint"
echo "✓ No frontend changes required"
echo "✓ No database changes required"
echo ""

# Confirm deployment
read -p "Do you want to proceed with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🚀 Starting Backend Deployment...${NC}"
echo ""

# Deploy backend functions
echo "Deploying Firebase Functions..."
npx firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Backend deployment successful!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Post-Deployment Verification:${NC}"
    echo ""
    echo "Please verify the following:"
    echo ""
    echo "1. ClientSPOC User Test:"
    echo "   - Login as ClientSPOC user (e.g., chandan.dhami@changeleaders.in)"
    echo "   - Navigate to 'My Positions'"
    echo "   - Verify positions are displayed"
    echo "   - Check position details and candidate counts"
    echo "   - Test expandable rows for candidate details"
    echo "   - Test all filters"
    echo ""
    echo "2. Regular Recruiter Test:"
    echo "   - Login as regular recruiter"
    echo "   - Navigate to 'My Positions'"
    echo "   - Verify no regression (works as before)"
    echo ""
    echo "3. Admin User Test:"
    echo "   - Login as admin"
    echo "   - Navigate to 'My Positions'"
    echo "   - Verify admin sees all positions"
    echo ""
    echo "4. Check Logs:"
    echo "   - Check browser console for errors"
    echo "   - Check Firebase Functions logs for errors"
    echo ""
    echo -e "${GREEN}=================================================="
    echo "Deployment Complete!"
    echo "==================================================${NC}"
    echo ""
    echo "📖 For detailed information, see: CLIENTSPOC_MY_POSITIONS_FIX.md"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo ""
    echo "Please check the error messages above and try again."
    echo "If the issue persists, check:"
    echo "  - Firebase authentication"
    echo "  - Network connection"
    echo "  - Firebase project configuration"
    echo ""
    exit 1
fi
