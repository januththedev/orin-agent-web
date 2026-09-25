import { useCallback, useEffect, useState } from 'react';
import { GatewayClient, type GatewayConfig } from '../api/gateway';

const KEY = 'orin-agent-web.gateway.v1';
export const DEFAULT_CONFIG: GatewayConfig = { baseUrl: 'http://127.0.0.1:8642', apiKey: '' };
function safeUrl(raw: string): string { const url = new URL(raw); const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname); if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) throw new Error('Gateway must use HTTPS or an explicit loopback HTTP URL.'); if (url.username || url.password || url.search || url.hash) throw new Error('Gateway URL cannot contain credentials, query, or hash.'); return url.toString().replace(/\/$/, ''); }
export function loadConfig(): GatewayConfig { try { const raw = sessionStorage.getItem(KEY); if (!raw) return DEFAULT_CONFIG; const parsed = JSON.parse(raw) as Partial<GatewayConfig>; return { baseUrl: typeof parsed.baseUrl === 'string' ? safeUrl(parsed.baseUrl) : DEFAULT_CONFIG.baseUrl, apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey.slice(0, 4096) : '' }; } catch { return DEFAULT_CONFIG; } }
export type ConnStatus = 'unknown' | 'checking' | 'online' | 'offline';
export function useGateway() {
  const [config, setConfigState] = useState<GatewayConfig>(loadConfig);
  const [status, setStatus] = useState<ConnStatus>('unknown');
  const [client, setClient] = useState(() => new GatewayClient(loadConfig()));
  const setConfig = useCallback((next: GatewayConfig) => { const clean = { baseUrl: safeUrl(next.baseUrl.trim()), apiKey: next.apiKey.trim().slice(0, 4096) }; setConfigState(clean); setClient(new GatewayClient(clean)); sessionStorage.setItem(KEY, JSON.stringify(clean)); }, []);
  const check = useCallback(async () => { setStatus('checking'); try { await client.health(); setStatus('online'); return true; } catch { setStatus('offline'); return false; } }, [client]);
  useEffect(() => { let live = true; client.health().then(() => live && setStatus('online'), () => live && setStatus('offline')); return () => { live = false; }; }, [client]);
  return { config, setConfig, status, client, check };
}
export type Gateway = ReturnType<typeof useGateway>;
