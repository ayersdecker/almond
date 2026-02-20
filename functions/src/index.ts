import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import WebSocket from 'ws';
import type { Response } from 'express';

if (getApps().length === 0) {
  initializeApp();
}

type GatewayReq = {
  type: 'req';
  id: string;
  method: string;
  params: Record<string, unknown>;
};

type GatewayRes = {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: { message?: string };
};

type GatewayEvent = {
  type: 'event';
  name?: string;
  payload?: unknown;
  seq?: number;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

function writeCors(response: Response) {
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.setHeader(key, value);
  }
}

async function verifyBearerToken(authHeader?: string): Promise<string> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing Bearer token');
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  const decoded = await getAuth().verifyIdToken(idToken);
  return decoded.uid;
}

function extractText(message: unknown): string {
  if (typeof message === 'string') {
    return message;
  }

  if (!message || typeof message !== 'object') {
    return '';
  }

  const asRecord = message as Record<string, unknown>;
  const direct = asRecord.content;

  if (typeof direct === 'string') {
    return direct;
  }

  if (Array.isArray(direct)) {
    return direct
      .map((item) => {
        if (!item || typeof item !== 'object') return '';
        const part = item as Record<string, unknown>;
        return typeof part.text === 'string' ? part.text : '';
      })
      .join('')
      .trim();
  }

  return '';
}

class GatewayClient {
  private ws: WebSocket | null = null;
  private pending = new Map<
    string,
    {
      resolve: (payload: unknown) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  private connected = false;

  constructor(
    private readonly url: string,
    private readonly token?: string,
    private readonly password?: string
  ) {}

  async connect(): Promise<void> {
    if (this.connected) return;

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;

      const openTimeout = setTimeout(() => {
        reject(new Error('Gateway websocket connect timeout'));
        ws.close();
      }, 8000);

      ws.on('open', async () => {
        clearTimeout(openTimeout);
        try {
          await this.request('connect', {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: 'almond-proxy',
              version: '1.0.0',
              platform: 'firebase-functions',
              mode: 'backend',
              instanceId: `fn-${Date.now()}`,
            },
            role: 'operator',
            scopes: ['operator.admin', 'operator.approvals', 'operator.pairing'],
            caps: [],
            auth:
              this.token || this.password
                ? {
                    token: this.token,
                    password: this.password,
                  }
                : undefined,
            userAgent: 'almond-proxy',
            locale: 'en-US',
          });
          this.connected = true;
          resolve();
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
          ws.close();
        }
      });

      ws.on('message', (raw: WebSocket.RawData) => {
        const text = String(raw ?? '');
        let parsed: GatewayRes | GatewayEvent;

        try {
          parsed = JSON.parse(text) as GatewayRes | GatewayEvent;
        } catch {
          return;
        }

        if (parsed.type !== 'res') {
          return;
        }

        const pending = this.pending.get(parsed.id);
        if (!pending) {
          return;
        }

        clearTimeout(pending.timeout);
        this.pending.delete(parsed.id);

        if (parsed.ok) {
          pending.resolve(parsed.payload);
        } else {
          pending.reject(new Error(parsed.error?.message || 'Gateway request failed'));
        }
      });

      ws.on('error', (error: Error) => {
        clearTimeout(openTimeout);
        reject(error instanceof Error ? error : new Error('Gateway websocket error'));
      });

      ws.on('close', () => {
        this.connected = false;
        for (const [id, item] of this.pending.entries()) {
          clearTimeout(item.timeout);
          item.reject(new Error('Gateway websocket closed'));
          this.pending.delete(id);
        }
      });
    });
  }

  request(method: string, params: Record<string, unknown>): Promise<unknown> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('Gateway not connected'));
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const payload: GatewayReq = {
      type: 'req',
      id,
      method,
      params,
    };

    return new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Gateway request timeout (${method})`));
      }, 20000);

      this.pending.set(id, { resolve, reject, timeout });
      this.ws!.send(JSON.stringify(payload));
    });
  }

  close() {
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }
}

function getGatewayEnv() {
  const gatewayUrl = process.env.CLAWDBOT_GATEWAY_URL;
  const gatewayToken = process.env.CLAWDBOT_GATEWAY_TOKEN;
  const gatewayPassword = process.env.CLAWDBOT_GATEWAY_PASSWORD;
  const defaultSessionKey = process.env.CLAWDBOT_SESSION_KEY || 'main';

  if (!gatewayUrl) {
    throw new Error('CLAWDBOT_GATEWAY_URL is not set in Functions environment');
  }

  return {
    gatewayUrl,
    gatewayToken,
    gatewayPassword,
    defaultSessionKey,
  };
}

export const api = onRequest({ region: 'us-central1', cors: false }, async (request, response) => {
  writeCors(response);

  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  try {
    await verifyBearerToken(request.header('authorization'));
  } catch (error) {
    response.status(401).json({ error: error instanceof Error ? error.message : 'Unauthorized' });
    return;
  }

  let env;
  try {
    env = getGatewayEnv();
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Configuration error' });
    return;
  }

  const client = new GatewayClient(env.gatewayUrl, env.gatewayToken, env.gatewayPassword);

  try {
    await client.connect();

    const path = request.path || '/';

    if (request.method === 'GET' && path === '/api/status') {
      const status = (await client.request('status', {})) as Record<string, unknown>;
      response.json({
        model: status.model || 'unknown',
        uptime: status.uptime || 0,
        tokens_used: status.tokens_used || status.tokensUsed || 0,
        response_time: status.response_time || status.responseTime || 0,
        session_key: env.defaultSessionKey,
      });
      return;
    }

    if (request.method === 'GET' && path === '/api/memory') {
      response.json({ files: [] });
      return;
    }

    if (request.method === 'POST' && path === '/api/message') {
      const body = (request.body || {}) as Record<string, unknown>;
      const content = typeof body.content === 'string' ? body.content.trim() : '';
      const sessionKey =
        typeof body.sessionKey === 'string' && body.sessionKey.trim()
          ? body.sessionKey.trim()
          : env.defaultSessionKey;

      if (!content) {
        response.status(400).json({ error: 'Message content is required' });
        return;
      }

      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      await client.request('chat.send', {
        sessionKey,
        message: content,
        deliver: false,
        idempotencyKey,
      });

      const startedAt = Date.now();
      let assistantText = '';

      while (!assistantText && Date.now() - startedAt < 20000) {
        const history = (await client.request('chat.history', {
          sessionKey,
          limit: 40,
        })) as Record<string, unknown>;

        const messages = Array.isArray(history.messages)
          ? (history.messages as Array<Record<string, unknown>>)
          : [];

        for (let index = messages.length - 1; index >= 0; index -= 1) {
          const item = messages[index];
          const role = String(item.role || '').toLowerCase();
          if (role !== 'assistant') continue;

          const text = extractText(item);
          if (text) {
            assistantText = text;
            break;
          }
        }

        if (!assistantText) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      response.json({
        message_id: idempotencyKey,
        content: assistantText || 'No assistant response yet. Please retry.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    response.status(404).json({ error: `Unsupported route: ${request.method} ${path}` });
  } catch (error) {
    logger.error('Proxy error', error);
    response
      .status(500)
      .json({ error: error instanceof Error ? error.message : 'Internal proxy error' });
  } finally {
    client.close();
  }
});
