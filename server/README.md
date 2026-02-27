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
2. Set all required env vars from `.env.example`.
3. Attach a persistent disk and set `STORAGE_DIR` to a path on that disk (example: `/var/data/fallout-codex`).

Without persistent disk storage, uploaded files and metadata are lost on redeploy/restart.
