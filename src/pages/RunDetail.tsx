import { useEffect, useRef, useState } from 'react';
import type { ApprovalRequest, RunEvent, RunInfo } from '../api/gateway';
import type { Gateway } from '../state/connection';

function eventText(ev: RunEvent): string {
  for (const k of ['text', 'message', 'content', 'summary']) {
    const v = ev[k];
    if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 500);
  }
  return ev.type;
}

function isApproval(ev: RunEvent): ev is RunEvent & ApprovalRequest {
  return ev.type === 'approval_request' || ev.type === 'approval-required' || ev.type === 'awaiting_approval';
}

export function RunDetail({ gw, runId, go }: { gw: Gateway; runId: string; go: (to: string) => void }) {
  const [run, setRun] = useState<RunInfo | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [error, setError] = useState('');
  const [steerText, setSteerText] = useState('');
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let live = true;
    const abort = new AbortController();
    abortRef.current = abort;

    gw.client.getRun(runId, abort.signal).then(
      (r) => live && setRun(r),
      (e) => live && setError(e instanceof Error ? e.message : 'Could not load the run.'),
    );

    (async () => {
      try {
        for await (const ev of gw.client.streamEvents(runId, abort.signal)) {
          if (!live) break;
          setEvents((prev) => [...prev.slice(-199), ev]);
          if (ev.type === 'run_completed' || ev.type === 'run_failed' || ev.type === 'completed' || ev.type === 'failed') {
            gw.client.getRun(runId).then(
              (r) => live && setRun(r),
              () => undefined,
            );
          }
        }
      } catch (e) {
        if (live && e instanceof Error && e.name !== 'AbortError') {
          setError((prev) => prev || e.message);
        }
      }
    })();

    const poll = window.setInterval(() => {
      gw.client.getRun(runId).then(
        (r) => live && setRun(r),
        () => undefined,
      );
    }, 8000);

    return () => {
      live = false;
      abort.abort();
      window.clearInterval(poll);
    };
  }, [gw, runId]);

  async function act(fn: () => Promise<unknown>, done?: string) {
    setBusy(true);
    setError('');
    try {
      await fn();
      if (done) {
        const r = await gw.client.getRun(runId).catch(() => null);
        if (r) setRun(r);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  const status = typeof run?.status === 'string' ? run.status : 'unknown';
  const pendingApproval = [...events].reverse().find(isApproval) ?? null;
  const artifacts: Array<{ id: string; name?: string }> = Array.isArray((run as Record<string, unknown> | null)?.artifacts)
    ? ((run as Record<string, unknown>).artifacts as Array<{ id: string; name?: string }>)
    : [];

  return (
    <div className="app-shell">
      <div className="wrap">
        <button className="btn btn-line btn-sm" onClick={() => go('app')}>← All tasks</button>
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)' }}>Task</h1>
          <span className={`status-pill${status === 'completed' ? ' live' : ''}`}>{status}</span>
        </div>
        <p className="mono" style={{ fontSize: 12, color: 'var(--faint)', marginTop: 8, wordBreak: 'break-all' }}>{runId}</p>

        {error && <p role="alert" style={{ color: 'var(--danger)', fontSize: 14, marginTop: 14 }}>{error}</p>}

        {pendingApproval && (
          <div className="approval" role="alert" aria-label="Approval needed">
            <h4>Approval needed</h4>
            <p>
              {typeof pendingApproval.action === 'string' && pendingApproval.action ? pendingApproval.action + ' — ' : ''}
              {typeof pendingApproval.reason === 'string' && pendingApproval.reason ? pendingApproval.reason : 'The agent wants to proceed with a gated action.'}
            </p>
            <div className="row">
              <button className="btn btn-solid btn-sm" disabled={busy} onClick={() => act(() => gw.client.approve(runId, 'once', typeof pendingApproval.request_id === 'string' ? pendingApproval.request_id : undefined), 'ok')}>Allow once</button>
              <button className="btn btn-line btn-sm" disabled={busy} onClick={() => act(() => gw.client.approve(runId, 'session', typeof pendingApproval.request_id === 'string' ? pendingApproval.request_id : undefined), 'ok')}>Always allow</button>
              <button className="btn btn-line btn-sm" disabled={busy} onClick={() => act(() => gw.client.approve(runId, 'deny', typeof pendingApproval.request_id === 'string' ? pendingApproval.request_id : undefined), 'ok')}>Deny</button>
            </div>
          </div>
        )}

        <div className="panel" style={{ marginTop: 18 }} aria-label="Execution timeline">
          {events.length === 0 && <p style={{ color: 'var(--mut)', fontSize: 14 }}>Waiting for execution events…</p>}
          {events.map((ev, i) => (
            <div key={i} className={`ev${ev.type.includes('tool') ? ' tool' : ''}${ev.type.includes('fail') || ev.type.includes('error') ? ' error' : ''}`}>
              <div className="t">{ev.type}</div>
              <div>{eventText(ev)}</div>
            </div>
          ))}
        </div>

        <div className="panel" style={{ marginTop: 14 }}>
          <div className="field">
            <label htmlFor="steer">Steer the run</label>
            <textarea id="steer" rows={2} value={steerText} onChange={(e) => setSteerText(e.target.value)} placeholder="Add direction mid-run…" />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-line btn-sm" disabled={!steerText.trim() || busy} onClick={() => act(() => gw.client.steer(runId, steerText.trim()), 'ok').then(() => setSteerText(''))}>Send steer</button>
            <button className="btn btn-line btn-sm" disabled={busy} onClick={() => act(() => gw.client.stop(runId), 'ok')}>Stop run</button>
          </div>
        </div>

        {artifacts.length > 0 && (
          <div className="panel" style={{ marginTop: 14 }} aria-label="Artifacts">
            <p className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--faint)' }}>ARTIFACTS</p>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {artifacts.map((a) => (
                <a key={a.id} className="btn btn-line btn-sm" style={{ justifyContent: 'flex-start' }} href={gw.client.artifactUrl(a.id)}>
                  {a.name || a.id}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
