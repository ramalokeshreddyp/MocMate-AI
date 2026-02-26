# MocMate AI - Quick Start & Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Running the Application](#running-the-application)
4. [Testing](#testing)
5. [Building for Production](#building-for-production)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)
8. [Environment Variables](#environment-variables)

---

## Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14 or higher (for production)
- **Git**: for version control

### Installation Check
```bash
node --version    # Should show v18+
npm --version     # Should show v9+
```

---

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/mocmate-ai.git
cd mocmate-ai
```

### 2. Install Dependencies
```bash
# Install all dependencies (frontend + backend)
npm install
```

This installs:
- Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion, etc.
- Backend: Express.js, PostgreSQL driver, JWT, bcryptjs, etc.
- Dev Tools: Vitest, ESLint, TypeScript compiler, etc.

### 3. Setup Environment Variables

#### Frontend Environment (.env.local in root)
```env
VITE_API_BASE_URL=http://localhost:3000
```

#### Backend Environment (.env in root)
```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/mocmate_dev
DB_TYPE=pg

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# CORS
CORS_ORIGINS=http://localhost:5173

# Logging
LOG_LEVEL=info
```

### 4. Setup PostgreSQL Database

#### Option A: Using Local PostgreSQL
```bash
# Create database
createdb mocmate_dev

# Run migrations (if applicable)
# psql -U postgres -d mocmate_dev -f schema.sql
```

#### Option B: Using Docker PostgreSQL
```bash
docker run --name mocmate-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mocmate_dev \
  -p 5432:5432 \
  -d postgres:15
```

#### Option C: Using Cloud Database
Update DATABASE_URL in .env to point to your cloud database (AWS RDS, Supabase, etc.)

---

## Running the Application

### Start Development Server (Frontend + Backend)
```bash
npm run dev:full
```

This starts:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:3000 (Express server)

Both run concurrently with hot reload enabled.

### Start Only Frontend
```bash
npm run dev
```
Access at: http://localhost:5173

### Start Only Backend
```bash
npm run dev:server
```
Access at: http://localhost:3000

### Test Connection
```bash
# Frontend is ready when you see "VITE v5.x.x ready"
# Backend is ready when you see "Server running on port 3000"

# Quick test - Open in browser:
# Frontend: http://localhost:5173
# Backend Health: http://localhost:3000/health (if implemented)
```

---

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Test Coverage
```bash
npm test -- --coverage
```

### Frontend Tests Only
```bash
npm test -- src/
```

### Backend Tests Only
```bash
npm test -- backend/
```

### Test Specific Feature
```bash
# Face detection tests
npm test -- faceDetection

# Interview flow tests
npm test -- interview-flow

# Authentication tests
npm test -- auth
```

### Test Structure
```
src/test/
├── faceDetection.test.ts        # Face detection service tests
├── interview-flow.test.ts       # Interview flow & state tests
├── theme-context.test.tsx       # Theme context tests
└── setup.ts                     # Test configuration

backend/src/
├── tests.js                     # Backend API & evaluation tests
├── app.test.js                  # Existing backend tests
└── services/
    ├── evaluationService.test.js  # Evaluation pipeline tests
    └── profileService.test.js     # Resume parsing tests
```

---

## Building for Production

### Frontend Build
```bash
npm run build
```

Output: `./dist/` folder (ready for deployment)

Build Process:
1. TypeScript compilation
2. Asset bundling with Vite
3. CSS minification
4. Code splitting
5. Gzip compression

Check build size:
```bash
npm run build
# Output shows: "dist/index.html (x.xx kB)"
```

### Lint & Type Check
```bash
npm run lint
```

Checks:
- ESLint rules
- TypeScript type errors
- Best practices

Fix issues automatically:
```bash
npm run lint -- --fix
```

---

## Deployment

### Option 1: Vercel (Recommended for Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Netlify (Frontend)
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Option 3: AWS S3 + CloudFront (Frontend)
```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### Option 4: Docker Deployment (Full Stack)

#### Create Dockerfile
```dockerfile
# Frontend build stage
FROM node:18-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Backend runtime stage
FROM node:18-alpine
WORKDIR /app
COPY --from=frontend /app/dist ./dist
COPY package*.json ./
RUN npm ci --production
COPY backend ./backend
EXPOSE 3000
CMD ["npm", "start:server"]
```

#### Build & Run Docker Image
```bash
# Build
docker build -t mocmate-ai:latest .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  mocmate-ai:latest
```

### Option 5: Heroku Deployment
```bash
# Login to Heroku
heroku login

# Create app
heroku create mocmate-ai

# Set environment variables
heroku config:set JWT_SECRET="your-secret"
heroku config:set DATABASE_URL="postgresql://..."

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

---

## Environment Variables

### Frontend Variables
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000          # API endpoint
VITE_JWT_SECRET="your-secret-key"               # Optional: JWT operations on client

# Feature Flags
VITE_ENABLE_PROCTORING=true                     # Enable face detection
VITE_ENABLE_PDF_EXPORT=true                     # Enable PDF download
VITE_ENABLE_ANALYTICS=true                      # Enable dashboard analytics
VITE_MAX_UPLOAD_SIZE=10485760                   # Max resume file size (10MB)

# Third-party Services
VITE_SENTRY_DSN="https://..."                   # Error tracking (optional)
VITE_ANALYTICS_ID="UA-..."                      # Google Analytics (optional)
```

### Backend Variables
```env
# Application
NODE_ENV=production                            # development/production
PORT=3000                                      # Server port
LOG_LEVEL=info                                 # Logging level

# Database
DATABASE_URL=postgresql://user:pass@host/db    # PostgreSQL connection string
DB_TYPE=pg                                     # Database type (pg for PostgreSQL)
DB_POOL_SIZE=20                                # Connection pool size

# Authentication
JWT_SECRET="minimum-32-character-secret-key"   # JWT signing secret
JWT_EXPIRATION=7d                              # Token expiration (7 days)

# CORS
CORS_ORIGINS=https://mocmate.ai,https://www.mocmate.ai  # Allowed origins

# Resume Processing
MAX_RESUME_FILE_SIZE=10485760                  # 10MB in bytes
ALLOWED_MIME_TYPES=application/pdf             # Only PDF resumes

# Email (if implementing email notifications)
SMTP_HOST=smtp.gmail.com                       # Email service host
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# Monitoring
SENTRY_DSN="https://..."                       # Error tracking
DATADOG_API_KEY="..."                          # Performance monitoring

# Security
BCRYPT_SALT_ROUNDS=10                          # Password hashing rounds
SESSION_TIMEOUT=604800000                      # 7 days in milliseconds
```

---

## Troubleshooting

### Issue: "Cannot find module '@tensorflow/tfjs'"
**Solution**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "PostgreSQL connection refused"
**Solution**: Check database is running
```bash
# Check if PostgreSQL is running
psql -U postgres -c "\l"

# If not, start PostgreSQL
brew services start postgresql  # macOS
sudo service postgresql start    # Linux
```

### Issue: "Face detection not working"
**Solution**: Check camera permissions
- Grant camera permission in browser
- Refresh page
- Try different browser (Chrome recommended)
- Check that HTTPS is used in production

### Issue: "VITE_API_BASE_URL not found"
**Solution**: Ensure .env.local exists in root directory
```bash
echo "VITE_API_BASE_URL=http://localhost:3000" > .env.local
```

### Issue: "npm run dev:full not working"
**Solution**: Install concurrently
```bash
npm install --save-dev concurrently
npm run dev:full
```

### Issue: "Token is undefined in API calls"
**Solution**: Check Auth Context
```typescript
// In any component using API
import { useAuth } from '@/context/AuthContext';
const { token } = useAuth();
console.log('Token:', token); // Should not be undefined after login
```

### Issue: "Port 3000 or 5173 already in use"
**Solution**: Kill process or change port
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev:server
```

### Issue: Database migrations not running
**Solution**: Apply schema manually
```bash
# Connect to PostgreSQL
psql -U postgres -d mocmate_dev

# Run schema file
\i schema.sql

# Create tables manually if needed
CREATE TABLE users (id UUID PRIMARY KEY, ...);
```

---

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/new-feature
```

### 2. Start Development Server
```bash
npm run dev:full
```

### 3. Make Changes
- Edit files in `src/` for frontend
- Edit files in `backend/src/` for backend

### 4. Run Tests
```bash
npm test
```

### 5. Fix Lint Issues
```bash
npm run lint -- --fix
```

### 6. Commit Changes
```bash
git add .
git commit -m "feat: Add new feature"
git push origin feature/new-feature
```

### 7. Create Pull Request
- Push to GitHub
- Create PR
- Wait for CI/CD to pass
- Request reviews

---

## Performance Optimization

### Frontend Performance
```bash
# Check bundle size
npm run build
# Look for "dist/index.html" size

# Analyze bundle
npm run build -- --analyze

# Check Lighthouse score
npm run preview
# Then use Chrome DevTools Lighthouse tab
```

### Database Performance
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- Create indexes on frequently queried columns
CREATE INDEX idx_interviews_user_id ON interviews(user_id);
CREATE INDEX idx_reports_user_id ON interview_reports(user_id);
```

---

## Monitoring & Logging

### Frontend Errors
- Sentry dashboard
- Browser console (DevTools)
- Network tab for API calls

### Backend Logs
```bash
# Check logs in production
heroku logs --tail    # Heroku
docker logs container-name  # Docker
tail -f logs/app.log  # File logging
```

---

## Next Steps

1. ✅ **Development**: Follow the setup guide above
2. ✅ **Testing**: Run all tests before deployment
3. ✅ **Staging**: Deploy to staging environment first
4. ✅ **Production**: Deploy to production with monitoring

---

## Support & Resources

- **Documentation**: [COMPREHENSIVE_ARCHITECTURE.md](./COMPREHENSIVE_ARCHITECTURE.md)
- **API Documentation**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **System Audit**: [SYSTEM_AUDIT.md](./SYSTEM_AUDIT.md)

---

**Last Updated:** February 23, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
