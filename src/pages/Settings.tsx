import { useState } from 'react';
import type { Gateway } from '../state/connection';

export function Settings({ gw }: { gw: Gateway }) {
  const [url, setUrl] = useState(gw.config.baseUrl);
  const [key, setKey] = useState(gw.config.apiKey);
  const [saved, setSaved] = useState(false);

  function save() {
    gw.setConfig({ baseUrl: url, apiKey: key });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="app-shell">
      <div className="wrap">
        <p className="kicker">Settings</p>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}>Connection.</h1>
        <p className="lead" style={{ marginTop: 14 }}>
          This app drives your Orin Agent gateway over its local REST API.
          Point it at the machine doing the work — default is this computer.
        </p>
        <div className="panel" style={{ marginTop: 26, maxWidth: 640 }}>
          <div className="field">
            <label htmlFor="gw-url">Gateway URL</label>
            <input id="gw-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://127.0.0.1:8642" inputMode="url" />
          </div>
          <div className="field">
            <label htmlFor="gw-key">API key (optional — only if your gateway sets one)</label>
            <input id="gw-key" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="API_SERVER_KEY value" autoComplete="off" />
          </div>
          <button className="btn btn-solid" onClick={save}>Save &amp; reconnect</button>
          {saved && <p role="status" style={{ color: 'var(--accent)', fontSize: 14, marginTop: 12 }}>Saved — checking connection…</p>}
          <dl className="kv">
            <dt>status</dt><dd>{gw.status}</dd>
            <dt>health</dt><dd className="mono">GET /health</dd>
            <dt>runs</dt><dd className="mono">POST /v1/runs · SSE /v1/runs/:id/events</dd>
            <dt>approvals</dt><dd className="mono">POST /v1/runs/:id/approval</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
