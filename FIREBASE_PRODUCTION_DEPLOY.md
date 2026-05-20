# Firebase Production Deployment Guide

## Project Configuration
- **Firebase Project**: recruitorv-1291c
- **Hosting URL**: https://recruitorv-1291c.web.app

## Deployment Steps

### 1. Build the Frontend
```bash
cd Frontend
npm run build
```

### 2. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

### 3. Or Deploy Full Project (Frontend + Functions)
```bash
firebase deploy
```

## Alternative: Deploy via Firebase CLI

### Install Firebase CLI (if not installed)
```bash
npm install -g firebase-tools
```

### Login to Firebase
```bash
firebase login
```

### Initialize Firebase (if not already done)
```bash
firebase init
```

### Deploy Command
```bash
firebase deploy --project recruitorv-1291c
```

## After Deployment

The updated files will be live:
- `Frontend/src/pages/ClientSpocDashView.jsx` - New edit form styling + proper sidebar
- `Frontend/src/pages/MyAddedPositions.jsx` - Fixed pause button with auth credentials

## Quick Deploy Command
```bash
cd /Users/brandcatapult/Downloads/newrecuiterv
firebase deploy --only hosting --project recruitorv-1291c
```

