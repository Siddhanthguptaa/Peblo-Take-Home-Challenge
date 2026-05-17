# Deploying NeuroNote

NeuroNote is a modern Turborepo monorepo that consists of four primary components: a Next.js frontend and three independent Node.js backend services. Deploying this application requires hosting the frontend, managing the backend microservices, and provisioning a production database.

Here is a comprehensive guide to taking NeuroNote to production.

---

## 1. Architecture Overview

To deploy successfully, you need to understand the moving parts:
- **`apps/web`**: Next.js frontend application.
- **`apps/server`**: Main Express REST API (Handles auth, AI calls, room management).
- **`apps/ws-server`**: Standard WebSocket server for room Chat.
- **`apps/hocuspocus-server`**: Yjs WebSocket server for real-time collaborative text editing.
- **`packages/db`**: Shared Prisma PostgreSQL database client.

## 2. Recommended Hosting Providers

For a monorepo of this structure, we recommend decoupling the frontend and backend:

*   **Frontend**: [Vercel](https://vercel.com) (Best for Next.js, zero-config Turborepo support).
*   **Backends & WebSockets**: [Railway](https://railway.app), [Render](https://render.com), or [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform). These platforms provide excellent support for long-lived WebSocket connections.
*   **Database**: [Supabase](https://supabase.com) or [Neon](https://neon.tech) (Serverless Postgres).

---

## 3. Step-by-Step Deployment Guide

### Step A: Set up a Production Database
1. Create a PostgreSQL instance on a provider like Supabase or Neon.
2. Retrieve your connection string (e.g., `postgresql://postgres:password@host:5432/postgres?pgbouncer=true&connection_limit=1`).
3. Run your Prisma migrations against the production database from your local machine:
   ```bash
   cd packages/db
   npx prisma migrate deploy
   ```

### Step B: Deploy the Backend Services (e.g., on Railway)
Railway is ideal because you can deploy multiple services from a single monorepo.

1. **Connect your GitHub repository** to Railway.
2. **Create three separate services** from the same repo.
3. For each service, set the **Root Directory** or start commands:
   - **Main Server:** 
     - Build Command: `pnpm build --filter server...`
     - Start Command: `pnpm start --filter server`
   - **Chat WebSocket:** 
     - Build Command: `pnpm build --filter ws-server...`
     - Start Command: `pnpm start --filter ws-server`
   - **Hocuspocus WebSocket:** 
     - Build Command: `pnpm build --filter hocuspocus-server...`
     - Start Command: `pnpm start --filter hocuspocus-server`
4. **Configure Environment Variables** across all three backend services:
   - `DATABASE_URL`: (Your production Postgres URL)
   - `JWT_SECRET` / `JWT_REFRESH_SECRET`: (Generate secure random strings)
   - `GEMINI_API_KEY`: (For AI features)
   - `NEXT_APP_URL`: (The production URL of your frontend, e.g., `https://neuronote.com`)

### Step C: Deploy the Frontend (Vercel)
1. Import your GitHub repository into Vercel.
2. Vercel will automatically detect that it's a Turborepo and configure the Next.js build.
3. Set your **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: URL of your deployed Main Server (e.g., `https://api.neuronote.com/api`)
   - `NEXT_PUBLIC_WS_URL`: URL of your deployed Chat WebSocket (e.g., `wss://chat.neuronote.com`)
   - `NEXT_PUBLIC_HOCUSPOCUS_URL`: URL of your deployed Hocuspocus Server (e.g., `wss://collab.neuronote.com`)
4. Click **Deploy**.

---

## 4. Crucial Production Considerations

*   **Cookie SameSite Policies**: 
    If your frontend (Vercel) and backend (Railway) are on different domains (e.g., `neuronote.vercel.app` and `api.railway.app`), your authentication cookies will be blocked by browsers. 
    *Fix:* You must either use a custom domain so they share a top-level domain (e.g., `app.yourdomain.com` and `api.yourdomain.com`), OR set your cookie `SameSite` attribute to `none` and `Secure` to `true` in `authController.ts`.
*   **WebSocket Load Balancing**: 
    Hocuspocus requires sticky sessions if you scale beyond a single instance. If you run multiple instances of `hocuspocus-server`, you must implement Redis integration for cross-instance document syncing.
*   **CORS Configuration**: 
    Ensure the `cors` middleware in your Express server strictly explicitly allows the production domain of your Next.js application.
