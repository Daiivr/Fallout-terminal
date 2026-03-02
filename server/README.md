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

## Access Request Emails

The unauthorized Files panel includes a `Solicitar acceso` / `Request access` action.
When clicked by a logged-in unauthorized user, the server sends a Fallout-themed summary email to:

- `ACCESS_REQUEST_EMAIL_TO` (defaults to `dai@daivr.dev`)

The request form requires a non-empty access reason; blank requests are rejected.

Email content includes:
- Nick (Discord display name)
- Username
- Email
- Access reason (required from user input)
- Discord ID
- Account age
- Request time (UTC)

The email also includes **Approve** and **Decline** action links.
These links update the request status, and the next login on the Files page will reflect `Approved` or `Declined`.
Decision links and pending applications are limited to a 2-day review window; if no action is taken in that window, the request is auto-declined.

Configure SMTP in `server/.env`:

- `SMTP_HOST`
- `SMTP_PORT` (default `587`)
- `SMTP_SECURE` (`true` for SMTPS/465, `false` for STARTTLS/587)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_TLS_REJECT_UNAUTHORIZED` (default `true`; set `false` only if your local network/proxy injects TLS certificates)
- Optional: `ACCESS_REQUEST_COOLDOWN_MS` (default `900000`, i.e., 15 minutes per Discord ID)
- Optional: `ACCESS_REQUEST_DECISION_TTL_MS` (default `172800000`, 2 days max)
- Optional: `ACCESS_REQUEST_TOKEN_SECRET` (if empty, falls back to `SESSION_SECRET`)
- Optional: `PUBLIC_BASE_URL` (recommended for correct email decision links, e.g. `https://your-domain.com`)

Note: existing logged-in sessions created before this change may need a fresh logout/login so the full Discord profile payload is available for email reporting.

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
