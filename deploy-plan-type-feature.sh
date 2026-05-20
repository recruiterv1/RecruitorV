#!/bin/bash

# Plan Type Feature Deployment Script
# This script helps deploy the recruiter plan type feature

echo "=========================================="
echo "Plan Type Feature Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Step 1: Check if we're in the right directory
echo "Step 1: Checking directory..."
if [ ! -d "Backend" ] || [ ! -d "Frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi
print_success "Directory check passed"
echo ""

# Step 2: Backend dependencies
echo "Step 2: Installing Backend dependencies..."
cd Backend
if npm install; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..
echo ""

# Step 3: Frontend dependencies
echo "Step 3: Installing Frontend dependencies..."
cd Frontend
if npm install; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi
cd ..
echo ""

# Step 4: Run migration script
echo "Step 4: Running database migration..."
print_warning "This will update all existing recruiters to paid plan (planType: 1)"
read -p "Do you want to run the migration? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd Backend
    if node scripts/migratePlanType.js; then
        print_success "Migration completed successfully"
    else
        print_error "Migration failed"
        print_warning "You may need to run the migration manually"
    fi
    cd ..
else
    print_warning "Migration skipped - remember to run it manually later"
fi
echo ""

# Step 5: Build Frontend
echo "Step 5: Building Frontend..."
cd Frontend
if npm run build; then
    print_success "Frontend build completed"
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..
echo ""

# Step 6: Summary
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
echo ""
print_info "Files Modified:"
echo "  Backend:"
echo "    - Backend/model_fire/recruiterF.js"
echo "    - Backend/router/rout.js"
echo "    - Backend/router/position.js"
echo "    - Backend/scripts/migratePlanType.js (new)"
echo ""
echo "  Frontend:"
echo "    - Frontend/src/components/Register.jsx"
echo ""
print_info "New Features:"
echo "  ✓ Free plan (2 positions, 30 days)"
echo "  ✓ Paid plan (unlimited positions)"
echo "  ✓ Plan selection in registration"
echo "  ✓ Position creation validation"
echo "  ✓ Existing users set to paid plan"
echo ""
print_info "Next Steps:"
echo "  1. Test registration with both plan types"
echo "  2. Test position creation limits"
echo "  3. Verify existing users can still login"
echo "  4. Deploy to production"
echo ""
print_success "Deployment preparation complete!"
echo ""
echo "=========================================="
