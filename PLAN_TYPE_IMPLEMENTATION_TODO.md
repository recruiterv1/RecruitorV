# Recruiter Plan Type Feature - Implementation Checklist

## Overview
Implement Free vs Paid plan types for recruiters with the following rules:
- **Free Plan (planType: 0)**: Max 2 positions for 30 days from registration
- **Paid Plan (planType: 1)**: Unlimited positions, no time limit
- **Existing Recruiters**: Automatically assigned planType: 1 (Paid)

---

## Phase 1: Database Schema & Migration
- [ ] Update recruiter model to include planType fields
- [ ] Create migration script for existing recruiters
- [ ] Test migration on development database

## Phase 2: Backend Updates
- [ ] Update registration endpoint to handle planType
- [ ] Add helper functions for plan validation
- [ ] Add position creation validation middleware
- [ ] Update login/session endpoints to return plan info

## Phase 3: Frontend Registration Form
- [ ] Add plan type radio buttons to Register.jsx
- [ ] Update form state management
- [ ] Add visual plan comparison
- [ ] Update form submission

## Phase 4: Position Management
- [ ] Add plan limit validation before position creation
- [ ] Display plan limits in dashboard
- [ ] Show upgrade prompts for free users
- [ ] Handle expired free plans

## Phase 5: Testing & Deployment
- [ ] Test free plan registration
- [ ] Test paid plan registration
- [ ] Test position limits for free users
- [ ] Test 30-day expiry
- [ ] Verify existing users have planType: 1
- [ ] Deploy to production

---

## Implementation Progress
**Status**: In Progress
**Started**: [Current Date]
**Last Updated**: [Current Date]
