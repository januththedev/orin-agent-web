import { describe, expect, it, vi } from 'vitest';
import { GatewayClient } from '../../src/api/gateway';

describe('Agent gateway contract', () => {
  it('normalizes health and run responses', async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      if (String(url).endsWith('/health/detailed')) return new Response(JSON.stringify({ status: 'ok', version: 'local' }), { status: 200, headers: { 'content-type': 'application/json' } });
      if (String(url).endsWith('/v1/runs')) { expect(init?.headers).toMatchObject({ 'Idempotency-Key': expect.any(String) }); return new Response(JSON.stringify({ run_id: 'run_1', status: 'queued', output: '' }), { status: 200 }); }
      throw new Error('unexpected URL');
    });
    vi.stubGlobal('fetch', fetchMock);
    const client = new GatewayClient({ baseUrl: 'http://127.0.0.1:8642', apiKey: 'key' });
    expect((await client.health()).version).toBe('local');
    expect((await client.createRunIdempotent('do work')).run_id).toBe('run_1');
  });

  it('parses event field, data sessions, and final output', async () => {
    const body = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"event":"run.started","preview":"thinking"}\n\ndata: {"event":"run.completed","output":"done"}\n\ndata: [DONE]\n\n')); controller.close(); } });
    vi.stubGlobal('fetch', vi.fn(async (url: string | URL) => String(url).includes('/events') ? new Response(body, { status: 200 }) : new Response(JSON.stringify({ data: [{ id: 'session_1', title: 'Session' }] }), { status: 200 })));
    const client = new GatewayClient({ baseUrl: 'http://127.0.0.1:8642', apiKey: 'key' });
    const events = []; for await (const event of client.streamEvents('run_1')) events.push(event);
    expect(events.map((event) => event.type)).toEqual(['run_started', 'run_completed']);
    expect((await client.sessions())[0].id).toBe('session_1');
  });

  it('keeps credentials out of localStorage and rejects remote HTTP', async () => {
    const source = await import('../../src/state/connection');
    expect(source.loadConfig).toBeTypeOf('function');
    const text = await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../../src/state/connection.tsx', import.meta.url), 'utf8'));
    expect(text).toContain('sessionStorage');
    expect(text).not.toContain('localStorage');
    expect(text).toContain("protocol !== 'https:'");
  });
});
