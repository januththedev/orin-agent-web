import { Reveal } from '../components/Reveal';

const SECTIONS: Array<[string, string[]]> = [
  ['Connect', [
    'Run the Orin Agent backend on the machine doing the work.',
    'Default gateway address is http://127.0.0.1:8642 (API_SERVER_PORT overrides it).',
    'If your gateway sets API_SERVER_KEY, paste it in Connection settings — it travels as a Bearer token.',
    'This page can call your own computer because browsers exempt localhost from mixed-content blocking.',
  ]],
  ['Assign a task', [
    'Open App → describe the outcome, not the steps.',
    'Each submission carries an Idempotency-Key: safe retries never create duplicate runs.',
    'Watch the timeline: planning, tool calls, verification stream in live.',
  ]],
  ['Approvals', [
    'Gated actions pause the run and appear here with what, why, and impact.',
    'Allow once (this request), always allow (this class), or deny.',
    'Permissions are enforced by the backend runtime — this UI only relays your decision.',
  ]],
  ['Artifacts', [
    'Files, reports, code and media the run produced, downloadable from the task page.',
    'Continue working from any artifact in a new task.',
  ]],
  ['Troubleshooting', [
    '“Cannot reach the gateway” → backend not running, wrong port, or a firewall.',
    '401 → wrong API key. 429 → the gateway is at its concurrency cap; wait.',
    'Stream stalls → the run view polls status every 8s as backup; reload if stuck.',
  ]],
];

export function Docs() {
  return (
    <div className="app-shell">
      <div className="wrap">
        <p className="kicker">Documentation</p>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}>How Orin Agent works.</h1>
        <p className="lead" style={{ marginTop: 14 }}>
          Orin Chat answers. Orin Agent is assigned work — it plans, uses tools,
          asks permission, and delivers. Everything below describes real backend
          behavior, not mockups.
        </p>
        {SECTIONS.map(([h, ps]) => (
          <Reveal key={h}>
            <section className="block" style={{ padding: '48px 0 0' }} aria-label={h}>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}>{h}</h2>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 680 }}>
                {ps.map((p) => (
                  <p key={p.slice(0, 24)} style={{ color: 'var(--mut)', fontSize: 15 }}>{p}</p>
                ))}
              </div>
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
