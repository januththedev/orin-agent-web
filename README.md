# orin-agent-web

Public website + web application for **Orin Agent** — the autonomous AI
agent that plans multi-step tasks, uses real tools, pauses for approval,
and delivers artifacts. Live at `https://agent.orinai.org`.

Part of the [Orin AI ecosystem](https://orinai.org) · MIT licensed.

## What this is

Two connected experiences, one codebase and design system:

- **Marketing site** (`#/`): hero, capabilities, execution visibility,
  trust model. WebGL hero (Three.js, lazy, reduced-motion safe).
- **Application** (`#/app`): connect to your gateway, assign tasks, watch
  the execution timeline, resolve approvals, steer/stop runs, open artifacts.
  Task deep links (`#/tasks/:id`), connection settings (`#/settings`),
  real documentation (`#/docs`).

The app drives a **real backend** — your Orin Agent gateway over its local
REST API (`POST /v1/runs`, SSE `/v1/runs/:id/events`, approvals, sessions,
artifacts). No backend → an honest "not reachable" state, never fake data.

## Architecture

```
src/
  api/gateway.ts      typed gateway client (no `any` leaks, GatewayError)
  state/connection.ts gateway URL/key (localStorage) + status hook
  hooks/route.ts      hash router (#/, #/app, #/tasks/:id, #/settings, #/docs)
  components/         Nav, Hero, Products, SelfHost, Footer, Reveal, Cursor, Site
  pages/              Workspace, RunDetail, Settings, Docs
  three/nodes.ts      systems-motif WebGL scene (isolated, disposable)
  App.tsx             route switch
```

Boundary: frontend consumes stable gateway APIs only. Permissions are
enforced by the backend runtime — the approval UI only relays decisions.

## Getting Started

```bash
git clone https://github.com/januththedev/orin-agent-web
cd orin-agent-web
npm install
npm run dev        # http://localhost:5173
```

To use the app, run the Orin Agent backend on the same machine (default
`http://127.0.0.1:8642`, `API_SERVER_PORT` overrides). Set the URL/key in
Connection settings inside the app.

## Environment variables

None required at build time. Runtime connection (gateway URL + API key)
lives in the browser's localStorage, per user.

## Deployment

Static site — any host. Vercel: Add New → Project → import → Deploy, then
map `agent.orinai.org`. `public/robots.txt` + `public/sitemap.xml` ship SEO.

## Testing

```bash
npm run build   # tsc --noEmit + vite build (typecheck is the gate)
```

Behavioral checklist (manual, against a local gateway): connect online →
create run → events stream → approval pause → allow → completion →
artifact link; kill backend mid-run → honest error; reload keeps drafts
via recent-run list. Automated frontend tests are the next milestone
(tracked, not faked).

## Contributing

Fork → branch → PR against `main`. Match the existing aesthetic
(monochrome + lime, Space Grotesk + JetBrains Mono). No new dependencies
without justification. Accessibility: landmarks, focus states, reduced
motion — all already wired, keep them working.

## License

MIT — see [LICENSE](LICENSE).
