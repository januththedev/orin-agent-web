import { useEffect, useState } from 'react';
import { GatewayError, type RunInfo, type SessionInfo } from '../api/gateway';
import type { Gateway } from '../state/connection';

const RECENT_KEY = 'orin-agent-web.recent-runs.v1';

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = JSON.parse(raw || '[]') as unknown;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string').slice(0, 20) : [];
  } catch { return []; }
}

export function Workspace({ gw, go }: { gw: Gateway; go: (to: string) => void }) {
  const [tab, setTab] = useState<'tasks' | 'sessions'>('tasks');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsError, setSessionsError] = useState('');

  useEffect(() => {
    if (gw.status !== 'online' || tab !== 'sessions') return;
    let live = true;
    gw.client.sessions().then(
      (r) => live && setSessions(Array.isArray(r.sessions) ? r.sessions : []),
      (e) => live && setSessionsError(e instanceof Error ? e.message : 'Failed to load sessions.'),
    );
    return () => { live = false; };
  }, [gw, tab]);

  async function start() {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setError('');
    try {
      const run: RunInfo = await gw.client.createRunIdempotent(text);
      if (typeof run.run_id !== 'string' || !run.run_id) throw new GatewayError(502, 'Gateway returned a malformed run.');
      const next = [run.run_id, ...recent].slice(0, 20);
      setRecent(next);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      setInput('');
      go(`tasks/${encodeURIComponent(run.run_id)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the task.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="wrap">
        <p className="kicker">Workspace</p>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}>Assign work.</h1>

        <div className="conn" role="status" aria-label="Gateway connection">
          <span className={`dot${gw.status === 'online' ? ' on' : ''}`} aria-hidden="true" />
          <span className="mono" style={{ fontSize: 12 }}>
            {gw.config.baseUrl} · {gw.status === 'online' ? 'connected' : gw.status === 'checking' ? 'checking…' : 'not connected'}
          </span>
          <button className="btn btn-line btn-sm" onClick={() => go('settings')}>Connection settings</button>
          {gw.status !== 'online' && (
            <button className="btn btn-line btn-sm" onClick={() => gw.check()}>Retry</button>
          )}
        </div>

        {gw.status !== 'online' ? (
          <div className="notice" role="alert">
            <b>Backend not reachable.</b> This app drives your local Orin Agent
            gateway — start it first (<span className="mono">orin-agent</span> /
            <span className="mono">hermes serve</span> on the machine you want work
            done on), then set the URL and key in Connection settings. Nothing
            here is simulated: no backend, no tasks.
          </div>
        ) : (
          <>
            <div className="tabs" role="tablist" aria-label="Workspace">
              <button role="tab" aria-selected={tab === 'tasks'} className={`tab${tab === 'tasks' ? ' on' : ''}`} onClick={() => setTab('tasks')}>Tasks</button>
              <button role="tab" aria-selected={tab === 'sessions'} className={`tab${tab === 'sessions' ? ' on' : ''}`} onClick={() => setTab('sessions')}>Sessions</button>
            </div>

            {tab === 'tasks' && (
              <div className="panel">
                <div className="field">
                  <label htmlFor="new-task">New task — describe the outcome you want</label>
                  <textarea
                    id="new-task" rows={3} value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. Research 3 competitors and save a comparison report"
                  />
                </div>
                {error && <p role="alert" style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}
                <button className="btn btn-solid" disabled={!input.trim() || busy} onClick={start}>
                  {busy ? 'Starting…' : 'Start task'}
                </button>
                {recent.length > 0 && (
                  <div style={{ marginTop: 26 }}>
                    <p className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--faint)' }}>RECENT RUNS (THIS BROWSER)</p>
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {recent.map((id) => (
                        <button key={id} className="btn btn-line btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => go(`tasks/${encodeURIComponent(id)}`)}>
                          <span className="mono">{id}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'sessions' && (
              <div className="panel">
                {sessionsError && <p role="alert" style={{ color: 'var(--danger)', fontSize: 14 }}>{sessionsError}</p>}
                {!sessionsError && sessions.length === 0 && <p style={{ color: 'var(--mut)', fontSize: 14 }}>No sessions on this gateway yet.</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sessions.map((s, i) => (
                    <div key={String(s.id ?? s.session_id ?? i)} className="mono" style={{ fontSize: 13, border: '1px solid var(--line)', borderRadius: 12, padding: '12px 16px' }}>
                      {String(s.title ?? s.id ?? s.session_id ?? 'session')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
