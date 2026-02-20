# Almond Firebase Proxy

This Firebase Function translates Almond's HTTP API calls into Clawdbot WebSocket RPC.

## Endpoints

- `GET /api/status`
- `POST /api/message`
- `GET /api/memory` (currently returns an empty list)

## Required env vars (Functions)

- `CLAWDBOT_GATEWAY_URL` (must be a `wss://` gateway URL)
- `CLAWDBOT_GATEWAY_TOKEN` (optional)
- `CLAWDBOT_GATEWAY_PASSWORD` (optional)
- `CLAWDBOT_SESSION_KEY` (optional, default `main`)

## Local development

```bash
cd functions
cp .env.example .env
npm install
npm run build
firebase emulators:start --only functions
```

## Deploy

```bash
cd functions
npm run deploy
```

After deploy, set frontend `EXPO_PUBLIC_CLAWDBOT_URL` to your function base URL:

`https://<region>-<project-id>.cloudfunctions.net/api`

The app will call:

- `https://.../api/api/status`
- `https://.../api/api/message`
- `https://.../api/api/memory`

This matches the current frontend path contract.
