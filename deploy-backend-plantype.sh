#!/bin/bash

echo "🚀 Deploying Backend Plan Type Feature to Production..."
echo ""

# Navigate to Backend directory
cd Backend

echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Backend code is ready for deployment!"
echo ""
echo "⚠️  IMPORTANT: You need to deploy the backend to your production server"
echo ""
echo "If you're using Firebase App Hosting or Cloud Functions:"
echo "  Run: firebase deploy --only functions"
echo ""
echo "If you're using a custom server (e.g., Railway, Heroku, DigitalOcean):"
echo "  1. Push the code to your git repository"
echo "  2. Your server should auto-deploy, OR"
echo "  3. SSH into your server and restart the Node.js process"
echo ""
echo "After deployment, the backend will:"
echo "  ✅ Accept planType parameter during registration"
echo "  ✅ Automatically add planType, registrationDate, maxPositions, planExpiryDate"
echo "  ✅ Enforce position limits for free users"
echo ""
