# Deploy on Render (Single Service)

This project is configured so one Render Web Service can serve both:
- API routes (`/api/*`, `/health`)
- Frontend Vite build (`dist/`) through Express static hosting

The required Blueprint file is already added at `render.yaml`.

## Architecture to use

Use only:
- 1 Render Web Service (Node)
- 1 Render PostgreSQL database

Do not keep a separate Render Static Site for this repo.

## 1) Push latest code

From your local machine:

```bash
git add .
git commit -m "Add Render deployment blueprint"
git push origin main
```

## 2) Create services from Blueprint

1. Open Render Dashboard.
2. Click **New +** → **Blueprint**.
3. Connect repository: `ramalokeshreddyp/Team-Code-Zenith`.
4. Select branch: `main`.
5. Render detects `render.yaml` and shows:
   - PostgreSQL: `team-code-zenith-db`
   - Web Service: `team-code-zenith`
6. Click **Apply**.

### If you already created a Static Site earlier

1. Open Render Dashboard.
2. Open the Static Site service for this repo.
3. Go to **Settings**.
4. Click **Delete Service**.
5. Keep your PostgreSQL service.

## 3) Confirm runtime commands

Render Web Service should use:
- Build Command: `npm install; npm run build`
- Start Command: `npm run start:server`

No separate Static Site is required.

The app uses Express to:
- serve frontend static files from `dist/`
- expose API routes under `/api/*`
- expose health endpoint on `/health`

## 4) Environment variables

These are provisioned by blueprint:
- `NODE_ENV=production`
- `JWT_SECRET` (auto-generated)
- `DATABASE_URL` (from Render PostgreSQL connection string)

If you already have a service, verify these vars exist under:
**Service → Environment**.

## 5) Deploy and verify

After deploy completes:

1. Health check:
   - `https://team-code-zenith-8f8h.onrender.com/health`
   - Expect JSON containing `"status":"ok"`
2. Open app root:
   - `https://team-code-zenith-8f8h.onrender.com`
3. Test flow:
   - Register user (PDF resume required)
   - Login
   - Start interview
   - Submit answers

API + frontend should now be on the same domain.

## Frontend API behavior on same domain

Frontend now defaults to same-origin API calls when no API env var is set.

That means in Render single-service deployment, requests go to:
- `/api/...` on the same domain

You only need `VITE_API_URL` if frontend and backend are split across different domains.

## 6) If deploy fails

Check logs in this order:

1. **Build phase** errors
   - Missing dependency or TypeScript build issue.
2. **Start phase** errors
   - Wrong start command (must run backend server).
3. **Runtime** errors
   - Missing `DATABASE_URL` or invalid DB connectivity.

### Common fixes

- If app opens but API fails:
   - Open browser DevTools network tab and confirm requests are going to `/api/...` on your Render domain.
- If service boots with memory storage:
  - `DATABASE_URL` is missing or empty.
- If first request is slow:
  - Free tier cold start is expected.

## 7) Manual deploy for existing service (without recreating)



1. Open existing Web Service settings.
2. Set Build Command: `npm install; npm run build`
3. Set Start Command: `npm run start:server`
4. Add env vars:
   - `NODE_ENV=production`
   - `JWT_SECRET=<strong-random-value>`
   - `DATABASE_URL=<Render Postgres Internal URL>`
5. Click **Manual Deploy** → **Clear build cache & deploy**.

---

This repo is now render-ready via `render.yaml` and can be redeployed consistently from the dashboard.
