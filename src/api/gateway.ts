export class GatewayError extends Error {
  readonly status: number;
  constructor(status: number, message: string) { super(message); this.name = 'GatewayError'; this.status = status; }
}
export interface RunInfo { run_id: string; status: string; output?: string; error?: string | null; artifacts?: Array<{ id: string; name?: string }>; [key: string]: unknown; }
export interface RunEvent { type: string; [key: string]: unknown; }
export interface ApprovalRequest { request_id?: string; command?: string; description?: string; choices?: string[]; [key: string]: unknown; }
export interface SessionInfo { id?: string; session_id?: string; title?: string; updated_at?: string | number; [key: string]: unknown; }
export interface ChatMessage { role: string; content: string; }
function record(value: unknown): Record<string, unknown> { return value && typeof value === 'object' ? value as Record<string, unknown> : {}; }
function errorMessage(value: unknown, status: number): string { const body = record(value); const error = body.error; if (typeof error === 'string') return error; if (error && typeof error === 'object' && typeof (error as Record<string, unknown>).message === 'string') return String((error as Record<string, unknown>).message); if (typeof body.detail === 'string') return body.detail; return `HTTP ${status}`; }
function normalizeRun(value: unknown): RunInfo { const body = record(value); const runId = String(body.run_id ?? body.id ?? ''); if (!runId) throw new GatewayError(502, 'Gateway returned a malformed run.'); return { ...body, run_id: runId, status: String(body.status ?? 'unknown'), output: typeof body.output === 'string' ? body.output : undefined, error: typeof body.error === 'string' ? body.error : null, artifacts: Array.isArray(body.artifacts) ? body.artifacts.filter((item): item is { id: string; name?: string } => Boolean(record(item).id)).map((item) => ({ id: String(record(item).id), name: typeof record(item).name === 'string' ? String(record(item).name) : undefined })) : [] }; }
function normalizeEvent(value: unknown): RunEvent | null { const body = record(value); const name = typeof body.event === 'string' ? body.event : typeof body.type === 'string' ? body.type : ''; if (!name) return null; return { ...body, type: name.replace(/\./g, '_'), event: name }; }
export interface GatewayConfig { baseUrl: string; apiKey: string; }
export class GatewayClient {
  constructor(private cfg: GatewayConfig) {}
  private get base(): string { return this.cfg.baseUrl.replace(/\/+$/, ''); }
  private headers(extra: Record<string, string> = {}): Record<string, string> { return { 'Content-Type': 'application/json', ...(this.cfg.apiKey ? { Authorization: `Bearer ${this.cfg.apiKey}` } : {}), ...extra }; }
  private async raw(method: string, path: string, body?: unknown, signal?: AbortSignal, extraHeaders: Record<string, string> = {}): Promise<unknown> { let res: Response; try { res = await fetch(this.base + path, { method, signal, headers: this.headers(extraHeaders), body: body === undefined ? undefined : JSON.stringify(body) }); } catch (error) { throw new GatewayError(0, `Cannot reach the gateway at ${this.base}. Is the backend running? (${error instanceof Error ? error.message : 'network error'})`); } const text = await res.text().catch(() => ''); let json: unknown = null; try { json = text ? JSON.parse(text) : null; } catch { /* plain text */ } if (!res.ok) throw new GatewayError(res.status, errorMessage(json, res.status)); return json; }
  async health(): Promise<{ ok: boolean; version?: string; capabilities?: string[] }> { const body = record(await this.raw('GET', '/health/detailed')); if (body.status !== 'ok' && body.active !== true) throw new GatewayError(503, 'Gateway is not ready.'); return { ok: true, version: typeof body.version === 'string' ? body.version : undefined, capabilities: Array.isArray(body.capabilities) ? body.capabilities.filter((item): item is string => typeof item === 'string') : undefined }; }
  createRunIdempotent(input: string, key = crypto.randomUUID()): Promise<RunInfo> { return this.raw('POST', '/v1/runs', { input }, undefined, { 'Idempotency-Key': key }).then(normalizeRun); }
  getRun(runId: string, signal?: AbortSignal): Promise<RunInfo> { return this.raw('GET', `/v1/runs/${encodeURIComponent(runId)}`, undefined, signal).then(normalizeRun); }
  approve(runId: string, choice: 'once' | 'session' | 'always' | 'deny', requestId?: string): Promise<unknown> { return this.raw('POST', `/v1/runs/${encodeURIComponent(runId)}/approval`, { choice, ...(requestId ? { request_id: requestId } : {}) }); }
  steer(runId: string, text: string): Promise<unknown> { return this.raw('POST', `/v1/runs/${encodeURIComponent(runId)}/steer`, { text }); }
  stop(runId: string): Promise<unknown> { return this.raw('POST', `/v1/runs/${encodeURIComponent(runId)}/stop`, {}); }
  async sessions(): Promise<SessionInfo[]> { const value = await this.raw('GET', '/api/sessions'); const data: unknown[] = Array.isArray(record(value).data) ? record(value).data as unknown[] : []; return data.filter((item): item is SessionInfo => Boolean(record(item).id ?? record(item).session_id)); }
  async sessionMessages(sessionId: string): Promise<ChatMessage[]> { const value = await this.raw('GET', `/api/sessions/${encodeURIComponent(sessionId)}/messages`); const data: unknown[] = Array.isArray(record(value).data) ? record(value).data as unknown[] : []; return data.filter((item): item is ChatMessage => typeof record(item).role === 'string' && typeof record(item).content === 'string'); }
  skills(): Promise<unknown> { return this.raw('GET', '/v1/skills'); }
  async artifactBlob(artifactId: string, signal?: AbortSignal): Promise<Blob> { const response = await fetch(`${this.base}/v1/artifacts/download/${encodeURIComponent(artifactId)}`, { headers: this.cfg.apiKey ? { Authorization: `Bearer ${this.cfg.apiKey}` } : {}, signal }); if (!response.ok) throw new GatewayError(response.status, 'Artifact download failed.'); return response.blob(); }
  async *streamEvents(runId: string, signal?: AbortSignal): AsyncGenerator<RunEvent, void, void> {
    const response = await fetch(`${this.base}/v1/runs/${encodeURIComponent(runId)}/events`, { headers: this.cfg.apiKey ? { Authorization: `Bearer ${this.cfg.apiKey}` } : {}, signal });
    if (!response.ok || !response.body) throw new GatewayError(response.status, 'Event stream unavailable.');
    const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
    try {
      for (;;) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const frames = buffer.split(/\r?\n\r?\n/); buffer = frames.pop() ?? '';
        for (const frame of frames) {
          const data = frame.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
          if (!data) continue;
          if (data === '[DONE]') return;
          try { const event = normalizeEvent(JSON.parse(data)); if (event) yield event; } catch { /* heartbeat */ }
        }
        if (done) break;
      }
      if (buffer.trim()) {
        const data = buffer.split(/\r?\n/).find((line) => line.startsWith('data:'))?.slice(5).trim();
        if (data && data !== '[DONE]') { try { const event = normalizeEvent(JSON.parse(data)); if (event) yield event; } catch { /* ignore */ } }
      }
    } finally { reader.releaseLock(); }
  }
}
