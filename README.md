# Orin Agent Web

Web control plane for the local Orin Agent gateway. It assigns real work, shows the actual event stream, handles approval choices, steers/stops runs, displays final output, and downloads authenticated artifacts.

## Gateway contract

The browser adapter matches the local Agent API:

- readiness: `GET /health/detailed`
- runs: `POST /v1/runs`, `GET /v1/runs/:id`
- events: SSE `GET /v1/runs/:id/events`
- approvals: `POST /v1/runs/:id/approval`
- sessions: `/api/sessions` and `/api/sessions/:id/messages` using `data` arrays
- artifacts: authenticated `GET /v1/artifacts/download/:id`

The client normalizes the gateway's `event` field, dotted event names, nested errors, and final `run.output`. Prompt/retrieval data never masquerades as a run result.

## Connection security

- Default URL: `http://127.0.0.1:8642`.
- Non-loopback endpoints must use HTTPS.
- URL credentials, query strings, and fragments are rejected.
- The gateway key and recent run IDs use `sessionStorage`, not persistent `localStorage`.
- The Vercel deployment sets CSP, frame denial, referrer policy, MIME protection, and permissions policy.

The backend remains the authorization boundary. The UI only displays approvals and submits the selected choice.

## Development

```bash
npm ci
npm test
npm run build
npm run dev
```

Tests use local fakes and never contact a live gateway.

## Local Agent

Start the signed Orin Agent local runtime with its API server enabled, then open `https://agent.orinai.org/#/settings` and enter the URL/key. A public Vercel page must be explicitly allowed by the local gateway CORS configuration; the browser will not downgrade a remote HTTP connection.

## Deployment

Static Vercel deployment. No Vercel server functions or database are required. Task execution remains on the paired machine.

## Privacy

The public site can send task text and gateway credentials to the URL the user explicitly configures. Model, browser, search, and tool providers selected by the local Agent may still receive task data; the web client does not claim that cloud Agent execution is local-only.
