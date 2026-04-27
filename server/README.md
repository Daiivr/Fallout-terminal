# Fallout Codex Server

Express backend for Discord auth, session-based allowlist checks, protected file storage, and JSON metadata persistence.

## Local

1. Copy `server/.env.example` to `server/.env`.
2. Fill in your Discord OAuth app values.
3. Run:

```bash
cd server
npm install
npm run web
```

Open `http://localhost:3000`.

Run the bot locally in a second terminal:

```bash
cd server
npm run bot
```

## Discord Intel Bot

The server can also run a Discord bot that watches the same silo code and Minerva intel sources used by the site and posts rich embeds when either feed changes.

### What it does

- Polls silo code intel and Minerva intel on an interval
- Detects changes using stored fingerprints so it does not spam unchanged data
- Posts a rich embed when silo codes change
- Posts a rich embed when Minerva changes location, list, timing, or inventory
- Rotates the bot presence between Playing Fallout 76, Watching Silo Codes, Watching Minerva Sales, and Listening to Appalachia Radio
- Lets you manage subscriptions inside Discord with slash commands

### Required env vars

- `DISCORD_BOT_TOKEN`
- `DISCORD_BOT_CLIENT_ID`

If your bot and site OAuth use the same Discord application, `DISCORD_BOT_CLIENT_ID` can be the same value as `DISCORD_CLIENT_ID`.

### Optional env vars

- `DISCORD_BOT_GUILD_ID`
  - Recommended for local/dev testing because guild slash commands appear almost immediately
- `DISCORD_INTEL_CHANNEL_IDS`
  - Comma-separated channel IDs that should always receive both intel feeds
- `DISCORD_INTEL_POLL_INTERVAL_MS`
  - Defaults to `300000` (5 minutes)
- `DISCORD_BOT_STATUS_ROTATION_INTERVAL`
  - Defaults to `60s`; accepts values like `30s`, `5m`, `1h`, or raw milliseconds
- `DISCORD_INTEL_POST_ON_STARTUP`
  - Defaults to `false`
  - When `true`, startup only posts catch-up intel if the stored fingerprint differs from the current snapshot
- `DISCORD_BOT_DEFAULT_LANG`
  - Defaults to `en`
- `DISCORD_BOT_GOLD_BULLION_EMOJI`
  - Defaults to `<:Gold:1480101994520645703>`
- `PUBLIC_BASE_URL`
  - Recommended so embeds can link back to your deployed site and use your site images

### Slash commands

- `/intel-subscribe channel:#your-channel feed:Both`
- `/intel-unsubscribe channel:#your-channel`
- `/intel-status`
- `/intel-preview feed:Both`
- `/intel-language language:Espanol`

The bot stores channel subscriptions and last-posted intel state in your `STORAGE_DIR`, so it survives restarts when persistent storage is configured.

### Discord setup notes

- Enable the Bot for your Discord application in the Discord Developer Portal
- Invite it with the `bot` and `applications.commands` scopes
- Give it permission to view channels, send messages, and embed links in the target channel

### Render deployment

If you already have the website running on Render, the safest path is to keep that existing web service and add a new worker service for the bot. Do not create a second web service unless you actually want a new deployment stack.

#### Existing Render site: recommended manual setup

1. Keep your current web service, but change its start command to:

```bash
cd server && npm run web
```

2. Make sure its build command is:

```bash
cd server && npm ci
```

3. In that web service, keep or set the env vars your site already needs.
4. Create a new **Background Worker** service in Render from the same repo.
5. Set the worker build command to:

```bash
cd server && npm ci
```

6. Set the worker start command to:

```bash
cd server && npm run bot
```

7. Set these worker env vars:
   - `DISCORD_BOT_TOKEN`
   - `DISCORD_BOT_CLIENT_ID`
   - `PUBLIC_BASE_URL`
   - Optional: `DISCORD_BOT_GUILD_ID`
   - Optional: `DISCORD_INTEL_CHANNEL_IDS`
   - Optional: `DISCORD_INTEL_POLL_INTERVAL_MS`
   - Optional: `DISCORD_INTEL_POST_ON_STARTUP`

If your bot and site OAuth use the same Discord application, `DISCORD_BOT_CLIENT_ID` can be the same as `DISCORD_CLIENT_ID`.

#### Persistent storage on Render

- Web service:
  - If you use file uploads or metadata persistence, attach a persistent disk and set `STORAGE_DIR` to that mount path, for example `/var/data/fallout-codex-web`.
- Bot worker:
  - If you want subscriptions and last-posted fingerprints to survive redeploys, attach a persistent disk and set `STORAGE_DIR` to something like `/var/data/fallout-codex-bot`.

The web service disk and the bot worker disk are separate. They do not share files with each other.

#### Fresh Render setup with Blueprint

A sample Render blueprint is included at [render.yaml](C:/Users/ohits/Downloads/Fallout-terminal/render.yaml). Use that if you want Render to create both services from scratch.

If you already have existing Render services, treat `render.yaml` as a reference unless you are intentionally replacing your current setup.

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

## Temporary Share Console

The admin account now has a dedicated `Drops` tab for creating temporary public file links.

Each temporary share can have:

- a download limit
- a time-based expiration
- both at the same time
- an optional public description
- a public preview page at `/drops/<slug>`

When a share expires or reaches its download cap, the server removes the metadata entry and deletes the stored file automatically.

### VirusTotal badge

If `VT_API_KEY` is configured, the server will queue each temporary share for a VirusTotal scan and show a status badge such as `VT SAFE`, `VT FLAGGED`, or `VT SCANNING`.

Important:

- `VT SAFE` means VirusTotal reported `0` malicious/suspicious detections at the time of the last check. It is not a guarantee that a file is harmless.
- The default share upload limit is `32 MB`, which matches the straightforward VirusTotal file upload flow.
- VirusTotal community API quotas are limited, so scans may stay in `VT SCANNING` briefly if multiple uploads are queued.

### Optional env vars

- `VT_API_KEY`
  - Enables VirusTotal lookups and badges for temporary shares
- `TEMP_SHARE_MAX_FILE_BYTES`
  - Defaults to `33554432` (`32 MB`)
- `TEMP_SHARE_RETENTION_MAX_HOURS`
  - Defaults to `168` (`7 days`)
- `TEMP_SHARE_TEXT_PREVIEW_MAX_BYTES`
  - Defaults to `262144` (`256 KB`) for inline text previews
- `TEMP_SHARE_VT_TICK_MS`
  - Defaults to `20000`
- `TEMP_SHARE_CLEANUP_INTERVAL_MS`
  - Defaults to `60000`

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
