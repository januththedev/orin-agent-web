/**
 * Typed client for the Orin Agent gateway REST API (local backend).
 * No `any` leaks: unknown payloads are validated at the boundary.
 * Docs: #/docs in-app.
 */

export class GatewayError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'GatewayError';
    this.status = status;
  }
}

export interface RunInfo {
  run_id: string;
  status: string;
  [key: string]: unknown;
}

export interface RunEvent {
  type: string;
  [key: string]: unknown;
}

export interface ApprovalRequest {
  request_id?: string;
  tool?: string;
  action?: string;
  reason?: string;
  [key: string]: unknown;
}

export interface SessionInfo {
  id?: string;
  session_id?: string;
  title?: string;
  updated_at?: string | number;
  [key: string]: unknown;
}

export interface ChatMessage {
  role: string;
  content: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export interface GatewayConfig {
  baseUrl: string;
  apiKey: string;
}

export class GatewayClient {
  constructor(private cfg: GatewayConfig) {}

  private get base(): string {
    return this.cfg.baseUrl.replace(/\/+$/, '');
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(this.cfg.apiKey ? { Authorization: `Bearer ${this.cfg.apiKey}` } : {}),
      ...extra,
    };
  }

  private async request<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    let res: Response;
    try {
      res = await fetch(this.base + path, {
        method,
        signal,
        headers: this.headers(),
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (e) {
      throw new GatewayError(0, `Cannot reach the gateway at ${this.base}. Is the backend running? (${e instanceof Error ? e.message : 'network error'})`);
    }
    const text = await res.text().catch(() => '');
    let json: unknown = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* plain text body */ }
    if (!res.ok) {
      const msg = isRecord(json) && typeof json.error === 'string' ? json.error
        : isRecord(json) && typeof json.detail === 'string' ? json.detail
        : text.slice(0, 200) || `HTTP ${res.status}`;
      throw new GatewayError(res.status, msg);
    }
    return json as T;
  }

  health(): Promise<{ ok: boolean }> {
    return this.request('GET', '/health');
  }

  /** Create a run with an auto Idempotency-Key (safe retries, no duplicates). */
  createRunIdempotent(input: string): Promise<RunInfo> {
    const key = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return this.rawCreateRun(input, key);
  }

  private async rawCreateRun(input: string, key: string): Promise<RunInfo> {
    let res: Response;
    try {
      res = await fetch(this.base + '/v1/runs', {
        method: 'POST',
        headers: { ...this.headers(), 'Idempotency-Key': key },
        body: JSON.stringify({ input }),
      });
    } catch (e) {
      throw new GatewayError(0, `Cannot reach the gateway. (${e instanceof Error ? e.message : 'network error'})`);
    }
    const json = (await res.json().catch(() => null)) as RunInfo | null;
    if (!res.ok) throw new GatewayError(res.status, 'Run creation failed.');
    if (!json || typeof json.run_id !== 'string') throw new GatewayError(502, 'Gateway returned a malformed run.');
    return json;
  }

  getRun(runId: string, signal?: AbortSignal): Promise<RunInfo> {
    return this.request('GET', `/v1/runs/${encodeURIComponent(runId)}`, undefined, signal);
  }

  approve(runId: string, choice: 'once' | 'session' | 'always' | 'deny', requestId?: string): Promise<unknown> {
    return this.request('POST', `/v1/runs/${encodeURIComponent(runId)}/approval`, {
      choice, ...(requestId ? { request_id: requestId } : {}),
    });
  }

  steer(runId: string, text: string): Promise<unknown> {
    return this.request('POST', `/v1/runs/${encodeURIComponent(runId)}/steer`, { text });
  }

  stop(runId: string): Promise<unknown> {
    return this.request('POST', `/v1/runs/${encodeURIComponent(runId)}/stop`, {});
  }

  sessions(): Promise<{ sessions: SessionInfo[] }> {
    return this.request('GET', '/api/sessions');
  }

  sessionMessages(sessionId: string): Promise<{ messages: ChatMessage[] }> {
    return this.request('GET', `/api/sessions/${encodeURIComponent(sessionId)}/messages`);
  }

  skills(): Promise<unknown> {
    return this.request('GET', '/v1/skills');
  }

  artifactUrl(artifactId: string): string {
    return `${this.base}/v1/artifacts/download/${encodeURIComponent(artifactId)}`;
  }

  /** SSE event stream for a run. Yields parsed events; ends on [DONE] or close. */
  async *streamEvents(runId: string, signal?: AbortSignal): AsyncGenerator<RunEvent, void, void> {
    let res: Response;
    try {
      res = await fetch(this.base + `/v1/runs/${encodeURIComponent(runId)}/events`, {
        headers: this.cfg.apiKey ? { Authorization: `Bearer ${this.cfg.apiKey}` } : {},
        signal,
      });
    } catch (e) {
      throw new GatewayError(0, `Event stream failed. (${e instanceof Error ? e.message : 'network error'})`);
    }
    if (!res.ok || !res.body) throw new GatewayError(res.status, 'Event stream unavailable.');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data:')) continue;
        const data = t.slice(5).trim();
        if (data === '[DONE]') return;
        try {
          const ev = JSON.parse(data) as RunEvent;
          if (ev && typeof ev.type === 'string') yield ev;
        } catch { /* heartbeat/comment */ }
      }
    }
  }
}
