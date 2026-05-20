#!/bin/bash

# Deployment script for My Added Positions feature
echo "🚀 Starting deployment for My Added Positions feature..."

# Step 1: Build Frontend
echo "📦 Building frontend..."
cd /Users/brandcatapult/Downloads/newrecuiterv/Frontend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Step 2: Deploy to Firebase
echo "🚀 Deploying to Firebase..."
cd /Users/brandcatapult/Downloads/newrecuiterv

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "Installing firebase-tools..."
    npm install -g firebase-tools
fi

# Deploy hosting (frontend)
echo "📤 Deploying frontend to Firebase Hosting..."
firebase deploy --only hosting --project recruitorv-1291c

if [ $? -eq 0 ]; then
    echo "✅ Frontend deployed successfully"
else
    echo "❌ Frontend deployment failed"
    exit 1
fi

# Deploy functions (backend)
echo "📤 Deploying backend to Firebase Functions..."
firebase deploy --only functions --project recruitorv-1291c

if [ $? -eq 0 ]; then
    echo "✅ Backend deployed successfully"
else
    echo "❌ Backend deployment failed"
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "Changes deployed:"
echo "- New 'My Added Positions' page for Client SPOC"
echo "- New backend endpoints (pause, copy, modify)"
echo "- PAUSED positions hidden from recruiters"

