#!/bin/bash

################################################################################
# 🚀 Unified Deployment Script for RecruiterV
# 
# This script consolidates all deployment functionality into a single,
# feature-rich deployment tool with menu-driven interface and command-line
# argument support.
#
# Usage:
#   ./deploy.sh                    - Show interactive menu
#   ./deploy.sh full               - Full deployment (Backend + Frontend)
#   ./deploy.sh backend            - Backend only (Functions)
#   ./deploy.sh frontend           - Frontend only (Hosting)
#   ./deploy.sh quick              - Quick deployment (skip dependency install)
#   ./deploy.sh migrate            - Run migration script only
#
################################################################################

set -e  # Exit on error

################################################################################
# Color Definitions
################################################################################
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

################################################################################
# Helper Functions
################################################################################
print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

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

print_step() {
    echo ""
    echo -e "${YELLOW}▶ $1${NC}"
    echo ""
}

################################################################################
# Validation Functions
################################################################################
check_directory() {
    if [ ! -f "firebase.json" ]; then
        print_error "firebase.json not found. Please run this script from the project root."
        exit 1
    fi
    if [ ! -d "Backend" ] || [ ! -d "Frontend" ]; then
        print_error "Backend or Frontend directory not found. Please run from project root."
        exit 1
    fi
    print_success "Directory validation passed"
}

check_firebase_cli() {
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI not found. Please install it first:"
        echo "  npm install -g firebase-tools"
        exit 1
    fi
    print_success "Firebase CLI is installed"
}

check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js first."
        exit 1
    fi
    print_success "Node.js is installed: $(node --version)"
}

################################################################################
# Deployment Functions
################################################################################
install_backend_deps() {
    print_step "Installing Backend dependencies..."
    cd Backend
    if [ ! -d "node_modules" ]; then
        print_status "Installing Backend dependencies..."
        npm install
        if [ $? -eq 0 ]; then
            print_success "Backend dependencies installed"
        else
            print_error "Failed to install Backend dependencies"
            exit 1
        fi
    else
        print_status "Backend dependencies already installed (skipping)"
    fi
    cd ..
}

install_frontend_deps() {
    print_step "Installing Frontend dependencies..."
    cd Frontend
    if [ ! -d "node_modules" ]; then
        print_status "Installing Frontend dependencies..."
        npm install
        if [ $? -eq 0 ]; then
            print_success "Frontend dependencies installed"
        else
            print_error "Failed to install Frontend dependencies"
            exit 1
        fi
    else
        print_status "Frontend dependencies already installed (skipping)"
    fi
    cd ..
}

build_frontend() {
    print_step "Building Frontend..."
    cd Frontend
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Frontend built successfully"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    cd ..
}

deploy_backend() {
    print_step "Deploying Backend (Firebase Functions)..."
    cd Backend
    firebase deploy --only functions
    if [ $? -eq 0 ]; then
        print_success "Backend deployed successfully"
    else
        print_error "Backend deployment failed"
        exit 1
    fi
    cd ..
}

deploy_frontend() {
    print_step "Deploying Frontend (Firebase Hosting)..."
    firebase deploy --only hosting
    if [ $? -eq 0 ]; then
        print_success "Frontend deployed successfully"
    else
        print_error "Frontend deployment failed"
        exit 1
    fi
}

deploy_all() {
    print_step "Deploying to Firebase (Functions + Hosting)..."
    firebase deploy
    if [ $? -eq 0 ]; then
        print_success "Full deployment successful"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

run_migration() {
    print_step "Running Migration Script..."
    print_warning "This will update existing recruiters to paid plan (planType: 1)"
    read -p "Do you want to run the migration? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd Backend
        if [ -f "scripts/migratePlanType.js" ]; then
            node scripts/migratePlanType.js
            if [ $? -eq 0 ]; then
                print_success "Migration completed successfully"
            else
                print_error "Migration failed"
                print_warning "You may need to run the migration manually"
            fi
        else
            print_warning "Migration script not found: scripts/migratePlanType.js"
        fi
        cd ..
    else
        print_warning "Migration skipped"
    fi
}

################################################################################
# Deployment Modes
################################################################################
deploy_full() {
    print_header "🚀 Full Deployment Mode"
    
    install_backend_deps
    install_frontend_deps
    build_frontend
    deploy_all
    
    print_header "✅ Deployment Complete!"
    show_verification_steps
}

deploy_backend_only() {
    print_header "🔧 Backend Deployment Mode"
    
    install_backend_deps
    deploy_backend
    
    print_header "✅ Backend Deployment Complete!"
    show_verification_steps
}

deploy_frontend_only() {
    print_header "🎨 Frontend Deployment Mode"
    
    install_frontend_deps
    build_frontend
    deploy_frontend
    
    print_header "✅ Frontend Deployment Complete!"
    show_verification_steps
}

deploy_quick() {
    print_header "⚡ Quick Deployment Mode"
    print_warning "Skipping dependency installation"
    
    build_frontend
    deploy_all
    
    print_header "✅ Quick Deployment Complete!"
    show_verification_steps
}

deploy_migration_only() {
    print_header "🔄 Migration Mode"
    
    run_migration
    
    print_header "✅ Migration Complete!"
}

################################################################################
# Verification Steps
################################################################################
show_verification_steps() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📋 Post-Deployment Verification Steps:${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
    echo "2. Visit: https://www.recruiterv.com/"
    echo "3. Login to verify authentication works"
    echo "4. Test the deployed features"
    echo "5. Check browser console for errors"
    echo "6. Check Firebase Functions logs: firebase functions:log"
    echo ""
    echo -e "${YELLOW}📚 Documentation:${NC}"
    echo "  • SETUP_GUIDE.md - Complete setup guide"
    echo "  • DEPLOYMENT_GUIDE.md - Deployment documentation"
    echo "  • TESTING_GUIDE.md - Testing instructions"
    echo ""
    echo -e "${GREEN}🎉 Deployment completed at: $(date)${NC}"
    echo ""
}

################################################################################
# Menu System
################################################################################
show_menu() {
    clear
    print_header "🚀 RecruiterV Deployment Menu"
    
    echo -e "${GREEN}Select deployment mode:${NC}"
    echo ""
    echo "  ${BLUE}1)${NC} Full Deployment (Backend + Frontend)"
    echo "  ${BLUE}2)${NC} Backend Only (Functions)"
    echo "  ${BLUE}3)${NC} Frontend Only (Hosting)"
    echo "  ${BLUE}4)${NC} Quick Deployment (Skip dependency install)"
    echo "  ${BLUE}5)${NC} Run Migration Script Only"
    echo "  ${BLUE}6)${NC} Custom Deployment"
    echo "  ${BLUE}0)${NC} Exit"
    echo ""
    read -p "Enter your choice [0-6]: " choice
    echo ""
    
    case $choice in
        1)
            deploy_full
            ;;
        2)
            deploy_backend_only
            ;;
        3)
            deploy_frontend_only
            ;;
        4)
            deploy_quick
            ;;
        5)
            deploy_migration_only
            ;;
        6)
            deploy_custom
            ;;
        0)
            echo "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please try again."
            sleep 2
            show_menu
            ;;
    esac
}

deploy_custom() {
    print_header "🔧 Custom Deployment"
    
    local install_backend=false
    local install_frontend=false
    local build=false
    local deploy_functions=false
    local deploy_hosting=false
    local run_migrate=false
    
    echo -e "${YELLOW}Select components to deploy:${NC}"
    echo ""
    read -p "Install Backend dependencies? (y/n): " install_backend_choice
    read -p "Install Frontend dependencies? (y/n): " install_frontend_choice
    read -p "Build Frontend? (y/n): " build_choice
    read -p "Deploy Backend Functions? (y/n): " deploy_functions_choice
    read -p "Deploy Frontend Hosting? (y/n): " deploy_hosting_choice
    read -p "Run Migration Script? (y/n): " run_migrate_choice
    echo ""
    
    [[ $install_backend_choice =~ ^[Yy]$ ]] && install_backend=true
    [[ $install_frontend_choice =~ ^[Yy]$ ]] && install_frontend=true
    [[ $build_choice =~ ^[Yy]$ ]] && build=true
    [[ $deploy_functions_choice =~ ^[Yy]$ ]] && deploy_functions=true
    [[ $deploy_hosting_choice =~ ^[Yy]$ ]] && deploy_hosting=true
    [[ $run_migrate_choice =~ ^[Yy]$ ]] && run_migrate=true
    
    if [ "$install_backend" = true ]; then
        install_backend_deps
    fi
    
    if [ "$install_frontend" = true ]; then
        install_frontend_deps
    fi
    
    if [ "$run_migrate" = true ]; then
        run_migration
    fi
    
    if [ "$build" = true ]; then
        build_frontend
    fi
    
    if [ "$deploy_functions" = true ] && [ "$deploy_hosting" = true ]; then
        deploy_all
    elif [ "$deploy_functions" = true ]; then
        deploy_backend
    elif [ "$deploy_hosting" = true ]; then
        deploy_frontend
    fi
    
    print_header "✅ Custom Deployment Complete!"
    show_verification_steps
}

################################################################################
# Main Execution
################################################################################
main() {
    # Parse command-line arguments
    if [ $# -gt 0 ]; then
        case "$1" in
            full)
                check_directory
                check_firebase_cli
                check_node
                deploy_full
                ;;
            backend)
                check_directory
                check_firebase_cli
                check_node
                deploy_backend_only
                ;;
            frontend)
                check_directory
                check_firebase_cli
                check_node
                deploy_frontend_only
                ;;
            quick)
                check_directory
                check_firebase_cli
                check_node
                deploy_quick
                ;;
            migrate)
                check_directory
                check_node
                deploy_migration_only
                ;;
            help|--help|-h)
                echo "Usage: $0 [command]"
                echo ""
                echo "Commands:"
                echo "  full      - Full deployment (Backend + Frontend)"
                echo "  backend   - Backend only (Functions)"
                echo "  frontend  - Frontend only (Hosting)"
                echo "  quick     - Quick deployment (skip dependency install)"
                echo "  migrate   - Run migration script only"
                echo "  help      - Show this help message"
                echo ""
                echo "If no command is provided, an interactive menu will be shown."
                exit 0
                ;;
            *)
                print_error "Unknown command: $1"
                echo "Run '$0 help' for usage information."
                exit 1
                ;;
        esac
    else
        # Show interactive menu
        check_directory
        check_firebase_cli
        check_node
        show_menu
    fi
}

# Run main function with all arguments
main "$@"
