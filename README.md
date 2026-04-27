# Fallout Codex

Fallout Codex is a Fallout 76 fan project built as a retro Pip-Boy terminal. It combines live intel tracking, immersive frontend interactions, protected archive features, and a public Discord bot that can post silo and Minerva updates into Discord channels.

The project is split into two main parts:

- A static-style frontend in the repo root that powers the terminal UI, the boot sequence, the hacking/classified experience, the main Minerva and silo panels, and the standalone dossier-style pages.
- A Node/Express backend in `server/` that provides intel APIs, Discord auth and session handling, protected file/archive features, and the Discord bot worker.

## What The Project Includes

- Fallout-style main website with boot animation, terminal UI, and themed transitions
- Live Fallout 76 silo code tracking
- Live Minerva schedule, location, list rotation, and inventory tracking
- Standalone `Minerva` and `Silos` intel pages designed as full-screen terminal dossiers
- A classified/archive experience with authentication-gated content
- Discord OAuth and session-based access control
- Access request email flow for restricted files/archive access
- Admin-only temporary public share links with auto-expiry and optional VirusTotal badges
- A public Discord bot that can post rich silo and Minerva embeds into subscribed channels
- English and Spanish support across the site and bot

## Main User Flows

### Main site

The main terminal starts at `/` and behaves like a Pip-Boy interface. It includes:

- live silo code and Minerva intel panels
- local-time clocks and countdowns
- classified/archive sections
- Fallout-style transitions and boot/sync overlays

### Standalone intel pages

The project also includes dedicated standalone pages:

- `/minerva/`
  - a full-screen Minerva intel page with route intel, location images, inventory catalog, and sale timing
- `/silos/`
  - a full-screen Appalachian silo intel page with Alpha/Bravo/Charlie codes and reset timing

These pages are used by the Discord bot as deep-link targets from embeds.

### Discord bot

The bot watches the same intel sources used by the website and posts updates to subscribed Discord channels.

Current behavior includes:

- silo posts when silo codes actually change
- Minerva posts for the important state changes
- Minerva transit embed
- Minerva arrival embed with the sale inventory
- Minerva departure/restock embed with the next return window
- interactive Minerva item selection on arrival embeds
- ephemeral item-detail embeds for the user who clicked the selector

## Project Structure

### Frontend

- `index.html`
  - main Fallout Codex terminal entry point
- `404.html`
  - fallback not-found page
- `css/`
  - `styles.css` — entry point; imports all split stylesheets in order
  - `base/variables.css` — CSS custom properties (colors, fonts, spacing)
  - `base/fonts.css` — `@font-face` declarations
  - `base/reset.css` — global resets, scrollbar, base body
  - `base/animations.css` — all `@keyframes` blocks
  - `components/screen-effects.css` — `.screen-*` overlay layers and body state variants
  - `components/overlays.css` — `body.is-syncing`, `body.is-hacking` interaction lock styles
  - `components/boot.css` — boot overlay and `.boot-*` animation elements
  - `components/terminal.css` — `.pipboy-terminal`, topbar, tab strip, language dropdown, status strip
  - `components/buttons.css` — shared button group and interactive element states
  - `components/cards.css` — panels, code cards, silo panel, table, links, footer note
  - `pages/home.css` — all page-level styles for `/` (Intel overhaul, files/drops, hack overlay, error page, visit counter, admin panel, datetime picker, etc.)
  - `dossier-loader.css` — loading overlay shared by all dossier pages
  - `minerva-dossier.css` — standalone Minerva intel page
  - `silo-dossier.css` — standalone Silo intel page
  - `legal-dossier.css` — Privacy and Terms pages
- `js/`
  - `core/config.js` — all application constants (`const` declarations)
  - `core/state.js` — mutable state, `let` timers, `const state`, `STRINGS`, `elements`, image cache
  - `app.js` — all application functions and initialization logic; depends on `core/config.js` and `core/state.js` loaded first
  - `dossier-loader.js` — loading overlay logic shared by all dossier pages
  - `minerva-dossier.js` — Minerva standalone page logic
  - `silo-dossier.js` — Silo standalone page logic
  - `privacy-dossier.js` — Privacy page content and rendering
  - `terms-dossier.js` — Terms page content and rendering
  - `dom/elements.js` — pre-cached DOM element references (sets `globalThis.FALLOUT_CODEX_ELEMENTS`)
  - `i18n/en.js` — English string dictionary
  - `i18n/es.js` — Spanish string dictionary
  - `i18n/index.js` — wires i18n dictionaries into `globalThis.FALLOUT_CODEX_STRINGS`
- `assets/`
  - images, icons, fonts, Fallout-themed art, Minerva images, favicon
- `minerva/`
  - standalone Minerva intel page
- `silos/`
  - standalone silo intel page
- `data/`
  - archived Minerva list data and localized Minerva detail fallback data

#### Script load order for index.html

```
data/minerva-lists.js              ← global MINERVA_CYCLE_LISTS
data/minerva-detail-fallback.js    ← global MINERVA_DETAIL_FALLBACK
js/i18n/en.js                      ← global FALLOUT_CODEX_LOCALES.en
js/i18n/es.js                      ← global FALLOUT_CODEX_LOCALES.es
js/i18n/index.js                   ← global FALLOUT_CODEX_STRINGS
js/dom/elements.js                 ← global FALLOUT_CODEX_ELEMENTS
js/core/config.js                  ← all const declarations
js/core/state.js                   ← state object, let timers
js/app.js                          ← application logic
```

### Backend

- `server/src/web.js`
  - entry point for the website/API service
- `server/src/server.js`
  - Express app, auth/session logic, protected file/archive features, API routes
- `server/src/intel.js`
  - upstream Fallout intel fetching/parsing for silos and Minerva
- `server/src/bot.js`
  - Discord bot worker entry point
- `server/src/discordIntelBot.js`
  - bot commands, subscriptions, polling, embed generation, interactive Minerva selectors

### Scripts and generated data

- `scripts/generate-minerva-detail-fallback.mjs`
  - generates the localized Minerva item detail fallback dataset
- `data/minerva-lists.json`
  - archived Minerva sale list rotations and item pricing
- `data/minerva-detail-fallback.json`
  - localized Minerva item descriptions/unlock info used as fallback detail data

## How The Data Works

### Silo codes

Silo data is resolved server-side and exposed to the frontend and bot from the backend.

### Minerva

Minerva data comes from a mix of:

- live intel sources for state, timing, and location
- local archived list data for sale inventories
- localized fallback detail data for individual item descriptions

That means:

- the site and bot can stay consistent even if upstream formatting changes
- Minerva item details can still be shown in English/Spanish using local fallback data
- the Discord bot can build stable sale embeds from the archived list instead of relying only on the live page layout

## Tech Stack

- HTML, CSS, vanilla JavaScript
- Node.js
- Express
- Discord.js
- Redis support for sessions
- Render deployment for web + worker

## Running Locally

### Frontend only

If you just want to work on the static frontend, you can serve the repo root with any local static server.

### Full app

From the `server/` directory:

```bash
npm install
npm run web
```

In a second terminal, if you want the Discord bot too:

```bash
cd server
npm run bot
```

For backend env vars, auth, Redis, email setup, and bot env vars, see `server/README.md`.

## Deployment

The repo is set up to deploy cleanly on Render as two services:

- a `web` service for the website/API
- a `worker` service for the Discord bot

The included `render.yaml` already reflects that split:

- web service starts with `cd server && npm run web`
- bot worker starts with `cd server && npm run bot`

Recommended production shape:

- keep the website on a Render web service
- keep the Discord bot on a separate Render background worker
- use persistent storage if you want archive/file data or bot subscription state to survive redeploys

## Why The Repo Is Organized This Way

This project mixes three different concerns:

- themed frontend presentation
- backend auth/storage/API work
- long-running Discord bot behavior

Keeping the web app and the bot as separate runtime entry points avoids deployment conflicts:

- website deploys should not interrupt the bot more than necessary
- the bot should remain an always-on worker
- the frontend can stay mostly static while the backend handles auth and intel aggregation

## Good Starting Points For New Contributors

If someone is new to the repo, these are the best files to read first:

- `index.html`
- `js/core/config.js` — all feature constants and URLs
- `js/core/state.js` — application state shape
- `js/app.js` — all application logic
- `css/styles.css` — CSS entry point (lists all imported partials)
- `css/pages/home.css` — main page styles
- `server/src/server.js`
- `server/src/intel.js`
- `server/src/discordIntelBot.js`
- `server/README.md`

## Notes

- The project uses a lot of handcrafted Fallout-themed UI and behavior, so changes often touch both presentation and data formatting.
- The Minerva system is partly live and partly archival by design.
- The Discord bot is not just a notifier anymore; it also includes interactive item inspection for Minerva sales.
