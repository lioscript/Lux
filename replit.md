# Lux Verification System

A premium Telegram third-party verification service — a bot + Mini App that lets users buy verified badges for channels, personal profiles, and bots.

## Run & Operate

- `pnpm --filter @workspace/lux-miniapp run dev` — run the Mini App (port set by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server + Telegram bot (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Required Secrets

| Secret | Description |
|--------|-------------|
| `BOT_TOKEN` | Telegram bot token from @BotFather |
| `ADMIN_ID` | Numeric Telegram user ID of the admin |
| `WEBAPP_URL` | (Optional) Production URL of the Mini App; defaults to `REPLIT_DEV_DOMAIN` |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Telegram bot: grammy (latest Bot API support)
- Mini App: React + Vite + Tailwind CSS + Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (available but unused for current scope)

## Where things live

- `artifacts/lux-miniapp/src/App.tsx` — Mini App UI (3 tabs: Channel / Personal / Bot)
- `artifacts/api-server/src/bot.ts` — Telegram bot logic (commands, admin panel, verification API calls)
- `artifacts/api-server/src/index.ts` — server + bot entry point
- `attached_assets/` — phone mockup screenshots used in the Mini App

## Bot Commands

- `/start` — welcome message with "Open Mini App" button (English)
- `/adm` — admin-only panel (4 inline buttons for managing verifications)

## Admin Panel (ADMIN_ID only)

| Button | Action |
|--------|--------|
| 💎 Верифікувати Юзера | Calls `verifyUser(user_id, { custom_description })` |
| 📢 Верифікувати Канал/Групу | Calls `verifyChat(chat_id, { custom_description })` |
| ❌ Забрати верифікацію (Юзер) | Calls `removeUserVerification(user_id)` |
| ❌ Забрати верифікацію (Канал/Групу) | Calls `removeChatVerification(chat_id)` |

## Architecture decisions

- grammy is externalized in esbuild (`build.mjs`) because it contains a native `platform.node` module that can't be bundled.
- Bot runs via long-polling alongside the Express server in the same process.
- LUX_ICON_ID (`5402122943360706916`) is stored as a reference constant — the custom emoji is assigned at the bot level via @VerifyBot registration, not passed per API call. The API only accepts `custom_description`.
- verifyUser requires a numeric ID; verifyChat accepts both numeric IDs and @username strings.
- Admin state machine uses an in-memory Map (sufficient for single-admin use).

## Gotchas

- Verification methods (`verifyUser`, `verifyChat`) require the bot to have a blue verification checkmark from Telegram (@VerifyBot). Without it, Telegram API returns an error that the bot logs and reports in chat.
- `/adm` is completely silent to non-admins (no error reply), to avoid revealing the command exists.
- After deploying, set `WEBAPP_URL` secret to the production domain so the Mini App button points to the live URL instead of the dev domain.

## Railway Deployment

The project deploys as **two separate Railway services** from this monorepo.

### Service 1 — API Server (bot + REST API)

| Setting | Value |
|---------|-------|
| Root Directory | `artifacts/api-server` |
| Build Command | *(from railway.toml — auto-detected)* |
| Start Command | `node dist/index.mjs` |
| Health Check | `/api/healthz` |

**Required env vars in Railway dashboard:**

| Variable | Value |
|----------|-------|
| `BOT_TOKEN` | Telegram bot token from @BotFather |
| `ADMIN_ID` | Numeric Telegram user ID of the admin |
| `WEBAPP_URL` | Full URL of the Mini App service (set after deploying Service 2) |

### Service 2 — Lux Mini App (static frontend)

| Setting | Value |
|---------|-------|
| Root Directory | `artifacts/lux-miniapp` |
| Build Command | *(from railway.toml — auto-detected)* |
| Start Command | `node serve-static.mjs` |

No secrets required for this service — it is a purely static Telegram Mini App.

### Deployment order

1. Deploy **Mini App** service first → copy its Railway-assigned public URL.
2. Set `WEBAPP_URL` env var on the **API Server** service to that URL.
3. In @BotFather → *Edit Bot → Edit Menu Button* → set the URL to the same Mini App URL.
4. Register the bot with @VerifyBot to obtain the blue checkmark (required for verification API calls to succeed).

### Config files

- `artifacts/api-server/railway.toml` — API Server Railway config
- `artifacts/lux-miniapp/railway.toml` — Mini App Railway config

## User preferences

- Language: Admin UI in Ukrainian, /start message in English.
- "Buy via manager" always links to @li0nchik.
- No referral program section, no $MAJOR holders section, no question-mark help button.
