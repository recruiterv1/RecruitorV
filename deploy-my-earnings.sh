#!/bin/bash

# My Earnings Feature Deployment Script
# This script deploys the My Earnings feature to production

echo "=========================================="
echo "My Earnings Feature Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_status "Starting My Earnings feature deployment..."
echo ""

# Step 1: Backend Deployment
print_status "Step 1: Deploying Backend..."
echo ""

cd Backend

# Check if Backend directory exists
if [ ! -d "." ]; then
    print_error "Backend directory not found!"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing Backend dependencies..."
    npm install
fi

# Deploy backend functions
print_status "Deploying Firebase Functions..."
firebase deploy --only functions

if [ $? -eq 0 ]; then
    print_success "Backend deployed successfully!"
else
    print_error "Backend deployment failed!"
    exit 1
fi

cd ..
echo ""

# Step 2: Frontend Deployment
print_status "Step 2: Deploying Frontend..."
echo ""

cd Frontend

# Check if Frontend directory exists
if [ ! -d "." ]; then
    print_error "Frontend directory not found!"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing Frontend dependencies..."
    npm install
fi

# Build frontend
print_status "Building Frontend..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Frontend build completed!"
else
    print_error "Frontend build failed!"
    exit 1
fi

# Deploy frontend hosting
print_status "Deploying Firebase Hosting..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    print_success "Frontend deployed successfully!"
else
    print_error "Frontend deployment failed!"
    exit 1
fi

cd ..
echo ""

# Step 3: Verification
print_status "Step 3: Deployment Verification"
echo ""

print_success "✅ My Earnings feature has been deployed successfully!"
echo ""
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
echo ""
echo "Backend Changes:"
echo "  ✓ Backend/model_fire/recruiterEarningsF.js"
echo "  ✓ Backend/router/recruiterEarnings.js"
echo "  ✓ Backend/index.js (updated)"
echo ""
echo "Frontend Changes:"
echo "  ✓ Frontend/src/pages/MyEarnings.jsx"
echo "  ✓ Frontend/src/pages/Sidebar.jsx (updated)"
echo "  ✓ Frontend/src/App.jsx (updated)"
echo ""
echo "API Endpoints:"
echo "  ✓ GET /api/recruiter-earnings"
echo "  ✓ GET /api/recruiter-earnings/summary"
echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
echo "2. Test the feature:"
echo "   - Login as a recruiter"
echo "   - Navigate to 'My Earnings' in the sidebar"
echo "   - Verify earnings data is displayed correctly"
echo "   - Check commission calculations"
echo ""
echo "3. Verify API endpoints:"
echo "   - Check Firebase Functions logs"
echo "   - Test with different recruiter accounts"
echo ""
echo "4. Monitor for errors:"
echo "   - Check browser console"
echo "   - Check Firebase Functions logs"
echo "   - Verify database queries are working"
echo ""
print_warning "Remember: Users may need to clear their browser cache to see the new feature!"
echo ""
print_success "Deployment complete! 🎉"
echo ""
