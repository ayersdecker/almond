"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const ws_1 = __importDefault(require("ws"));
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};
function writeCors(response) {
    for (const [key, value] of Object.entries(corsHeaders)) {
        response.setHeader(key, value);
    }
}
async function verifyBearerToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing Bearer token');
    }
    const idToken = authHeader.slice('Bearer '.length).trim();
    const decoded = await (0, auth_1.getAuth)().verifyIdToken(idToken);
    return decoded.uid;
}
function extractText(message) {
    if (typeof message === 'string') {
        return message;
    }
    if (!message || typeof message !== 'object') {
        return '';
    }
    const asRecord = message;
    const direct = asRecord.content;
    if (typeof direct === 'string') {
        return direct;
    }
    if (Array.isArray(direct)) {
        return direct
            .map((item) => {
            if (!item || typeof item !== 'object')
                return '';
            const part = item;
            return typeof part.text === 'string' ? part.text : '';
        })
            .join('')
            .trim();
    }
    return '';
}
class GatewayClient {
    url;
    token;
    password;
    ws = null;
    pending = new Map();
    connected = false;
    runWaiters = new Map();
    constructor(url, token, password) {
        this.url = url;
        this.token = token;
        this.password = password;
    }
    async connect() {
        if (this.connected)
            return;
        await new Promise((resolve, reject) => {
            const ws = new ws_1.default(this.url);
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
                            id: 'clawdbot-control-ui',
                            version: '1.0.0',
                            platform: 'firebase-functions',
                            mode: 'webchat',
                            instanceId: `fn-${Date.now()}`,
                        },
                        role: 'operator',
                        scopes: ['operator.admin', 'operator.approvals', 'operator.pairing'],
                        caps: [],
                        auth: this.token || this.password
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
                }
                catch (error) {
                    reject(error instanceof Error ? error : new Error(String(error)));
                    ws.close();
                }
            });
            ws.on('message', (raw) => {
                const text = String(raw ?? '');
                let parsed;
                try {
                    parsed = JSON.parse(text);
                }
                catch {
                    return;
                }
                if (parsed.type === 'event') {
                    const eventName = parsed.event;
                    if (eventName === 'chat' && parsed.payload && typeof parsed.payload === 'object') {
                        const payload = parsed.payload;
                        const runId = typeof payload.runId === 'string' ? payload.runId : '';
                        const waiter = runId ? this.runWaiters.get(runId) : undefined;
                        if (waiter) {
                            const payloadSessionKey = typeof payload.sessionKey === 'string' ? payload.sessionKey : '';
                            if (!payloadSessionKey || payloadSessionKey === waiter.sessionKey) {
                                const message = payload.message;
                                const textContent = extractText(message);
                                if (textContent) {
                                    waiter.latestText = textContent;
                                }
                                const state = typeof payload.state === 'string' ? payload.state : '';
                                if (state === 'final') {
                                    clearTimeout(waiter.timeout);
                                    this.runWaiters.delete(runId);
                                    waiter.resolve(waiter.latestText || textContent || '');
                                }
                            }
                        }
                    }
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
                }
                else {
                    pending.reject(new Error(parsed.error?.message || 'Gateway request failed'));
                }
            });
            ws.on('error', (error) => {
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
                for (const [runId, waiter] of this.runWaiters.entries()) {
                    clearTimeout(waiter.timeout);
                    waiter.reject(new Error('Gateway websocket closed while waiting for chat response'));
                    this.runWaiters.delete(runId);
                }
            });
        });
    }
    waitForRunFinal(runId, sessionKey, timeoutMs = 20000) {
        if (!runId) {
            return Promise.reject(new Error('runId is required'));
        }
        const existing = this.runWaiters.get(runId);
        if (existing) {
            clearTimeout(existing.timeout);
            this.runWaiters.delete(runId);
        }
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.runWaiters.delete(runId);
                reject(new Error(`Timed out waiting for run ${runId}`));
            }, timeoutMs);
            this.runWaiters.set(runId, {
                sessionKey,
                resolve,
                reject,
                timeout,
                latestText: '',
            });
        });
    }
    request(method, params) {
        if (!this.ws || this.ws.readyState !== ws_1.default.OPEN) {
            return Promise.reject(new Error('Gateway not connected'));
        }
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const payload = {
            type: 'req',
            id,
            method,
            params,
        };
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`Gateway request timeout (${method})`));
            }, 20000);
            this.pending.set(id, { resolve, reject, timeout });
            this.ws.send(JSON.stringify(payload));
        });
    }
    close() {
        this.ws?.close();
        this.ws = null;
        this.connected = false;
        for (const [runId, waiter] of this.runWaiters.entries()) {
            clearTimeout(waiter.timeout);
            waiter.reject(new Error('Gateway client closed while waiting for run result'));
            this.runWaiters.delete(runId);
        }
    }
}
function getGatewayEnv() {
    const gatewayUrl = process.env.CLAWDBOT_GATEWAY_URL?.trim();
    const gatewayToken = process.env.CLAWDBOT_GATEWAY_TOKEN?.trim();
    const gatewayPassword = process.env.CLAWDBOT_GATEWAY_PASSWORD?.trim();
    const defaultSessionKey = process.env.CLAWDBOT_SESSION_KEY?.trim() || 'main';
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
exports.api = (0, https_1.onRequest)({
    region: 'us-central1',
    cors: false,
    secrets: ['CLAWDBOT_GATEWAY_URL', 'CLAWDBOT_GATEWAY_TOKEN', 'CLAWDBOT_SESSION_KEY'],
}, async (request, response) => {
    writeCors(response);
    if (request.method === 'OPTIONS') {
        response.status(204).send('');
        return;
    }
    try {
        await verifyBearerToken(request.header('authorization'));
    }
    catch (error) {
        response.status(401).json({ error: error instanceof Error ? error.message : 'Unauthorized' });
        return;
    }
    let env;
    try {
        env = getGatewayEnv();
    }
    catch (error) {
        response.status(500).json({ error: error instanceof Error ? error.message : 'Configuration error' });
        return;
    }
    const client = new GatewayClient(env.gatewayUrl, env.gatewayToken, env.gatewayPassword);
    try {
        await client.connect();
        const path = request.path || '/';
        if (request.method === 'GET' && path === '/api/status') {
            const status = (await client.request('status', {}));
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
            const body = (request.body || {});
            const content = typeof body.content === 'string' ? body.content.trim() : '';
            const sessionKey = typeof body.sessionKey === 'string' && body.sessionKey.trim()
                ? body.sessionKey.trim()
                : env.defaultSessionKey;
            if (!content) {
                response.status(400).json({ error: 'Message content is required' });
                return;
            }
            const baselineHistory = (await client.request('chat.history', {
                sessionKey,
                limit: 200,
            }));
            const baselineMessages = Array.isArray(baselineHistory.messages)
                ? baselineHistory.messages
                : [];
            const baselineLastAssistantText = (() => {
                for (let index = baselineMessages.length - 1; index >= 0; index -= 1) {
                    const item = baselineMessages[index];
                    const role = String(item.role || '').toLowerCase();
                    if (role !== 'assistant')
                        continue;
                    const text = extractText(item);
                    if (text)
                        return text;
                }
                return '';
            })();
            const idempotencyKey = `proxy-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const sendResult = (await client.request('chat.send', {
                sessionKey,
                message: content,
                deliver: false,
                idempotencyKey,
            }));
            const runId = typeof sendResult?.runId === 'string' && sendResult.runId.trim()
                ? sendResult.runId.trim()
                : idempotencyKey;
            const runResponsePromise = client.waitForRunFinal(runId, sessionKey, 20000);
            const startedAt = Date.now();
            let assistantText = '';
            while (!assistantText && Date.now() - startedAt < 20000) {
                if (!assistantText) {
                    try {
                        assistantText = await runResponsePromise;
                        if (assistantText) {
                            break;
                        }
                    }
                    catch {
                        // Fall back to history polling below
                    }
                }
                const history = (await client.request('chat.history', {
                    sessionKey,
                    limit: 200,
                }));
                const messages = Array.isArray(history.messages)
                    ? history.messages
                    : [];
                const hasNewMessages = messages.length > baselineMessages.length;
                for (let index = messages.length - 1; index >= 0; index -= 1) {
                    const item = messages[index];
                    const role = String(item.role || '').toLowerCase();
                    if (role !== 'assistant')
                        continue;
                    const messageRunId = typeof item.runId === 'string' ? item.runId : '';
                    if (messageRunId && messageRunId !== runId) {
                        continue;
                    }
                    const text = extractText(item);
                    if (!text) {
                        continue;
                    }
                    if (hasNewMessages || text !== baselineLastAssistantText) {
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
    }
    catch (error) {
        logger.error('Proxy error', error);
        response
            .status(500)
            .json({ error: error instanceof Error ? error.message : 'Internal proxy error' });
    }
    finally {
        client.close();
    }
});
