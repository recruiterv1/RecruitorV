#!/bin/bash

echo "================================================"
echo "GitHub Repository Setup for RecruitorV"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Current Status:${NC}"
echo "✅ All code committed locally (186 files, 51,789 lines)"
echo "✅ Commit hash: 9a4aa4a"
echo "✅ Branch: main"
echo ""
echo -e "${RED}❌ Repository doesn't exist on GitHub yet${NC}"
echo ""

echo "================================================"
echo "STEP 1: Create GitHub Repository"
echo "================================================"
echo ""
echo "Please follow these steps:"
echo ""
echo "1. Open your browser and go to:"
echo -e "   ${GREEN}https://github.com/new${NC}"
echo ""
echo "2. Fill in the repository details:"
echo "   - Owner: recruiterv1"
echo "   - Repository name: RecruitorV"
echo "   - Description: RecruitorV - Recruitment Management Platform"
echo "   - Visibility: Public (or Private, your choice)"
echo ""
echo "3. IMPORTANT: Do NOT check these boxes:"
echo "   ❌ Add a README file"
echo "   ❌ Add .gitignore"
echo "   ❌ Choose a license"
echo "   (We already have these files locally)"
echo ""
echo "4. Click 'Create repository'"
echo ""
read -p "Press ENTER after you've created the repository on GitHub..."

echo ""
echo "================================================"
echo "STEP 2: Choose Authentication Method"
echo "================================================"
echo ""
echo "Choose how you want to authenticate:"
echo "1) Personal Access Token (Recommended - easier)"
echo "2) SSH Key (More secure - requires setup)"
echo ""
read -p "Enter your choice (1 or 2): " auth_choice

if [ "$auth_choice" = "1" ]; then
    echo ""
    echo "================================================"
    echo "Setting up Personal Access Token"
    echo "================================================"
    echo ""
    echo "1. Go to: ${GREEN}https://github.com/settings/tokens${NC}"
    echo "2. Click 'Generate new token' → 'Generate new token (classic)'"
    echo "3. Give it a name: 'RecruitorV Deployment'"
    echo "4. Select scopes: Check 'repo' (full control)"
    echo "5. Click 'Generate token'"
    echo "6. COPY the token (you won't see it again!)"
    echo ""
    read -p "Paste your Personal Access Token here: " github_token
    
    if [ -z "$github_token" ]; then
        echo -e "${RED}Error: No token provided${NC}"
        exit 1
    fi
    
    echo ""
    echo "Updating remote URL with token..."
    git remote set-url origin "https://${github_token}@github.com/recruiterv1/RecruitorV.git"
    
elif [ "$auth_choice" = "2" ]; then
    echo ""
    echo "================================================"
    echo "Setting up SSH Key"
    echo "================================================"
    echo ""
    
    if [ ! -f ~/.ssh/id_ed25519.pub ] && [ ! -f ~/.ssh/id_rsa.pub ]; then
        echo "No SSH key found. Generating one..."
        read -p "Enter your GitHub email: " github_email
        ssh-keygen -t ed25519 -C "$github_email" -f ~/.ssh/id_ed25519 -N ""
        echo ""
        echo -e "${GREEN}SSH key generated!${NC}"
    fi
    
    echo ""
    echo "Your public SSH key:"
    echo "================================================"
    if [ -f ~/.ssh/id_ed25519.pub ]; then
        cat ~/.ssh/id_ed25519.pub
        ssh_key_file="~/.ssh/id_ed25519.pub"
    else
        cat ~/.ssh/id_rsa.pub
        ssh_key_file="~/.ssh/id_rsa.pub"
    fi
    echo "================================================"
    echo ""
    echo "1. Copy the key above"
    echo "2. Go to: ${GREEN}https://github.com/settings/ssh/new${NC}"
    echo "3. Title: 'RecruitorV Mac'"
    echo "4. Paste the key in 'Key' field"
    echo "5. Click 'Add SSH key'"
    echo ""
    read -p "Press ENTER after you've added the SSH key to GitHub..."
    
    echo ""
    echo "Updating remote URL to use SSH..."
    git remote set-url origin "git@github.com:recruiterv1/RecruitorV.git"
    
else
    echo -e "${RED}Invalid choice${NC}"
    exit 1
fi

echo ""
echo "================================================"
echo "STEP 3: Push Code to GitHub"
echo "================================================"
echo ""
echo "Pushing code to GitHub..."
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo -e "${GREEN}✅ SUCCESS!${NC}"
    echo "================================================"
    echo ""
    echo "Your code has been pushed to GitHub!"
    echo ""
    echo "View your repository at:"
    echo -e "${GREEN}https://github.com/recruiterv1/RecruitorV${NC}"
    echo ""
    echo "Files pushed:"
    echo "  - 186 files"
    echo "  - 51,789 lines of code"
    echo "  - All features and documentation"
    echo ""
else
    echo ""
    echo "================================================"
    echo -e "${RED}❌ Push Failed${NC}"
    echo "================================================"
    echo ""
    echo "Common issues:"
    echo "1. Token/SSH key not set up correctly"
    echo "2. Repository doesn't exist on GitHub"
    echo "3. No permission to push to the repository"
    echo ""
    echo "Please check the error message above and try again."
    echo ""
    echo "For manual push, run:"
    echo "  git push -u origin main"
    echo ""
fi
