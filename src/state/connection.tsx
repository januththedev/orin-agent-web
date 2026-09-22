import { useCallback, useEffect, useState } from 'react';
import { GatewayClient, type GatewayConfig } from '../api/gateway';

const KEY = 'orin-agent-web.gateway.v1';

export const DEFAULT_CONFIG: GatewayConfig = {
  baseUrl: 'http://127.0.0.1:8642',
  apiKey: '',
};

export function loadConfig(): GatewayConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    const p = JSON.parse(raw) as Partial<GatewayConfig>;
    return {
      baseUrl: typeof p.baseUrl === 'string' && p.baseUrl ? p.baseUrl : DEFAULT_CONFIG.baseUrl,
      apiKey: typeof p.apiKey === 'string' ? p.apiKey : '',
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export type ConnStatus = 'unknown' | 'checking' | 'online' | 'offline';

export function useGateway() {
  const [config, setConfigState] = useState<GatewayConfig>(loadConfig);
  const [status, setStatus] = useState<ConnStatus>('unknown');
  const [client, setClient] = useState(() => new GatewayClient(loadConfig()));

  const setConfig = useCallback((next: GatewayConfig) => {
    const clean = {
      baseUrl: next.baseUrl.trim().replace(/\/+$/, '') || DEFAULT_CONFIG.baseUrl,
      apiKey: next.apiKey.trim(),
    };
    setConfigState(clean);
    setClient(new GatewayClient(clean));
    try { localStorage.setItem(KEY, JSON.stringify(clean)); } catch { /* private mode */ }
  }, []);

  const check = useCallback(async () => {
    setStatus('checking');
    try {
      await client.health();
      setStatus('online');
      return true;
    } catch {
      setStatus('offline');
      return false;
    }
  }, [client]);

  useEffect(() => {
    let live = true;
    client.health().then(
      () => live && setStatus('online'),
      () => live && setStatus('offline'),
    );
    return () => { live = false; };
  }, [client]);

  return { config, setConfig, status, client, check };
}

export type Gateway = ReturnType<typeof useGateway>;
