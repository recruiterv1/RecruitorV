# 🚀 Unified Deployment Guide

## Overview

The new unified `deploy.sh` script consolidates all 13 previous deployment scripts into a single, feature-rich deployment tool. This guide explains how to use it effectively.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Deployment Modes](#deployment-modes)
- [Command-Line Usage](#command-line-usage)
- [Interactive Menu](#interactive-menu)
- [Features](#features)
- [Migration from Old Scripts](#migration-from-old-scripts)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Option 1: Interactive Menu (Recommended for First-Time Users)

```bash
./deploy.sh
```

This will display an interactive menu with all deployment options.

### Option 2: Command-Line Arguments (Recommended for Experienced Users)

```bash
# Full deployment (Backend + Frontend)
./deploy.sh full

# Backend only
./deploy.sh backend

# Frontend only
./deploy.sh frontend

# Quick deployment (skip dependency installation)
./deploy.sh quick

# Run migration script only
./deploy.sh migrate
```

---

## Deployment Modes

### 1. Full Deployment

**Command:** `./deploy.sh full` or select option 1 in menu

**What it does:**
- Installs Backend dependencies (if needed)
- Installs Frontend dependencies (if needed)
- Builds Frontend
- Deploys both Backend (Functions) and Frontend (Hosting) to Firebase

**When to use:**
- First-time deployment
- After major changes to both Backend and Frontend
- When you're unsure what changed

### 2. Backend Only

**Command:** `./deploy.sh backend` or select option 2 in menu

**What it does:**
- Installs Backend dependencies (if needed)
- Deploys Backend (Firebase Functions) only

**When to use:**
- Only Backend code changed
- API endpoints modified
- Database logic updated
- New Firebase functions added

### 3. Frontend Only

**Command:** `./deploy.sh frontend` or select option 3 in menu

**What it does:**
- Installs Frontend dependencies (if needed)
- Builds Frontend
- Deploys Frontend (Firebase Hosting) only

**When to use:**
- Only UI/UX changes
- New components added
- Styling updates
- Frontend bug fixes

### 4. Quick Deployment

**Command:** `./deploy.sh quick` or select option 4 in menu

**What it does:**
- Skips dependency installation
- Builds Frontend
- Deploys both Backend and Frontend

**When to use:**
- Dependencies already installed
- Frequent deployments during development
- When you're confident dependencies are up-to-date

### 5. Migration Only

**Command:** `./deploy.sh migrate` or select option 5 in menu

**What it does:**
- Runs migration script (e.g., `scripts/migratePlanType.js`)
- Asks for confirmation before running

**When to use:**
- Database schema changes
- Data migration needed
- Updating existing records

### 6. Custom Deployment

**Command:** Select option 6 in menu

**What it does:**
- Lets you choose exactly which components to deploy
- Interactive selection of:
  - Install Backend dependencies
  - Install Frontend dependencies
  - Build Frontend
  - Deploy Backend Functions
  - Deploy Frontend Hosting
  - Run Migration Script

**When to use:**
- You need fine-grained control
- Specific components need deployment
- Testing individual parts

---

## Command-Line Usage

### Available Commands

```bash
./deploy.sh full       # Full deployment (Backend + Frontend)
./deploy.sh backend    # Backend only (Functions)
./deploy.sh frontend   # Frontend only (Hosting)
./deploy.sh quick      # Quick deployment (skip dependency install)
./deploy.sh migrate    # Run migration script only
./deploy.sh help       # Show help message
```

### Examples

```bash
# Deploy everything
./deploy.sh full

# Deploy only backend changes
./deploy.sh backend

# Quick deploy during development
./deploy.sh quick

# Run database migration
./deploy.sh migrate

# Get help
./deploy.sh help
```

---

## Interactive Menu

When you run `./deploy.sh` without arguments, you'll see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 RecruiterV Deployment Menu
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Select deployment mode:

  1) Full Deployment (Backend + Frontend)
  2) Backend Only (Functions)
  3) Frontend Only (Hosting)
  4) Quick Deployment (Skip dependency install)
  5) Run Migration Script Only
  6) Custom Deployment
  0) Exit

Enter your choice [0-6]:
```

Simply enter the number corresponding to your desired deployment mode.

---

## Features

### ✅ Color-Coded Output

- **Green**: Success messages
- **Blue**: Information messages
- **Yellow**: Warnings and steps
- **Red**: Error messages
- **Cyan**: Headers and separators

### ✅ Validation Checks

The script automatically checks:
- ✅ Firebase CLI is installed
- ✅ Node.js is installed
- ✅ Project directory structure is correct
- ✅ firebase.json exists

### ✅ Error Handling

- Exits on any error
- Provides clear error messages
- Suggests solutions for common issues

### ✅ Dependency Management

- Automatically installs dependencies if needed
- Skips installation if already present
- Supports both Backend and Frontend

### ✅ Migration Support

- Optional migration script execution
- Confirmation prompt before running
- Error handling for migration failures

### ✅ Post-Deployment Verification

After deployment, the script provides:
- Clear verification steps
- Documentation links
- Timestamp of deployment

---

## Migration from Old Scripts

### Old Scripts → New Commands

| Old Script | New Command |
|-----------|-------------|
| `deploy.sh` | `./deploy.sh full` |
| `deploy-activity-features.sh` | `./deploy.sh full` |
| `deploy-clientspoc-stats.sh` | `./deploy.sh frontend` |
| `deploy-dashboard-stats.sh` | `./deploy.sh full` |
| `deploy-firebase-fix.sh` | `./deploy.sh backend` |
| `deploy-my-earnings.sh` | `./deploy.sh full` |
| `deploy-my-positions.sh` | `./deploy.sh full` |
| `deploy-plan-type-feature.sh` | `./deploy.sh full` + `./deploy.sh migrate` |
| `deploy-plantype-filter.sh` | `./deploy.sh full` |
| `deploy-position-fix.sh` | `./deploy.sh full` |
| `deploy-clientspoc-mypositions-fix.sh` | `./deploy.sh backend` |
| `deploy-backend-plantype.sh` | `./deploy.sh backend` |
| `deploy-candidate-activity-table.sh` | `./deploy.sh frontend` |

### What to Do with Old Scripts

**Option 1: Archive Them**

```bash
mkdir -p .archive/deploy-scripts
mv deploy-*.sh .archive/deploy-scripts/
```

**Option 2: Delete Them**

```bash
# After verifying the new script works
rm deploy-activity-features.sh
rm deploy-clientspoc-stats.sh
rm deploy-dashboard-stats.sh
rm deploy-firebase-fix.sh
rm deploy-my-earnings.sh
rm deploy-my-positions.sh
rm deploy-plan-type-feature.sh
rm deploy-plantype-filter.sh
rm deploy-position-fix.sh
rm deploy-clientspoc-mypositions-fix.sh
rm deploy-backend-plantype.sh
rm deploy-candidate-activity-table.sh
```

**Recommendation:** Archive them first, test the new script thoroughly, then delete after a week or two.

---

## Troubleshooting

### Firebase CLI Not Found

**Error:** `Firebase CLI not found. Please install it first`

**Solution:**
```bash
npm install -g firebase-tools
firebase login
```

### Node.js Not Found

**Error:** `Node.js not found. Please install Node.js first`

**Solution:** Install Node.js from [nodejs.org](https://nodejs.org/)

### Directory Validation Failed

**Error:** `firebase.json not found` or `Backend or Frontend directory not found`

**Solution:** Make sure you're running the script from the project root directory:
```bash
cd /path/to/finalrecuiter
./deploy.sh
```

### Build Failed

**Error:** `Frontend build failed`

**Solution:**
1. Check for syntax errors in your code
2. Clear node_modules and reinstall:
   ```bash
   cd Frontend
   rm -rf node_modules package-lock.json
   npm install
   cd ..
   ./deploy.sh frontend
   ```

### Deployment Failed

**Error:** `Deployment failed`

**Solution:**
1. Check your internet connection
2. Verify Firebase authentication: `firebase login:list`
3. Check Firebase project: `firebase use`
4. Review error messages in the terminal

### Migration Failed

**Error:** `Migration failed`

**Solution:**
1. Check the migration script exists: `Backend/scripts/migratePlanType.js`
2. Review the migration script for errors
3. Run migration manually:
   ```bash
   cd Backend
   node scripts/migratePlanType.js
   ```

---

## Best Practices

### 1. Use Quick Deployment During Development

```bash
./deploy.sh quick
```

This saves time by skipping dependency installation.

### 2. Use Full Deployment for Production

```bash
./deploy.sh full
```

This ensures everything is up-to-date and properly deployed.

### 3. Test Before Deploying

- Test locally first
- Run `npm run build` in Frontend to check for build errors
- Review changes before deploying

### 4. Clear Browser Cache After Deployment

After deployment, clear your browser cache:
- **Windows/Linux:** Ctrl+Shift+R
- **Mac:** Cmd+Shift+R

### 5. Check Firebase Logs

After deployment, check for errors:
```bash
firebase functions:log
```

---

## Advanced Usage

### Deploying Specific Firebase Targets

The script uses Firebase CLI's deployment options:
- `--only functions`: Deploy only Cloud Functions
- `--only hosting`: Deploy only Firebase Hosting
- No flags: Deploy everything (functions, hosting, firestore, etc.)

### Custom Deployment Flow

For maximum control, use the custom deployment option (option 6) and select exactly what you need.

### Running Multiple Deployments

You can chain deployments:
```bash
./deploy.sh backend && ./deploy.sh frontend
```

---

## Support

### Documentation

- **Setup Guide:** `SETUP_GUIDE.md`
- **Testing Guide:** `TESTING_GUIDE.md`
- **Feature Documentation:** Various `*_FEATURE.md` files

### Getting Help

```bash
./deploy.sh help
```

---

## Summary

The new unified `deploy.sh` script provides:

✅ **Simplicity**: One script for all deployment needs  
✅ **Flexibility**: Multiple deployment modes  
✅ **Safety**: Validation and error handling  
✅ **Efficiency**: Skip unnecessary steps  
✅ **Clarity**: Color-coded output and clear messages  
✅ **Power**: Custom deployment options  

**Start using it today:** `./deploy.sh`

---

*Last Updated: $(date)*
