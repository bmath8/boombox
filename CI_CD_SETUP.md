# CI/CD Pipeline Setup Guide

## Overview

Automated CI/CD pipeline using GitHub Actions for testing, building, and deploying FAM MUSIC V.2.

---

## Pipeline Features

✅ **Automated Testing** - Runs on every PR and push  
✅ **Linting** - Ensures code quality  
✅ **Build Verification** - Catches build errors early  
✅ **Auto-Deploy** - Staging on `develop`, Production on `main`  
✅ **Coverage Reports** - Tracks test coverage over time  

---

## Setup Instructions

### 1. GitHub Secrets Configuration

Add these secrets in GitHub: **Settings → Secrets and variables → Actions → New repository secret**

#### Required Secrets:

```bash
# Vercel Deployment
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-org-id>
VERCEL_PROJECT_ID=<your-project-id>

# Environment Variables (Staging)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_WS_URL=wss://xxx.railway.app
```

#### Getting Vercel Tokens:

1. **Vercel Token**:
   - Go to https://vercel.com/account/tokens
   - Create new token → Copy

2. **Vercel Org ID & Project ID**:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login and link project
   cd frontend
   vercel link
   
   # Get IDs from .vercel/project.json
   cat .vercel/project.json
   ```

### 2. Branch Strategy

```
main (production)
  ↑
develop (staging)
  ↑
feature/* (development)
```

**Workflow**:
1. Create feature branch from `develop`
2. Make changes, push to feature branch
3. Create PR to `develop` → Tests run automatically
4. Merge to `develop` → Auto-deploy to staging
5. Test on staging
6. Create PR from `develop` to `main`
7. Merge to `main` → Auto-deploy to production

### 3. Enable Workflows

1. Push `.github/workflows/ci-cd.yml` to repository
2. GitHub Actions will automatically detect and run
3. View runs: **Actions** tab in GitHub

---

## Pipeline Jobs

### Job 1: Test
- Checkout code
- Install dependencies
- Run ESLint
- Run Jest tests with coverage
- Upload coverage to Codecov

### Job 2: Build
- Checkout code
- Install dependencies
- Build Next.js application
- Check bundle size

### Job 3: Deploy Staging
- **Trigger**: Push to `develop` branch
- Deploy to Vercel staging environment
- Runs after test + build pass

### Job 4: Deploy Production
- **Trigger**: Push to `main` branch
- Deploy to Vercel production
- Runs after test + build pass

---

## Status Badges

Add to README.md:

```markdown
![CI/CD](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci-cd.yml/badge.svg)
![Coverage](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO/branch/main/graph/badge.svg)
```

---

## Local Testing

Test workflow locally before pushing:

```bash
# Install act (GitHub Actions local runner)
# Windows (with Chocolatey)
choco install act-cli

# Run workflow locally
act -j test
```

---

## Troubleshooting

### Tests Failing in CI but Pass Locally

**Cause**: Environment differences  
**Fix**: Ensure all dependencies in `package.json`

```bash
# Verify clean install works
rm -rf node_modules package-lock.json
npm install
npm test
```

### Build Failing with "Module not found"

**Cause**: Missing environment variables  
**Fix**: Add to GitHub Secrets

### Deployment Failing

**Cause**: Invalid Vercel tokens  
**Fix**: Regenerate tokens and update secrets

---

## Next Steps

1. ✅ Push workflow file to repository
2. ✅ Configure GitHub secrets
3. ✅ Create `develop` branch
4. ✅ Test with a PR
5. ✅ Monitor Actions tab

---

## Benefits

- **Catch bugs early** - Tests run before merge
- **Consistent builds** - Same environment every time
- **Fast feedback** - Know if PR breaks anything
- **Automated deployment** - No manual steps
- **Coverage tracking** - See test coverage trends
