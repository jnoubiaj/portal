// CapitalQuest GHL API Proxy Server
// ──────────────────────────────────
// Accepts requests from admin.html and proxies them to GHL API.
// Eliminates CORS issues — GHL never sees browser origin.
// API key travels only in server-to-server calls.
//
// Usage:  node ghl-server.mjs
// Port:   3001  (static files stay on 3002 via serve.mjs)
//
// Config (optional — server also accepts key/location via headers):
//   Create ghl-config.json: { "apiKey": "pit-...", "locationId": "OZdx..." }
//   OR set env vars: GHL_API_KEY, GHL_LOCATION_ID
//   OR frontend sends:  X-GHL-Api-Key and X-GHL-Location-Id headers

import https from 'https';
import http  from 'http';
import fs    from 'fs';
import path  from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GHL_BASE  = 'https://services.leadconnectorhq.com';
const GHL_VER   = '2021-07-28';
const PORT      = parseInt(process.env.PORT || '3001');

// ── Config ────────────────────────────────────────────────────────────────────
let _cfg = {};
const cfgPath = path.join(__dirname, 'ghl-config.json');
try {
  if (fs.existsSync(cfgPath)) {
    _cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    console.log('[Config] Loaded ghl-config.json');
  }
} catch(e) { console.warn('[Config] Could not parse ghl-config.json:', e.message); }

function resolveKey(reqHeaders) {
  return reqHeaders['x-ghl-api-key'] || process.env.GHL_API_KEY || _cfg.apiKey || '';
}
function resolveLocId(reqHeaders) {
  return reqHeaders['x-ghl-location-id'] || process.env.GHL_LOCATION_ID || _cfg.locationId || '';
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve) => {
    let d = '';
    req.on('data', c => d += c);
    req.on('end', () => {
      try   { resolve(d ? JSON.parse(d) : null); }
      catch (e) { resolve(null); }
    });
  });
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type':   'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function setCors(res, origin) {
  // Allow any localhost origin (3000, 3002, file://)
  const allowed = origin && (
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1') ||
    origin === 'null'   // file:// shows as null
  ) ? origin : '*';
  res.setHeader('Access-Control-Allow-Origin',  allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',
    'Content-Type,Authorization,Version,X-GHL-Api-Key,X-GHL-Location-Id');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
}

// ── GHL API Forwarder ─────────────────────────────────────────────────────────
function ghlRequest(method, ghlPath, apiKey, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(GHL_BASE + ghlPath);
    const hdrs = {
      'Authorization': 'Bearer ' + apiKey,
      'Version':       GHL_VER,
      'Content-Type':  'application/json',
    };
    const bodyStr = (body && method !== 'GET') ? JSON.stringify(body) : null;
    if (bodyStr) hdrs['Content-Length'] = Buffer.byteLength(bodyStr);

    const startMs = Date.now();
    const opts = {
      hostname: u.hostname,
      path:     u.pathname + u.search,
      method,
      headers:  hdrs,
    };

    const req = https.request(opts, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        const ms = Date.now() - startMs;
        let parsed;
        try   { parsed = JSON.parse(d); }
        catch (e) { parsed = { _raw: d.substring(0, 500) }; }

        const logKeys = Object.keys(parsed).filter(k => k !== '_raw').join(', ') || '(empty)';
        if (r.statusCode >= 200 && r.statusCode < 300) {
          console.log(`[GHL ✓] ${method} ${u.pathname} → ${r.statusCode} (${ms}ms) keys:${logKeys}`);
        } else {
          const errMsg = parsed.message || parsed.msg || parsed.error || d.substring(0, 200);
          console.warn(`[GHL ✗] ${method} ${u.pathname} → ${r.statusCode} (${ms}ms): ${errMsg}`);
        }
        resolve({ status: r.statusCode, data: parsed });
      });
    });

    req.on('error', (e) => {
      console.error(`[GHL ERR] ${method} ${u.pathname}:`, e.message);
      reject(e);
    });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── Test Mode ─────────────────────────────────────────────────────────────────
function testModeResponse(method, ghlPath, body) {
  const fakeId = 'test_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  if (ghlPath.includes('/conversations/messages')) {
    return {
      _testMode: true,
      id: fakeId,
      messageId: fakeId,
      conversationId: (body && body.conversationId) || 'conv_test',
      status: 'sent',
      type: (body && body.type) || 'SMS',
      message: body && body.message,
      dateAdded: new Date().toISOString(),
    };
  }
  if (ghlPath.includes('/contacts/') && ghlPath.includes('/notes')) {
    return { _testMode: true, note: { id: fakeId, body: body && body.body } };
  }
  return { _testMode: true, ok: true, id: fakeId };
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateSendSms(body) {
  const errs = [];
  if (!body.contactId && !body.toPhone)     errs.push('Missing contactId or toPhone');
  if (!body.message && !body.text)           errs.push('Missing message');
  if (!body.fromPhone && !body.from)         errs.push('Missing fromPhone (outbound SMS number)');
  return errs;
}
function validateSendEmail(body) {
  const errs = [];
  if (!body.contactId && !body.toEmail)     errs.push('Missing contactId or toEmail');
  if (!body.subject)                         errs.push('Missing email subject');
  if (!body.html && !body.body && !body.text) errs.push('Missing email body');
  if (!body.fromEmail && !body.from)         errs.push('Missing fromEmail (outbound email address)');
  return errs;
}

// ── Main Request Handler ───────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  setCors(res, origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl  = new URL(req.url, `http://localhost:${PORT}`);
  const reqPath = reqUrl.pathname;
  const apiKey  = resolveKey(req.headers);
  const locId   = resolveLocId(req.headers);

  // ── Health / Status ───────────────────────────────────────────────────────
  if (reqPath === '/health' || reqPath === '/api/ghl/health') {
    return sendJson(res, 200, {
      ok:          true,
      configured:  !!apiKey,
      locationId:  locId ? locId.substring(0, 6) + '…' : '(not set)',
      apiKeyPrefix:apiKey ? apiKey.substring(0, 8) + '…' : '(not set)',
      port:        PORT,
      ts:          Date.now(),
    });
  }

  if (reqPath === '/api/ghl/status') {
    return sendJson(res, 200, {
      configured:  !!apiKey,
      locationId:  locId || '(not set)',
      apiKeyPrefix:apiKey ? apiKey.substring(0, 12) + '…' : '(not set)',
      source:      apiKey
        ? (req.headers['x-ghl-api-key'] ? 'request-header' : process.env.GHL_API_KEY ? 'env-var' : 'ghl-config.json')
        : 'unconfigured',
    });
  }

  // ── Data Cache endpoints (used by scheduler to read task/client data) ────────
  const TASKS_CACHE   = path.join(__dirname, 'tasks-cache.json');
  const CLIENTS_CACHE = path.join(__dirname, 'clients-cache.json');

  if (reqPath === '/api/data/tasks' && method === 'GET') {
    try {
      const data = fs.existsSync(TASKS_CACHE) ? JSON.parse(fs.readFileSync(TASKS_CACHE, 'utf8')) : {};
      return sendJson(res, 200, data);
    } catch(e) { return sendJson(res, 500, { error: e.message }); }
  }

  if (reqPath === '/api/data/tasks' && method === 'POST') {
    try {
      const body = await readBody(req);
      if (!body || !body.clientId) return sendJson(res, 400, { error: 'Missing clientId' });
      const existing = fs.existsSync(TASKS_CACHE) ? JSON.parse(fs.readFileSync(TASKS_CACHE, 'utf8')) : {};
      existing[body.clientId] = body.tasks || [];
      fs.writeFileSync(TASKS_CACHE, JSON.stringify(existing), 'utf8');
      return sendJson(res, 200, { ok: true });
    } catch(e) { return sendJson(res, 500, { error: e.message }); }
  }

  if (reqPath === '/api/data/clients' && method === 'GET') {
    try {
      const data = fs.existsSync(CLIENTS_CACHE) ? JSON.parse(fs.readFileSync(CLIENTS_CACHE, 'utf8')) : [];
      return sendJson(res, 200, data);
    } catch(e) { return sendJson(res, 500, { error: e.message }); }
  }

  if (reqPath === '/api/data/clients' && method === 'POST') {
    try {
      const body = await readBody(req);
      if (!Array.isArray(body)) return sendJson(res, 400, { error: 'Body must be an array' });
      fs.writeFileSync(CLIENTS_CACHE, JSON.stringify(body), 'utf8');
      return sendJson(res, 200, { ok: true, count: body.length });
    } catch(e) { return sendJson(res, 500, { error: e.message }); }
  }

  if (reqPath === '/api/data/scheduler-config' && method === 'GET') {
    try {
      const cfgFile = path.join(__dirname, 'scheduler-config.json');
      const data = fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, 'utf8')) : {};
      // Redact sensitive fields before sending to browser
      const safe = JSON.parse(JSON.stringify(data));
      if (safe.email) { safe.email.pass = safe.email.pass ? '••••••••' : ''; }
      if (safe.sms)   { safe.sms.authToken = safe.sms.authToken ? '••••••••' : ''; }
      return sendJson(res, 200, safe);
    } catch(e) { return sendJson(res, 500, { error: e.message }); }
  }

  if (reqPath === '/api/data/scheduler-config' && method === 'POST') {
    try {
      const body = await readBody(req);
      if (!body) return sendJson(res, 400, { error: 'Empty body' });
      const cfgFile = path.join(__dirname, 'scheduler-config.json');
      // Merge: keep existing sensitive fields if browser sent placeholder
      let existing = {};
      if (fs.existsSync(cfgFile)) existing = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
      if (body.email && body.email.pass === '••••••••') body.email.pass = existing?.email?.pass || '';
      if (body.sms && body.sms.authToken === '••••••••') body.sms.authToken = existing?.sms?.authToken || '';
      const merged = Object.assign({}, existing, body);
      fs.writeFileSync(cfgFile, JSON.stringify(merged, null, 2), 'utf8');
      return sendJson(res, 200, { ok: true });
    } catch(e) { return sendJson(res, 500, { error: e.message }); }
  }

  // ── Must start with /api/ghl/ ─────────────────────────────────────────────
  if (!reqPath.startsWith('/api/ghl/')) {
    return sendJson(res, 404, { error: 'Not found. Valid prefix: /api/ghl/' });
  }

  if (!apiKey) {
    return sendJson(res, 503, {
      error: 'GHL API key not configured.',
      instructions: [
        '1. Create ghl-config.json: { "apiKey": "pit-...", "locationId": "OZdx..." }',
        '2. Restart ghl-server.mjs',
        '   OR send X-GHL-Api-Key header from the frontend',
      ],
    });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const method = req.method;
  const body   = (method === 'POST' || method === 'PUT' || method === 'PATCH')
               ? await readBody(req)
               : null;

  const isTestMode = (body && body._testMode === true) ||
                     reqUrl.searchParams.get('testMode') === '1';

  // ── Strip prefix → GHL path ───────────────────────────────────────────────
  let ghlPath = reqPath.replace('/api/ghl', '');
  const qs = reqUrl.search || '';

  // ── High-level send-sms shortcut ──────────────────────────────────────────
  // POST /api/ghl/send-sms — validated, logged, structured
  if (reqPath === '/api/ghl/send-sms' && method === 'POST') {
    if (!body) return sendJson(res, 400, { error: 'Request body required' });

    const errs = validateSendSms(body);
    if (errs.length) return sendJson(res, 400, { error: 'Validation failed', issues: errs });

    const fromPhone = body.fromPhone || body.from;
    const message   = body.message   || body.text;
    const convId    = body.conversationId;

    console.log(`[Send SMS] to:${body.contactId} | from:${fromPhone} | msg:"${message.substring(0,40)}..."`);

    if (isTestMode) {
      console.log('[Send SMS] TEST MODE — simulated send');
      return sendJson(res, 200, testModeResponse('POST', '/conversations/messages', {
        type: 'SMS', contactId: body.contactId, message, from: fromPhone,
      }));
    }

    const ghlBody = {
      type:          'SMS',
      contactId:     body.contactId || body.ghlContactId,
      message,
      phone:         fromPhone,
    };
    if (convId) ghlBody.conversationId = convId;

    try {
      const { status, data } = await ghlRequest('POST', '/conversations/messages', apiKey, ghlBody);
      if (status >= 200 && status < 300) {
        return sendJson(res, 200, { ok: true, messageId: data.messageId || data.id, raw: data });
      }
      const errMsg = data.message || data.msg || data.error || 'GHL rejected the request';
      return sendJson(res, status, {
        error: errMsg,
        ghlStatus: status,
        detail: data,
        hint: status === 401 ? 'Invalid API key — check Settings → GHL'
            : status === 403 ? 'API key lacks Conversation Write permission'
            : status === 404 ? 'Contact not found — verify ghlContactId'
            : status === 422 ? 'Invalid payload — check from phone number format'
            : null,
      });
    } catch(e) {
      return sendJson(res, 500, { error: 'Network error: ' + e.message });
    }
  }

  // ── High-level send-email shortcut ────────────────────────────────────────
  // POST /api/ghl/send-email — validated, logged, structured
  if (reqPath === '/api/ghl/send-email' && method === 'POST') {
    if (!body) return sendJson(res, 400, { error: 'Request body required' });

    const errs = validateSendEmail(body);
    if (errs.length) return sendJson(res, 400, { error: 'Validation failed', issues: errs });

    const fromEmail = body.fromEmail || body.from;
    const toEmail   = body.toEmail   || body.to;
    const htmlBody  = body.html      || body.body || body.text;
    const convId    = body.conversationId;

    console.log(`[Send Email] to:${body.contactId} | from:${fromEmail} | subj:"${body.subject}"`);

    if (isTestMode) {
      console.log('[Send Email] TEST MODE — simulated send');
      return sendJson(res, 200, testModeResponse('POST', '/conversations/messages', {
        type: 'Email', contactId: body.contactId, subject: body.subject,
      }));
    }

    const ghlBody = {
      type:         'Email',
      contactId:    body.contactId || body.ghlContactId,
      subject:      body.subject,
      html:         htmlBody,
      from:         fromEmail,
    };
    if (toEmail)  ghlBody.to         = toEmail;
    if (convId)   ghlBody.conversationId = convId;

    try {
      const { status, data } = await ghlRequest('POST', '/conversations/messages', apiKey, ghlBody);
      if (status >= 200 && status < 300) {
        return sendJson(res, 200, { ok: true, messageId: data.messageId || data.id, raw: data });
      }
      const errMsg = data.message || data.msg || data.error || 'GHL rejected the request';
      return sendJson(res, status, {
        error: errMsg,
        ghlStatus: status,
        detail: data,
        hint: status === 401 ? 'Invalid API key'
            : status === 403 ? 'API key lacks Email permission'
            : status === 404 ? 'Contact not found'
            : null,
      });
    } catch(e) {
      return sendJson(res, 500, { error: 'Network error: ' + e.message });
    }
  }

  // ── Generic GHL proxy ─────────────────────────────────────────────────────
  // Any other /api/ghl/* — strip prefix and forward 1:1 to GHL
  if (!ghlPath) ghlPath = '/';
  const fullGhlPath = ghlPath + qs;

  console.log(`[Proxy] ${method} ${fullGhlPath}${isTestMode ? ' [TEST]' : ''}`);

  if (isTestMode) {
    return sendJson(res, 200, testModeResponse(method, fullGhlPath, body || {}));
  }

  try {
    const { status, data } = await ghlRequest(method, fullGhlPath, apiKey, body);
    sendJson(res, status, data);
  } catch(e) {
    sendJson(res, 500, { error: e.message, path: fullGhlPath });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const apiKey = resolveKey({});
  const locId  = resolveLocId({});
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║  CapitalQuest GHL Proxy  — Port ' + PORT + '   ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  if (apiKey) {
    console.log('  API Key:    ' + apiKey.substring(0, 12) + '…  ✓');
    console.log('  Location:   ' + (locId || '(set via X-GHL-Location-Id header)'));
  } else {
    console.log('  ⚠  No API key — frontend must send X-GHL-Api-Key header');
    console.log('     OR create ghl-config.json with {"apiKey":"pit-...", "locationId":"OZdx..."}');
  }
  console.log('');
  console.log('  Routes:');
  console.log('  POST /api/ghl/send-sms    — send SMS (validated)');
  console.log('  POST /api/ghl/send-email  — send email (validated)');
  console.log('  GET  /api/ghl/*           — any GHL GET endpoint');
  console.log('  GET  /health              — health check');
  console.log('');
  console.log('  Add ?testMode=1 or body._testMode=true to simulate without sending');
  console.log('');
});
