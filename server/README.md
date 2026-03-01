# Fallout Codex Server

Express backend for Discord auth, session-based allowlist checks, protected file storage, and JSON metadata persistence.

## Local

1. Copy `server/.env.example` to `server/.env`.
2. Fill in your Discord OAuth app values.
3. Run:

```bash
cd server
npm install
npm run dev
```

Open `http://localhost:3000`.

## Render

1. Deploy the `server` directory as a Node Web Service.
2. Create a **Render Redis** service in the same region.
3. Set all required env vars from `.env.example`, especially:
   - `REDIS_URL`: use the Redis service connection string from Render.
   - `SESSION_SECRET`: long random secret (at least 32 chars).
   - `DISCORD_REDIRECT_URI`: must match your Render URL callback.
4. Attach a persistent disk and set `STORAGE_DIR` to a path on that disk (example: `/var/data/fallout-codex`).
5. Deploy/restart the web service.

The server will use Redis for sessions when `REDIS_URL` is set. If `REDIS_URL` is missing, it falls back to MemoryStore (not recommended for production).

Without persistent disk storage, uploaded files and metadata are lost on redeploy/restart.
