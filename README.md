# api-cost-control

NestJS API backing the Cost Control dashboard. Right now its only job is authentication: a single hardcoded admin account, sessions issued as an httpOnly JWT cookie. Project data endpoints are not implemented yet — the frontend dashboard currently runs on mock data (see `frontend/README.md`).

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set a real `JWT_SECRET` and admin password before anything beyond local dev.

### Environment variables

| Variable | Description |
| --- | --- |
| `PORT` | Port the API listens on. Default `3001`. |
| `FRONTEND_ORIGIN` | Exact origin of the Next.js app, used for CORS (must match exactly, including scheme/port, for cookies to be accepted). Default `http://localhost:3000`. |
| `JWT_SECRET` | Secret used to sign session JWTs. Change this for anything beyond local dev. |
| `JWT_EXPIRES_IN` | Session lifetime, e.g. `1d`, `12h`, `30m`. |
| `ADMIN_USERNAME` | The one admin account's username. |
| `ADMIN_PASSWORD` | Plaintext admin password. Ignored if `ADMIN_PASSWORD_HASH` is set. |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password. Takes precedence over `ADMIN_PASSWORD` when set. |
| `COOKIE_SECURE` | Set to `true` in production (HTTPS) so the session cookie is only sent over HTTPS. Keep `false` for local HTTP dev. |

## Running

```bash
npm run start:dev
```

API listens on `http://localhost:3001` by default. Start this before the frontend, since the dashboard's auth check calls this API on every request.

## Changing the admin password

There's no user database — just one admin identity read from environment variables at boot.

**Option 1 — plaintext (simplest, fine for local/dev):**

```
ADMIN_PASSWORD=your-new-password
```

Restart the server after editing `.env`.

**Option 2 — bcrypt hash (recommended once this leaves your laptop):**

```bash
node -e "console.log(require('bcrypt').hashSync('your-new-password', 10))"
```

Put the output in `.env`:

```
ADMIN_PASSWORD_HASH=$2b$10$...
```

When `ADMIN_PASSWORD_HASH` is set it always wins over `ADMIN_PASSWORD`, so you can delete/comment out the plaintext value.

## Auth flow

1. `POST /auth/login` with `{ username, password }` — validated against the env-configured admin. On success, signs a JWT and sets it as the `cc_token` httpOnly cookie (`SameSite=Lax`). Returns `{ user: { username } }` (the token itself is never exposed in the response body).
2. `GET /auth/me` — guarded by `JwtAuthGuard`. Reads the `cc_token` cookie, verifies signature + expiry, returns `{ username }`. This is what the Next.js dashboard layout calls server-side on every protected page load to confirm the session is still valid.
3. `POST /auth/logout` — clears the `cc_token` cookie.

CORS is configured with `credentials: true` and a single allowed `origin` (`FRONTEND_ORIGIN`) — both are required for the browser to send/receive the cookie across the frontend's port (3000) and this API's port (3001).

## API reference

| Method | Path | Auth required | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/auth/login` | No | `{ username, password }` | `{ user: { username } }` + sets `cc_token` cookie |
| GET | `/auth/me` | Yes (`cc_token` cookie) | — | `{ username }` |
| POST | `/auth/logout` | No | — | `{ success: true }` + clears `cc_token` cookie |
| GET | `/` | No | — | `"Hello World!"` (default health-check route) |

## Folder structure

```
src/
  auth/                 # everything related to login/session
    auth.controller.ts  # /auth/login, /auth/me, /auth/logout
    auth.service.ts      # credential validation + JWT signing
    jwt.strategy.ts       # extracts/verifies the cc_token cookie
    jwt-auth.guard.ts      # guard applied to protected routes
    dto/                   # request body shapes
    types/                 # JwtPayload, etc.
  config/
    configuration.ts     # typed env -> nested config object (port, jwt, admin, cors, cookie)
  app.module.ts           # wires ConfigModule + AuthModule
  main.ts                 # bootstrap: cookie-parser, CORS, listen
```
