// ── GoHighLevel Integration Layer — CapitalQuest Admin Portal ────────────────
// Provides a unified GHL.* API for all integration needs.
// API: GHL v2 (services.leadconnectorhq.com)
// Proxy: ghl-server.mjs on localhost:3001 — eliminates CORS, keeps key server-side
// Contact search: also proxied via Cloudflare Worker (ghl-proxy.sam-e5a.workers.dev)
// ─────────────────────────────────────────────────────────────────────────────

window.GHL = (function () {

  const API        = 'https://services.leadconnectorhq.com';
  const PROXY      = 'https://ghl-proxy.sam-e5a.workers.dev';  // Cloudflare (contact search)
  const LOCAL_PROXY_BASE = 'http://localhost:3001';            // local Node proxy (dev only)
  const VER        = '2021-07-28';

  // ── PROXY RESOLUTION ─────────────────────────────────────────────────────
  // Resolution order (each only used when reachable):
  //   1. Railway URL from admin's GHL Settings (localStorage.cq_scheduler_remote_url)
  //      — REQUIRED for production use because the browser can't reach
  //        localhost:3001 from a real domain AND can't call GHL directly
  //        (CORS). Without this, every Send via GHL fails with the generic
  //        "Message send failed — check sync log".
  //   2. Local Node proxy at localhost:3001 — dev path.
  //   3. Direct GHL API — last resort, will hit CORS in a browser.
  //
  // _proxyReady caches the resolved BASE URL (the part before /api/ghl) so
  // every subsequent call uses the same proxy. Pass force=true to re-check
  // after the admin pastes a new Railway URL.
  let _proxyReady = null;     // null=unchecked, false=no proxy, string=base URL
  let _proxyCheckedAt = 0;
  function _getRailwayProxyBase() {
    try {
      const u = (localStorage.getItem('cq_scheduler_remote_url') || '').trim();
      return u && /^https?:\/\//.test(u) ? u.replace(/\/+$/, '') : '';
    } catch(e) { return ''; }
  }
  async function _pingHealth(base) {
    try {
      const ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      const timer = ctl ? setTimeout(function() { ctl.abort(); }, 2500) : null;
      const r = await fetch(base + '/api/ghl/health', ctl ? { method: 'GET', signal: ctl.signal } : { method: 'GET' });
      if (timer) clearTimeout(timer);
      return r.ok ? base : '';
    } catch(e) { return ''; }
  }
  async function _checkProxy(force) {
    // Re-check at most every 60s unless forced.
    if (!force && _proxyReady !== null && (Date.now() - _proxyCheckedAt) < 60000) return _proxyReady;
    _proxyReady = null;
    const railway = _getRailwayProxyBase();
    if (railway) {
      const ok = await _pingHealth(railway);
      if (ok) {
        _proxyReady = ok;
        _proxyCheckedAt = Date.now();
        console.log('[GHL] Proxy: ✓ Railway (' + ok + ')');
        if (typeof window !== 'undefined') window._ghlProxyReady = _proxyReady;
        return _proxyReady;
      }
    }
    // Fallback to localhost (dev). Only reachable when the page itself is
    // also on http://localhost or running via file:// in a permissive context.
    const local = await _pingHealth(LOCAL_PROXY_BASE);
    _proxyReady = local || false;
    _proxyCheckedAt = Date.now();
    console.log('[GHL] Proxy:', _proxyReady ? '✓ localhost' : '✗ none (will hit CORS on direct API)');
    if (typeof window !== 'undefined') window._ghlProxyReady = _proxyReady;
    return _proxyReady;
  }
  // Backward-compat alias for the rest of the file — wherever LOCAL_PROXY
  // was used, we now look up the resolved proxy base + '/api/ghl'.
  function _proxyUrlForPath(path) {
    const base = (typeof _proxyReady === 'string' && _proxyReady) ? _proxyReady : LOCAL_PROXY_BASE;
    if (path && path.startsWith('/')) return base + '/api/ghl' + path;
    return base + '/api/ghl' + (path ? '/' + path : '');
  }
  // Constant kept for any legacy references. New code should call _proxyUrlForPath.
  const LOCAL_PROXY = LOCAL_PROXY_BASE + '/api/ghl';
  // Expose a manual re-check so the Settings 'Check Connection' button can
  // refresh after the admin pastes a new Railway URL.
  if (typeof window !== 'undefined') {
    window._ghlReCheckProxy = function() { return _checkProxy(true); };
  }

  // Expose so admin.html can show proxy status without re-checking
  function isProxyReady() { return _proxyReady === true; }

  // Reset proxy check (called after server starts or settings change)
  function resetProxyCheck() { _proxyReady = null; }

  // ── SETTINGS ────────────────────────────────────────────────────────────
  function getSettings () {
    try {
      const s = JSON.parse(localStorage.getItem('cq_ghl_settings') || '{}');
      // Fall through to window constants (hardcoded in admin.html) as defaults
      return {
        apiKey:          s.apiKey          || window.GHL_API_KEY      || '',
        locationId:      s.locationId      || window.GHL_LOCATION_ID  || '',
        pipelineName:    s.pipelineName    || 'Portal Pipeline',
        syncStages:      s.syncStages      !== false,
        syncNotes:       s.syncNotes       !== false,
        syncTasks:       s.syncTasks       !== false,
        syncMessages:    s.syncMessages    !== false,
        overdueTaskSMS:  s.overdueTaskSMS  !== false,
        overdueTaskEmail:s.overdueTaskEmail!== false,
        autoSyncSec:          s.autoSyncSec          || 30,
        defaultUser:          s.defaultUser          || '',
        fromNumber:           s.fromNumber           || '',
        defaultSmsNumber:     s.defaultSmsNumber     || s.fromNumber || '',
        defaultEmailAddress:  s.defaultEmailAddress  || '',
        enabled:              s.enabled              !== false,
        testMode:             s.testMode             === true,
        useProxy:             s.useProxy             !== false,   // default ON when proxy available
      };
    } catch (e) {
      return { apiKey: window.GHL_API_KEY || '', locationId: window.GHL_LOCATION_ID || '', enabled: true };
    }
  }

  function saveSettings (s) {
    try { localStorage.setItem('cq_ghl_settings', JSON.stringify(s)); } catch (e) {}
    if (typeof db !== 'undefined') {
      db.collection('ghlSettings').doc('config').set(s).catch(() => {});
    }
    _pipelineCache = null; // bust cache on settings change
  }

  function _hdrs () {
    return {
      'Authorization': 'Bearer ' + getSettings().apiKey,
      'Version': VER,
      'Content-Type': 'application/json',
    };
  }

  // ── SYNC LOG ────────────────────────────────────────────────────────────
  let _log = [];
  try { _log = JSON.parse(localStorage.getItem('cq_ghl_log') || '[]'); } catch (e) {}

  // Module-scoped buffer of the last failure detail — so generic "Send
  // failed" alerts can include the underlying cause (CORS, 401, no proxy
  // configured, etc) instead of telling the admin to "check the sync log".
  let _lastApiError = '';
  function _setLastApiError (msg) { _lastApiError = String(msg || '').substring(0, 400); }
  function getLastApiError () { return _lastApiError; }

  function _logSync (type, ok, detail) {
    const e = { type, ok, detail: (detail || '').substring(0, 200), ts: Date.now() };
    _log.unshift(e);
    if (_log.length > 300) _log.length = 300;
    try { localStorage.setItem('cq_ghl_log', JSON.stringify(_log.slice(0, 100))); } catch (err) {}
    _setBadge(!ok);
    if (!ok) _setLastApiError(detail);
    return e;
  }

  function getSyncLog () { return _log; }

  // ── STATUS BADGE ────────────────────────────────────────────────────────
  let _badgeErr = false;
  function _setBadge (isErr) {
    const b = document.getElementById('ghl-sync-badge');
    if (!b) return;
    if (isErr) {
      _badgeErr = true;
      b.style.background = '#ef4444';
      b.title = 'GHL sync error — click for log';
    } else if (!_badgeErr) {
      b.style.background = '#10b981';
      b.title = 'GHL synced · ' + new Date().toLocaleTimeString();
    }
    b.style.display = 'inline-flex';
  }
  function clearBadgeError () { _badgeErr = false; _setBadge(false); }

  // ── RETRY QUEUE ─────────────────────────────────────────────────────────
  function _getQueue ()    { try { return JSON.parse(localStorage.getItem('cq_ghl_queue') || '[]'); } catch (e) { return []; } }
  function _saveQueue (q)  { try { localStorage.setItem('cq_ghl_queue', JSON.stringify(q.slice(0, 200))); } catch (e) {} }
  function _enqueue (item) {
    const q = _getQueue();
    q.push({ ...item, id: item.id || ('q_' + Date.now()), addedAt: Date.now(), attempts: 0 });
    _saveQueue(q);
  }
  function _dequeue (id)   { _saveQueue(_getQueue().filter(i => i.id !== id)); }
  function getRetryQueue () { return _getQueue(); }

  // ── CORE FETCH ──────────────────────────────────────────────────────────
  // Routes through local proxy (localhost:3001) when available — eliminates CORS.
  // Falls back to direct GHL API call if proxy is not running.
  async function _fetch (method, path, body, retryItem) {
    const s = getSettings();
    if (!s.enabled) return null;

    // Test mode: inject _testMode flag into POST/PUT bodies — proxy returns fake success
    if (s.testMode && body && (method === 'POST' || method === 'PUT')) {
      body = Object.assign({}, body, { _testMode: true });
    }

    // Determine URL: proxy (preferred — Railway in prod, localhost in dev) or direct
    const useProxy = s.useProxy !== false && !!(await _checkProxy());
    let url;
    if (useProxy) {
      url = path.startsWith('http') ? path : _proxyUrlForPath(path);
    } else {
      url = path.startsWith('http') ? path : API + path;
    }

    console.log('[GHL API →]', method, url,
      useProxy ? '[proxy]' : '[direct]',
      s.testMode ? '[TEST]' : '',
      '| apiKey:', s.apiKey ? s.apiKey.substring(0,12)+'…' : '(none)');

    try {
      const hdrs = _hdrs();
      // When using proxy: forward key + locationId as headers (proxy reads these)
      if (useProxy) {
        hdrs['X-GHL-Api-Key']      = s.apiKey;
        hdrs['X-GHL-Location-Id']  = s.locationId;
      }
      const opts = { method, headers: hdrs };
      if (body && method !== 'GET') opts.body = JSON.stringify(body);
      const res = await fetch(url, opts);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = method + ' ' + path + ' → ' + res.status
          + ' ' + (data.message || data.msg || data.error || res.statusText);
        console.warn('[GHL API ✗]', res.status, url, '| body:', data);
        _logSync('api', false, errMsg);
        if (retryItem) _enqueue(retryItem);
        return null;
      }

      console.log('[GHL API ✓]', res.status, url, '| keys:', Object.keys(data));
      _logSync('api', true, method + ' ' + path + (s.testMode ? ' [TEST]' : ''));
      return data;
    } catch (e) {
      const isCors = !useProxy && e.name === 'TypeError';
      console.error('[GHL API ✗]', method, url, '| error:', e.message,
        isCors ? '⚠ CORS error — start ghl-server.mjs to fix' : '');
      _logSync('api', false, method + ' ' + path + ': ' + e.message + (isCors ? ' [CORS — run ghl-server.mjs]' : ''));
      if (retryItem) _enqueue(retryItem);
      return null;
    }
  }

  // ── CONTACT OPERATIONS ──────────────────────────────────────────────────

  async function searchContacts (query) {
    try {
      const r = await fetch(PROXY + '/?query=' + encodeURIComponent(query));
      const d = await r.json();
      return d.contacts || d.data || [];
    } catch (e) {
      const { locationId } = getSettings();
      const d = await _fetch('GET', '/contacts/?locationId=' + locationId + '&query=' + encodeURIComponent(query) + '&limit=20');
      return d?.contacts || [];
    }
  }

  async function getContact (contactId) {
    const d = await _fetch('GET', '/contacts/' + contactId);
    const contact = d?.contact || null;
    try {
      if (contact && localStorage.getItem('cq_ghl_quiet') !== '1') {
        const cf = contact.customFields || contact.customField || [];
        console.groupCollapsed('[GHL] getContact raw response — ' + cf.length + ' customFields');
        console.log('contact keys:', Object.keys(contact));
        console.log('standard fields:', {
          firstName: contact.firstName, lastName: contact.lastName,
          email: contact.email, phone: contact.phone,
          address1: contact.address1, city: contact.city,
          state: contact.state, postalCode: contact.postalCode,
          companyName: contact.companyName, dateOfBirth: contact.dateOfBirth
        });
        if (cf.length) {
          console.log('customFields:');
          cf.forEach(f => console.log('  ', f.id || '-', '=', JSON.stringify(f.value).slice(0, 80), f.fieldKey || '-'));
        } else {
          console.warn('customFields is empty — GHL returned no custom field values on this contact.');
        }
        console.log('full contact:', contact);
        console.groupEnd();
      }
    } catch (e) {}
    return contact;
  }

  async function createContact (data) {
    const { locationId } = getSettings();
    const d = await _fetch('POST', '/contacts/', { locationId, ...data });
    return d?.contact || null;
  }

  async function updateContact (contactId, data, quiet) {
    const d = await _fetch('PUT', '/contacts/' + contactId, data,
      quiet ? null : { id: 'uc_' + contactId, type: 'update_contact', contactId, payload: data });
    return d?.contact || null;
  }

  async function lookupContact (email, phone) {
    const { locationId } = getSettings();
    if (email) {
      const d = await _fetch('GET', '/contacts/?locationId=' + locationId + '&email=' + encodeURIComponent(email) + '&limit=1');
      if (d?.contacts?.[0]) return d.contacts[0];
    }
    if (phone) {
      const e164 = _e164(phone);
      if (e164) {
        const d = await _fetch('GET', '/contacts/?locationId=' + locationId + '&phone=' + encodeURIComponent(e164) + '&limit=1');
        if (d?.contacts?.[0]) return d.contacts[0];
      }
    }
    return null;
  }

  // Returns ALL GHL contacts that have the given email address. GHL allows
  // duplicates (test contacts, multiple sign-ups with the same email, etc.)
  // and the original form-submission contact may not be the same record
  // that the portal first matched. Caller usually wants to aggregate
  // form submissions and customFields across every match.
  //
  // Tries several endpoint shapes because GHL has tightened the
  // `/contacts/?email=X&limit=N` endpoint to limit=1 in some locations
  // (returns 422 Unprocessable Entity for limit>1). Falls through
  // gracefully:
  //   1. /contacts/?query=email&limit=N  (broad query, multi-result)
  //   2. /contacts/search (POST body, V2 API)
  //   3. /contacts/?email=X (no limit)        — single-result default
  //   4. /contacts/?email=X&limit=1           — explicit single match
  // First successful response wins. Returns [] on any cascading failure.
  async function lookupContactsByEmail (email, limit) {
    if (!email) return [];
    const { locationId } = getSettings();
    const lim = Math.min(limit || 10, 25);
    const enc = encodeURIComponent(email);

    // Attempt 1: query param (broad match, accepts higher limit on most locations)
    try {
      const d = await _fetch('GET', '/contacts/?locationId=' + locationId + '&query=' + enc + '&limit=' + lim);
      const arr = (d && d.contacts) || [];
      if (arr.length) {
        return arr.filter(c => {
          const e = (c.email || '').toLowerCase();
          return e === email.toLowerCase();
        });
      }
    } catch (e) { /* fall through */ }

    // Attempt 2: V2 search endpoint (POST body)
    try {
      const d = await _fetch('POST', '/contacts/search', {
        locationId: locationId,
        pageLimit: lim,
        filters: [{ field: 'email', operator: 'eq', value: email }]
      });
      const arr = (d && (d.contacts || d.results)) || [];
      if (arr.length) return arr;
    } catch (e) { /* fall through */ }

    // Attempt 3: bare email query (no limit param)
    try {
      const d = await _fetch('GET', '/contacts/?locationId=' + locationId + '&email=' + enc);
      const arr = (d && d.contacts) || [];
      if (arr.length) return arr;
    } catch (e) { /* fall through */ }

    // Attempt 4: explicit single match (the original lookupContact path)
    try {
      const d = await _fetch('GET', '/contacts/?locationId=' + locationId + '&email=' + enc + '&limit=1');
      return (d && d.contacts) || [];
    } catch (e) {
      return [];
    }
  }

  async function importAllContacts (onProgress) {
    const { locationId } = getSettings();
    let page = 1, all = [], total = null;
    while (true) {
      const d = await _fetch('GET', '/contacts/?locationId=' + locationId + '&limit=100&page=' + page);
      if (!d?.contacts?.length) break;
      all = all.concat(d.contacts);
      if (total === null) total = d.meta?.total || d.contacts.length;
      if (onProgress) onProgress(all.length, total);
      if (d.contacts.length < 100 || all.length >= total) break;
      page++;
    }
    return all;
  }

  // ── PIPELINE / OPPORTUNITY ───────────────────────────────────────────────

  let _pipelineCache = null;

  async function getPipeline () {
    if (_pipelineCache) return _pipelineCache;
    const { locationId, pipelineName } = getSettings();
    const d = await _fetch('GET', '/opportunities/pipelines?locationId=' + locationId);
    if (!d?.pipelines) return null;
    const name = pipelineName.toLowerCase();
    _pipelineCache = d.pipelines.find(p => p.name.toLowerCase().includes(name)) || d.pipelines[0];
    _logSync('pipeline', true, 'Loaded: ' + (_pipelineCache?.name || 'none'));
    return _pipelineCache;
  }

  function _matchStage (pipeline, stageName) {
    if (!pipeline?.stages) return null;
    const n = (stageName || '').toLowerCase();
    return pipeline.stages.find(s => s.name.toLowerCase() === n)
        || pipeline.stages.find(s => s.name.toLowerCase().includes(n.split(' ')[0]))
        || null;
  }

  async function findOpportunity (contactId) {
    const { locationId } = getSettings();
    const pl = await getPipeline();
    if (!pl) return null;
    const d = await _fetch('GET', '/opportunities/search?location_id=' + locationId + '&contact_id=' + contactId + '&pipeline_id=' + pl.id);
    return d?.opportunities?.[0] || null;
  }

  async function createOpportunity (contactId, stageName, name) {
    const { locationId } = getSettings();
    const pl = await getPipeline();
    if (!pl) return null;
    const stage = _matchStage(pl, stageName) || pl.stages?.[0];
    const d = await _fetch('POST', '/opportunities/', {
      pipelineId: pl.id,
      locationId,
      name: name + ' — Portal Client',
      contactId,
      pipelineStageId: stage?.id,
      status: 'open',
    });
    return d?.opportunity || null;
  }

  async function updateOpportunityStage (oppId, stageName) {
    const pl = await getPipeline();
    if (!pl) return null;
    const stage = _matchStage(pl, stageName);
    if (!stage) { _logSync('stage', false, 'Stage not found in GHL: ' + stageName); return null; }
    const d = await _fetch('PUT', '/opportunities/' + oppId, { pipelineStageId: stage.id },
      { id: 'os_' + oppId, type: 'update_stage', oppId, stageName });
    return d;
  }

  // ── CONVERSATION / MESSAGING ─────────────────────────────────────────────

  async function getConversation (contactId) {
    const { locationId } = getSettings();
    const d = await _fetch('GET', '/conversations/?locationId=' + locationId + '&contactId=' + contactId + '&limit=1');
    return d?.conversations?.[0] || null;
  }

  async function loadMessages (contactId) {
    const conv = await getConversation(contactId);
    if (!conv) return [];
    const d = await _fetch('GET', '/conversations/' + conv.id + '/messages?limit=100');
    const msgs = d?.messages || [];
    try { localStorage.setItem('cq_ghl_msgs_' + contactId, JSON.stringify({ msgs, ts: Date.now(), convId: conv.id })); } catch (e) {}
    return msgs;
  }

  function getCachedMessages (contactId) {
    try { return JSON.parse(localStorage.getItem('cq_ghl_msgs_' + contactId) || 'null'); } catch (e) { return null; }
  }

  // sendMessage: type = 'SMS' | 'Email'
  // fromChannel: outbound phone number (SMS) or email address (Email)
  // emailSubject: subject line (Email only)
  async function sendMessage (contactId, text, type, fromChannel, emailSubject) {
    type = type || 'SMS';
    const s = getSettings();
    let convId = null;
    try { convId = JSON.parse(localStorage.getItem('cq_ghl_msgs_' + contactId) || '{}').convId; } catch (e) {}

    const body = { type, contactId, message: text };
    if (convId) body.conversationId = convId;

    if (type === 'SMS') {
      // Resolve outbound number: param → settings → fallback
      const fromNum = fromChannel
        || s.defaultSmsNumber
        || s.fromNumber
        || '';
      if (fromNum) body.phone = fromNum;
      console.log('[GHL sendMessage] SMS | from:', fromNum || '(none)', '| to contactId:', contactId);
    } else if (type === 'Email') {
      const fromAddr = fromChannel || s.defaultEmailAddress || '';
      if (fromAddr)    body.from    = fromAddr;
      if (emailSubject) body.subject = emailSubject;
      // If body has html content (email), use html field
      body.html = text;
      console.log('[GHL sendMessage] Email | from:', fromAddr || '(none)', '| subj:', emailSubject || '(none)');
    }

    // When proxy is running, use the validated shortcut endpoints.
    // proxyBase = Railway URL (prod) OR localhost (dev) OR false.
    const proxyBase = await _checkProxy();
    if (proxyBase) {
      const endpoint = type === 'SMS' ? '/api/ghl/send-sms' : '/api/ghl/send-email';
      const payload  = type === 'SMS'
        ? { contactId, message: text, fromPhone: body.phone, conversationId: convId || undefined,
            _testMode: s.testMode || undefined }
        : { contactId, subject: body.subject || emailSubject, html: text, body: text,
            fromEmail: body.from, conversationId: convId || undefined,
            _testMode: s.testMode || undefined };
      console.log('[GHL sendMessage] Using proxy shortcut:', proxyBase + endpoint);
      const res = await fetch(proxyBase + endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-GHL-Api-Key': s.apiKey, 'X-GHL-Location-Id': s.locationId },
        body:    JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = d.error || d.message || 'Send failed (' + res.status + ')';
        const hint   = d.hint ? '\n' + d.hint : '';
        throw new Error(errMsg + hint);
      }
      _logSync('message', true, type + ' sent to contact ' + contactId + (s.testMode ? ' [TEST]' : ''));
      return d;
    }

    // No proxy available — try the direct GHL API. This will fail with CORS
    // when called from a browser on a real domain. Surface the underlying
    // sync-log entry instead of the generic "Message send failed" so the
    // admin knows whether to paste a Railway URL or run the local proxy.
    const d = await _fetch('POST', '/conversations/messages', body,
      { id: 'sm_' + contactId + '_' + Date.now(), type: 'send_message', contactId, text });
    if (!d) {
      const isProd = (typeof location !== 'undefined' && location.protocol === 'https:'
                       && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1');
      const railwaySet = !!_getRailwayProxyBase();
      let hint = '';
      if (isProd && !railwaySet) {
        hint = '\n\nNo Railway proxy URL is set. Open Settings → GoHighLevel → Cloud Deployment (Railway) and paste your Railway Worker URL, then click Check Connection.';
      } else if (isProd && railwaySet) {
        hint = '\n\nRailway URL is set but the proxy did not respond. Open Settings → Check Connection — if it shows red, the Railway app may be sleeping or down.';
      } else {
        hint = '\n\nNo local proxy detected. Run `node worker.mjs` in the portal folder, or paste a Railway Worker URL in Settings → GoHighLevel.';
      }
      // Surface the underlying _fetch failure too (CORS, 401, 400, network).
      // _logSync already captured it into _lastApiError when the call failed.
      const last = getLastApiError();
      const underlying = last ? ('\n\nUnderlying error:\n' + last) : '';
      throw new Error('GHL message send failed.' + hint + underlying);
    }
    _logSync('message', !!d, type + ' sent to contact ' + contactId);
    return d;
  }

  // ── CALLING ─────────────────────────────────────────────────────────────

  async function initiateCall (contactId, toPhone) {
    const { fromNumber } = getSettings();
    const d = await _fetch('POST', '/calls/', {
      contactId,
      toNumber: _e164(toPhone),
      fromNumber: fromNumber || undefined,
    }, { id: 'call_' + Date.now(), type: 'call', contactId });
    _logSync('call', !!d, 'Outbound call to ' + toPhone);
    return d;
  }

  async function logCall (contactId, outcome, duration, notes, recordingUrl) {
    const lines = [
      '📞 ' + outcome,
      duration ? 'Duration: ' + duration : '',
      notes || '',
      recordingUrl ? 'Recording: ' + recordingUrl : '',
    ].filter(Boolean).join('\n');
    await addNote(contactId, lines);
    _logSync('call', true, 'Call logged: ' + outcome);
  }

  // ── NOTES ────────────────────────────────────────────────────────────────

  async function getContactNotes (contactId) {
    const d = await _fetch('GET', '/contacts/' + contactId + '/notes');
    return d?.notes || [];
  }

  async function addNote (contactId, body) {
    const d = await _fetch('POST', '/contacts/' + contactId + '/notes', { body },
      { id: 'note_' + contactId + '_' + Date.now(), type: 'add_note', contactId, body });
    _logSync('note', !!d, 'Note added for ' + contactId);
    return d?.note || null;
  }

  // ── TASKS ────────────────────────────────────────────────────────────────

  async function createTask (contactId, title, dueDate, notes) {
    const body = { title, body: notes || '', status: 'incompleted' };
    if (dueDate) body.dueDate = new Date(dueDate).toISOString();
    const d = await _fetch('POST', '/contacts/' + contactId + '/tasks', body,
      { id: 'task_' + contactId + '_' + Date.now(), type: 'create_task', contactId, title });
    _logSync('task', !!d, 'Task created: ' + title);
    return d?.task || null;
  }

  async function updateTask (contactId, taskId, updates) {
    const d = await _fetch('PUT', '/contacts/' + contactId + '/tasks/' + taskId, updates,
      { id: 'uptask_' + taskId, type: 'update_task', contactId, taskId });
    return d?.task || null;
  }

  // ── FORM DATA / CUSTOM FIELDS ────────────────────────────────────────────

  async function getCustomFieldDefs () {
    const { locationId } = getSettings();
    // Try the canonical custom-fields endpoint first.
    let defs = [];
    try {
      const d = await _fetch('GET', '/custom-fields/?locationId=' + locationId);
      defs = d?.customFields || d?.fields || [];
      try {
        if (localStorage.getItem('cq_ghl_quiet') !== '1') {
          console.log('[GHL] /custom-fields/ →', defs.length, 'definitions');
          if (defs.length) console.log('  sample def:', defs[0]);
        }
      } catch (e) {}
    } catch (e) {
      console.warn('[GHL] /custom-fields/ failed:', e.message);
    }
    // Fallback: V2 LeadConnector uses /locations/{id}/customFields
    if (!defs.length) {
      try {
        const d2 = await _fetch('GET', '/locations/' + locationId + '/customFields');
        defs = d2?.customFields || d2?.fields || [];
        try {
          if (localStorage.getItem('cq_ghl_quiet') !== '1') {
            console.log('[GHL] /locations/{id}/customFields →', defs.length, 'definitions');
          }
        } catch (e) {}
      } catch (e) {
        console.warn('[GHL] /locations/{id}/customFields failed:', e.message);
      }
    }
    if (!defs.length) {
      console.warn('[GHL] No custom-field definitions returned. Custom field values on the contact will only resolve by UUID, not by fieldKey or label — the resolver fuzzy-name match will fail for ALL custom fields. Check that the API key has read-access to custom fields, or paste the location custom-field list manually into localStorage.cq_ghl_field_defs.');
    }
    return defs;
  }

  async function getContactFormSubmissions (contactId) {
    const { locationId } = getSettings();
    const all = [];
    // Try the canonical Forms endpoint first.
    try {
      const d = await _fetch('GET', '/forms/submissions?locationId=' + locationId + '&contactId=' + contactId + '&limit=50');
      const subs = (d && (d.submissions || d.formSubmissions)) || [];
      subs.forEach(s => { all.push(Object.assign({ _source: 'form' }, s)); });
      try {
        if (localStorage.getItem('cq_ghl_quiet') !== '1') {
          console.log('[GHL] forms/submissions →', subs.length, 'submission(s)', subs.length ? subs : '');
        }
      } catch (e) {}
    } catch (e) {
      console.warn('[GHL] forms/submissions failed:', e.message);
    }
    // Also try the Surveys endpoint — GHL's newer "onboarding" / multi-step
    // form builder stores submissions there, not under /forms.
    try {
      const d2 = await _fetch('GET', '/surveys/submissions?locationId=' + locationId + '&contactId=' + contactId + '&limit=50');
      const subs2 = (d2 && (d2.submissions || d2.surveySubmissions)) || [];
      subs2.forEach(s => { all.push(Object.assign({ _source: 'survey' }, s)); });
      try {
        if (localStorage.getItem('cq_ghl_quiet') !== '1') {
          console.log('[GHL] surveys/submissions →', subs2.length, 'submission(s)', subs2.length ? subs2 : '');
        }
      } catch (e) {}
    } catch (e) {
      // Surveys endpoint may not be enabled on the location — non-fatal.
      console.warn('[GHL] surveys/submissions failed (may not be enabled):', e.message);
    }
    // Also try the Documents/Proposals endpoint — GHL's Documents & Contracts
    // product stores completed-document field values here, not under /forms
    // or /surveys. Requires the `documents.readonly` scope on the integration
    // and Documents/Proposals enabled on the location.
    try {
      const d3 = await _fetch('GET', '/documents/?locationId=' + locationId + '&contactId=' + contactId + '&limit=50');
      const docs = (d3 && (d3.documents || d3.proposals)) || [];
      docs.forEach(doc => {
        // Each completed document has filled-in field values in either
        // `fields`, `data`, or `formFields` depending on GHL version.
        const subLike = {
          _source: 'document',
          _documentId: doc.id || doc._id,
          _documentName: doc.name || doc.title,
          _status: doc.status,
          formFields: doc.fields || doc.formFields || doc.data || []
        };
        all.push(subLike);
      });
      try {
        if (localStorage.getItem('cq_ghl_quiet') !== '1') {
          console.log('[GHL] documents/ →', docs.length, 'document(s)', docs.length ? docs : '');
        }
      } catch (e) {}
    } catch (e) {
      // Documents endpoint typically requires a separate scope. Non-fatal —
      // many integrations don't have it enabled.
      console.warn('[GHL] documents/ failed (likely missing documents.readonly scope or feature not enabled):', e.message);
    }
    return all;
  }

  function _buildFieldDefsMap (defs) {
    const map = {};
    (defs || []).forEach(f => {
      const name = (f.name || f.fieldKey || '').toLowerCase().trim();
      // GHL exposes the merge-tag-friendly slug as `fieldKey` (e.g.
      // "contact.business_name" or just "business_name"). Strip the
      // "contact." prefix when present so merge-tag matching is uniform.
      let fk = (f.fieldKey || '').trim();
      const cleanKey = fk.replace(/^contact\./, '').toLowerCase();
      map[f.id] = {
        id: f.id,
        name,                 // normalized label (lowercase, trimmed)
        orig: f.name,         // original label (display)
        fieldKey: cleanKey,   // internal slug (machine name)
        mergeTag: cleanKey    // GHL merge tags use the fieldKey slug
      };
    });

    // Manual override: allow admin to paste a custom-field-definitions
    // JSON blob into localStorage when the GHL API doesn't return defs.
    // Shape: { [uuid]: { name, fieldKey } } or array of GHL def objects.
    try {
      const raw = localStorage.getItem('cq_ghl_field_defs');
      if (raw) {
        const extra = JSON.parse(raw);
        if (Array.isArray(extra)) {
          extra.forEach(f => {
            if (f && f.id) {
              const fk = (f.fieldKey || '').replace(/^contact\./, '').toLowerCase();
              map[f.id] = {
                id: f.id,
                name: (f.name || f.fieldKey || '').toLowerCase().trim(),
                orig: f.name,
                fieldKey: fk,
                mergeTag: fk
              };
            }
          });
        } else if (extra && typeof extra === 'object') {
          Object.keys(extra).forEach(id => {
            const f = extra[id];
            const fk = (f.fieldKey || f.key || '').replace(/^contact\./, '').toLowerCase();
            map[id] = {
              id: id,
              name: (f.name || f.label || f.fieldKey || '').toLowerCase().trim(),
              orig: f.name || f.label,
              fieldKey: fk,
              mergeTag: fk
            };
          });
        }
      }
    } catch (e) {}

    return map;
  }

  // Diagnostic: how many of the contact's customField entries actually
  // resolved against the defs map? Anything unresolved becomes a raw-UUID
  // entry the resolver can't match without an explicit override.
  function _logCustomFieldCoverage (contact, fieldDefsMap) {
    try {
      if (localStorage.getItem('cq_ghl_quiet') === '1') return;
      const cf = contact.customFields || contact.customField || [];
      const defCount = Object.keys(fieldDefsMap).length;
      const resolved = cf.filter(x => fieldDefsMap[x.id]);
      const unresolved = cf.filter(x => !fieldDefsMap[x.id]);
      console.log(
        '[GHL] custom-field coverage: ' + resolved.length + '/' + cf.length +
        ' contact values matched (' + defCount + ' defs in map, ' + unresolved.length + ' unresolved)'
      );
      if (unresolved.length) {
        console.groupCollapsed('[GHL] ' + unresolved.length + ' unresolved customField IDs (no def found — values are raw UUIDs to the resolver)');
        unresolved.forEach(x => console.log('  ', x.id, '=', JSON.stringify(x.value).slice(0, 60)));
        console.log('Add these manually via localStorage.cq_ghl_field_defs as:');
        console.log('  { "<uuid>": { "name": "Display Name", "fieldKey": "machine_slug" }, ... }');
        console.groupEnd();
      }
    } catch (e) {}
  }

  // Parsed shape (back-compat):
  //   - Flat keys (name → value) are still populated so existing callers
  //     that read e.g. parsedFields['business name'] keep working.
  //   - A non-enumerable _entries array carries the FULL identifier
  //     metadata for every value:
  //       { id, fieldKey, mergeTag, name, value, source }
  //     Use this for id/key/tag-based matching (more reliable than name).
  function _parseGhlFields (contact, fieldDefsMap, formSubmissions) {
    const result  = {};
    const entries = [];
    const seen    = {}; // by composite key, prevents dup entries

    function pushEntry (e) {
      if (e.value == null || e.value === '') return;
      const key = (e.id || '') + '|' + (e.fieldKey || '') + '|' + (e.name || '');
      if (seen[key]) return;
      seen[key] = true;
      entries.push(e);
      if (e.name) result[e.name] = e.value;
    }

    // 1. Standard contact fields (always present on the contact object).
    // GHL stores DOB as a top-level contact field (dateOfBirth), NOT a
    // custom field — it would never show up via customFields[] and was
    // why imports left the portal's dob input empty even after the
    // overall import worked.
    const STD = [
      ['firstName',    'first name',    'first_name',     contact.firstName],
      ['lastName',     'last name',     'last_name',      contact.lastName],
      ['email',        'email',         'email',          contact.email],
      ['phone',        'phone',         'phone',          contact.phone],
      ['dateOfBirth',  'date of birth', 'date_of_birth',  contact.dateOfBirth],
      ['address1',     'address',       'address1',       contact.address1],
      ['city',         'city',          'city',           contact.city],
      ['state',        'state',         'state',          contact.state],
      ['postalCode',   'zip',           'postal_code',    contact.postalCode],
      ['companyName',  'company name',  'company_name',   contact.companyName]
    ];
    STD.forEach(row => {
      pushEntry({
        id:       null,
        fieldKey: row[2],
        mergeTag: row[2],
        name:     row[1],
        value:    row[3],
        source:   'standard'
      });
    });

    // 2. Custom fields from contact object
    const customFields = contact.customFields || contact.customField || [];
    customFields.forEach(cf => {
      const def = fieldDefsMap[cf.id] || null;
      const fk  = (def && def.fieldKey) || (cf.fieldKey || '').replace(/^contact\./, '').toLowerCase();
      const name = (def && def.name) || ((cf.fieldKey || cf.id || '').toLowerCase().replace(/_/g, ' ').trim());
      pushEntry({
        id:       cf.id || null,
        fieldKey: fk,
        mergeTag: fk,
        name:     name,
        value:    cf.value,
        source:   'contact_custom'
      });
    });

    // 3. Form submission fields — GHL returns data in multiple formats
    (formSubmissions || []).forEach(sub => {
      const rawData = sub.formFields || sub.data;
      if (Array.isArray(rawData)) {
        rawData.forEach(ff => {
          const def  = fieldDefsMap[ff.id] || fieldDefsMap[ff.fieldId] || null;
          const fk   = (def && def.fieldKey) || (ff.fieldKey || '').replace(/^contact\./, '').toLowerCase();
          const name = (def && def.name) || ((ff.name || ff.fieldKey || ff.id || '').toLowerCase().replace(/_/g, ' ').trim());
          const val  = ff.value != null ? ff.value : ff.fieldValue;
          pushEntry({
            id:       ff.id || ff.fieldId || null,
            fieldKey: fk,
            mergeTag: fk,
            name:     name,
            value:    val,
            source:   'form_submission_array'
          });
        });
      } else if (rawData && typeof rawData === 'object') {
        Object.entries(rawData).forEach(([k, v]) => {
          // k may be: UUID (custom field ID), fieldKey, or label
          const def  = fieldDefsMap[k] || null;
          const fk   = (def && def.fieldKey) || k.replace(/^contact\./, '').toLowerCase();
          const name = (def && def.name) || k.toLowerCase().replace(/[_-]/g, ' ').trim();
          pushEntry({
            id:       def ? def.id : (/^[0-9a-f-]{20,}$/i.test(k) ? k : null),
            fieldKey: fk,
            mergeTag: fk,
            name:     name,
            value:    v,
            source:   'form_submission_object'
          });
        });
      }
      // Also check top-level submission keys that might carry field values
      ['firstName','lastName','email','phone','companyName'].forEach(k => {
        if (sub[k] != null && sub[k] !== '') {
          pushEntry({
            id:       null,
            fieldKey: k.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''),
            mergeTag: k.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''),
            name:     k.toLowerCase(),
            value:    sub[k],
            source:   'submission_top'
          });
        }
      });
    });

    // Attach entries as a non-enumerable property so callers that
    // JSON-stringify or iterate `result` don't see this metadata.
    Object.defineProperty(result, '_entries', {
      value: entries,
      enumerable: false,
      writable: true,
      configurable: true
    });

    return result;
  }

  // Load admin-defined GHL field overrides from localStorage. Lets the
  // user pin a portal field to a specific GHL custom-field UUID or
  // fieldKey when the fuzzy label match isn't reliable enough. Shape:
  //   { portalKey: { id?: '<uuid>', key?: '<fieldKey>', tag?: '<merge tag>' } }
  // Set via: localStorage.setItem('cq_ghl_field_overrides',
  //   JSON.stringify({ bizName: { id: 'a1b2-...' }, dob: { key: 'date_of_birth' } }));
  function _getFieldOverrides () {
    try {
      const raw = localStorage.getItem('cq_ghl_field_overrides');
      const obj = raw ? JSON.parse(raw) : null;
      return (obj && typeof obj === 'object') ? obj : {};
    } catch (e) { return {}; }
  }

  function mapGhlToPortalFields (contact, ghlFields) {
    const f = ghlFields || {};
    const entries = (f && f._entries) || [];
    const overrides = _getFieldOverrides();
    const out = {};

    // Pre-build lookup maps from the structured entries for fast id/key/tag
    // resolution. The flat name map (f[...]) is still consulted as the
    // final fallback for label-based matches.
    const byId  = {}, byKey = {}, byTag = {};
    entries.forEach(e => {
      if (e.id       && byId[e.id]       == null) byId[e.id]      = e.value;
      if (e.fieldKey && byKey[e.fieldKey] == null) byKey[e.fieldKey] = e.value;
      if (e.mergeTag && byTag[e.mergeTag] == null) byTag[e.mergeTag] = e.value;
    });

    // Diagnostic log so the admin can copy the exact GHL identifiers for
    // an override. Toggle off by setting localStorage.cq_ghl_quiet = '1'.
    try {
      if (entries.length && localStorage.getItem('cq_ghl_quiet') !== '1') {
        console.groupCollapsed('[GHL] parsed ' + entries.length + ' fields — id / fieldKey / label');
        entries.forEach(e => {
          console.log(
            '  ' + (e.id || '-').padEnd(40, ' '),
            (e.fieldKey || '-').padEnd(36, ' '),
            (e.name || '-').padEnd(36, ' '),
            '= ' + JSON.stringify(e.value).slice(0, 60)
          );
        });
        console.log('Tip: pin a portal field with localStorage.setItem(\'cq_ghl_field_overrides\', JSON.stringify({ portalKey: { id: \'<UUID>\' } }))');
        console.groupEnd();
      }
    } catch (e) {}

    // Pick first non-empty match from a list of identifiers. Each identifier
    // may be prefixed:
    //   'id:<UUID>'   → match by GHL custom-field ID (most stable)
    //   'key:<slug>'  → match by GHL fieldKey
    //   'tag:<slug>'  → match by merge tag (same as fieldKey in GHL)
    // Unprefixed strings → fuzzy match against the normalized label
    // (current behavior — preserved as the final fallback).
    const pick = (...idents) => {
      for (const raw of idents) {
        if (!raw) continue;
        const s = String(raw).trim();
        let val;
        if (s.indexOf('id:') === 0) {
          val = byId[s.slice(3).trim()];
        } else if (s.indexOf('key:') === 0) {
          val = byKey[s.slice(4).trim().toLowerCase()];
        } else if (s.indexOf('tag:') === 0) {
          let t = s.slice(4).trim().toLowerCase().replace(/^contact\./, '');
          val = byTag[t];
        } else {
          val = f[s.toLowerCase().trim()];
        }
        if (val != null && val !== '') return String(val).trim();
      }
      return null;
    };

    // Convenience for the long list of label aliases below. Honors admin
    // overrides first: if cq_ghl_field_overrides has an entry for the
    // portal key, that identifier is tried before any label alias.
    const m = (key, ...names) => {
      const overlay = overrides[key];
      const priority = [];
      if (overlay) {
        if (overlay.id)  priority.push('id:'  + overlay.id);
        if (overlay.key) priority.push('key:' + overlay.key);
        if (overlay.tag) priority.push('tag:' + overlay.tag);
      }
      const v = pick(...priority.concat(names));
      if (v) out[key] = v;
    };

    // ── CONTACT OBJECT (highest priority) ──────────────────────────────────
    if (contact.firstName)   out.firstName = contact.firstName;
    if (contact.lastName)    out.lastName  = contact.lastName;
    if (contact.email)       out.email     = contact.email;
    if (contact.phone)       out.phone     = contact.phone;
    if (contact.companyName) out.bizName   = contact.companyName;
    if (contact.dateOfBirth) out.dob       = contact.dateOfBirth;

    // Personal home address from contact object
    if (contact.address1)   out.street = contact.address1;
    if (contact.city)       out.homeCity  = contact.city;
    if (contact.state)      out.homeState = contact.state;
    if (contact.postalCode) out.homeZip   = contact.postalCode;

    // ── EXPLICIT GHL FIELDKEY MAPPINGS ─────────────────────────────────────
    // Canonical merge-tag → portal-field map for the Business Credit Stacking
    // Application form. These run BEFORE the fuzzy-label m() chain so the
    // GHL fieldKey wins when present. The fuzzy aliases below still catch
    // forms with different field names.
    const GHL_KEY_MAP = {
      bizName:        ['business_name', 'legal_business_name'],
      dba:            ['dba_name'],
      ein:            ['ein', 'business_ein', 'federal_ein'],
      dateEstablished:['business_date_established', 'date_business_established'],
      bizAddress:     ['business_street_address', 'business_address', 'business_address_line_1'],
      bizPhone:       ['business_phone_number', 'business_phone'],
      bizType:        ['business_type'],
      industry:       ['industry', 'business_industry'],
      employees:      ['employee_count', 'number_of_employees'],
      ownership:      ['ownership', 'ownership_percent', 'ownership_percentage'],
      loanAmount:     ['desired_loan_amount', 'loan_amount', 'desired_funding_amount'],
      loanReason:     ['reason_for_loan', 'loan_purpose'],
      bizCreditCards: ['current_business_credit_cards', 'business_credit_cards'],
      bizBanks:       ['current_business_banking_relationships', 'business_banking_relationships'],
      dob:            ['date_of_birth', 'dob'],
      ssn:            ['social_security_number', 'ssn'],
      personalBanks:  ['current_banking_relationships', 'current_personal_banking_relationships', 'personal_banking_relationships'],
      // The following are likely on the form but the exact fieldKeys
      // weren't visible in the screenshot — add the slug variants here
      // once the admin pastes the real ones (see TODO at bottom).
      monthlySales:   ['average_monthly_sales', 'monthly_sales', 'avg_monthly_sales', 'monthly_revenue'],
      maidenName:     ['mothers_maiden_name', 'mother_maiden_name', 'maiden_name'],
      citizen:        ['us_citizen', 'american_citizen', 'are_you_a_us_citizen', 'citizenship'],
      annualIncome:   ['personal_annual_income', 'annual_income', 'yearly_income']
    };
    Object.keys(GHL_KEY_MAP).forEach(portalKey => {
      if (out[portalKey]) return; // don't overwrite values already pulled from standard contact fields
      for (const fk of GHL_KEY_MAP[portalKey]) {
        const v = byKey[fk];
        if (v != null && v !== '') { out[portalKey] = String(v).trim(); break; }
      }
    });

    // ── COMPOUND FIELD SPLITTERS ───────────────────────────────────────────
    // GHL custom values like "City, ST ZIP" or "Street, City, ST ZIP".
    // Split into the portal's discrete city/state/zip slots.
    function _splitCityStateZip(v) {
      if (!v) return null;
      const s = String(v).trim();
      // "Herriman, UT 84096" or "Herriman, UT  84096"
      let m = s.match(/^(.+?),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      if (!m) m = s.match(/^(.+?)\s+([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      if (!m) return null;
      return { city: m[1].trim(), state: m[2].toUpperCase(), zip: m[3] };
    }
    function _splitFullAddress(v) {
      if (!v) return null;
      const s = String(v).trim();
      // "5368 W Borglum Lane, Herriman, UT 84096"
      const m = s.match(/^(.+?),\s*(.+?),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      if (!m) return { street: s };
      return { street: m[1].trim(), city: m[2].trim(), state: m[3].toUpperCase(), zip: m[4] };
    }

    const bizCsz = byKey['business_city_state_zip'];
    if (bizCsz) {
      const sp = _splitCityStateZip(bizCsz);
      if (sp) {
        if (!out.bizCity)  out.bizCity  = sp.city;
        if (!out.bizState) out.bizState = sp.state;
        if (!out.bizZip)   out.bizZip   = sp.zip;
      }
    }
    const personalCsz = byKey['personal_city_state_zip'];
    if (personalCsz) {
      const sp = _splitCityStateZip(personalCsz);
      if (sp) {
        if (!out.city)      out.city      = sp.city;
        if (!out.state)     out.state     = sp.state;
        if (!out.zip)       out.zip       = sp.zip;
        if (!out.homeCity)  out.homeCity  = sp.city;
        if (!out.homeState) out.homeState = sp.state;
        if (!out.homeZip)   out.homeZip   = sp.zip;
      }
    }
    const fullAddr = byKey['full_address'];
    if (fullAddr) {
      const sp = _splitFullAddress(fullAddr);
      if (sp) {
        if (!out.street)    out.street    = sp.street;
        if (sp.city  && !out.city)      out.city      = sp.city;
        if (sp.state && !out.state)     out.state     = sp.state;
        if (sp.zip   && !out.zip)       out.zip       = sp.zip;
        if (sp.city  && !out.homeCity)  out.homeCity  = sp.city;
        if (sp.state && !out.homeState) out.homeState = sp.state;
        if (sp.zip   && !out.homeZip)   out.homeZip   = sp.zip;
      }
    }

    // contact.name (full name) → split into firstName + lastName
    const ghlName = byKey['name'] || byKey['full_name'] || byKey['contact_name'];
    if (ghlName && !out.firstName) {
      const parts = String(ghlName).trim().split(/\s+/);
      out.firstName = parts[0];
      if (parts.length > 1) out.lastName = parts.slice(1).join(' ');
    }

    // ── FULL NAME SPLIT ────────────────────────────────────────────────────
    const fullName = pick(
      'full name','fullname','name','contact name','applicant name',
      'applicant full name','applicant','owner name','primary contact name'
    );
    if (fullName && !out.firstName) {
      const parts = fullName.trim().split(/\s+/);
      out.firstName = parts[0];
      if (parts.length > 1) out.lastName = parts.slice(1).join(' ');
    }

    // ── BUSINESS FIELDS ────────────────────────────────────────────────────
    m('bizName',
      'legal business name','legal name of business','legal company name',
      'business legal name','business name','businessname','business_name',
      'company name','company','dba / legal name','registered business name',
      'full business name','company legal name'
    );
    m('dba',
      'dba','dba name','dba / trade name','trade name','trade name (dba)',
      'doing business as','dba (if different)','fictitious name','assumed name',
      'business dba','alternate business name'
    );
    m('ein',
      'ein','employer identification number','employer id number',
      'federal tax id','federal tax identification number','tax id',
      'federal ein','fein','tax identification number','business tax id',
      'employer id','business ein','federal id'
    );
    m('dateEstablished',
      'business date established','date business established',
      'date established','date business was established',
      'business established date','business start date','date business opened',
      'business open date','date opened','established date','year established',
      'incorporation date','date incorporated','date of incorporation',
      'formation date','business formation date'
    );
    m('bizAddress',
      'business street address','business address','business address line 1',
      'business street','company address','company street','business mailing address',
      'business physical address','street address of business','business location address'
    );
    m('bizCity',
      'business city','city of business','business address city',
      'company city','business mailing city','city (business)'
    );
    m('bizState',
      'business state','state of business','business address state',
      'company state','business mailing state','state (business)'
    );
    m('bizZip',
      'business zip','business zip code','business postal code',
      'business address zip','company zip','zip code (business)',
      'business zipcode','zip (business)'
    );
    m('bizPhone',
      'business phone','company phone','business phone number',
      'business telephone','company telephone','business contact number',
      'office phone','business cell','company cell','business main phone'
    );
    m('bizType',
      'business type','business_type','entity type','type of entity',
      'business structure','entity structure','type of business',
      'business entity type','legal entity type','organization type',
      'business legal structure','company type'
    );
    m('industry',
      'industry','business industry','industry type','business category',
      'type of industry','industry sector','business sector',
      'nature of business','primary industry','line of business',
      'type of work'
    );
    m('employees',
      'employee count','number of employees','# of employees',
      'employees','total employees','number employees',
      'full time employees','staff count','number of staff',
      'how many employees','employees (full & part time)',
      'total number of employees'
    );
    m('monthlySales',
      'average monthly sales','monthly sales','monthly revenue',
      'monthly_revenue','average monthly revenue','avg monthly revenue',
      'average monthly gross revenue','monthly gross revenue',
      'gross monthly revenue','monthly gross sales','avg monthly sales',
      'monthly average revenue','monthly income (business)',
      'average monthly income','monthly business revenue'
    );
    m('ownership',
      'ownership %','ownership percentage','percent ownership',
      '% ownership','ownership percent','ownership','share ownership',
      'percentage of ownership','what percent do you own',
      'what percentage do you own','how much do you own %',
      'owner percentage','principal ownership %'
    );
    m('loanAmount',
      'desired loan amount','desired funding amount','loan amount requested',
      'funding goal','funding amount','loan amount','requested amount',
      'desired funding','funding needed','amount requested',
      'how much funding','total funding needed','capital needed',
      'amount of funding','requested loan amount','funding request',
      'how much are you looking for','desired capital'
    );
    m('loanReason',
      'reason for loan','reason for funding','purpose of loan',
      'funding purpose','loan purpose','use of funds',
      'purpose of funding','how will funds be used','funding use',
      'intended use of funds','what will you use the funds for',
      'describe the use of funds','loan use','funding intention',
      'how do you plan to use the funds'
    );
    m('bizCreditCards',
      'current business credit cards','existing business credit cards',
      'business credit cards','business cards','current business cards',
      'existing business cards','list business credit cards',
      'business credit card accounts','active business credit cards',
      'business credit card relationships','credit cards (business)'
    );
    m('bizBanks',
      'current business banking','current business banking relationships',
      'business banking','business bank','business banks',
      'business bank relationships','current business bank',
      'business banking relationship','existing business banking',
      'business checking accounts','business bank accounts',
      'where do you bank (business)','business financial institutions'
    );
    m('personalBanks',
      'current personal banking','current personal banking relationships',
      'personal banking','personal bank','personal banks',
      'personal bank relationships','current personal bank',
      'personal banking relationship','existing personal banking',
      'personal checking accounts','personal bank accounts',
      'where do you bank (personal)','personal financial institutions'
    );

    // ── PERSONAL FIELDS ────────────────────────────────────────────────────
    m('dob',
      'date of birth','dob','birth date','birthday','date_of_birth',
      'date of birth (mm/dd/yyyy)','birthdate','date of birth mm/dd/yyyy',
      'owner date of birth','applicant date of birth','personal dob',
      'd.o.b','d.o.b.','date of birth:'
    );
    m('ssn',
      'social security number','ssn','ss#','social security',
      'full ssn','social security #','social security no',
      'social security no.','full social security number',
      'social security number (ssn)','ssn#','tax id (personal)',
      'personal ssn','owner ssn','applicant ssn'
    );
    m('maidenName',
      "mother's maiden name","mothers maiden name","mother maiden name",
      "mother's maiden name:","maiden name","mother's maiden",
      'mom maiden name',"mother's last name"
    );
    m('annualIncome',
      'annual income','yearly income','annual personal income',
      'personal income','household income','personal annual income',
      'applicant annual income','annual household income',
      'gross annual income','total annual income','income (annual)',
      'gross income','personal gross income'
    );
    m('citizen',
      'are you a us citizen','us citizen','us citizenship',
      'united states citizen','citizenship','citizen',
      'american citizen','are you an american citizen',
      'are you a united states citizen','citizenship status',
      'u.s. citizen','us citizen?','citizen?'
    );

    // ── HOME ADDRESS FIELDS ────────────────────────────────────────────────
    m('street',
      'home street address','home address','home street',
      'street address','residential address','personal address',
      'home address line 1','residential street address',
      'personal street address','owner home address',
      'mailing address','personal home address'
    );
    m('homeCity',
      'home city','city','residential city','personal city',
      'city (personal)','city of residence'
    );
    m('homeState',
      'home state','state','residential state','personal state',
      'state (personal)','state of residence'
    );
    m('homeZip',
      'home zip','home zip code','zip code','zip','postal code',
      'home postal code','residential zip','personal zip',
      'zip (personal)'
    );

    // ── ADDITIONAL FIELDS ──────────────────────────────────────────────────
    m('signatureName',
      'signature','full signature','applicant signature',
      'print name','printed name','authorized signature',
      'signature (full name)','sign here'
    );
    m('signedDate',
      'date signed','signature date','date of signature',
      'signed date','sign date'
    );

    // ── DERIVED: mirror homeCity/homeState/homeZip → city/state/zip ────────
    // Portal uses city/state/zip for personal address — populate from home fields
    if (!out.city  && out.homeCity)  out.city  = out.homeCity;
    if (!out.state && out.homeState) out.state = out.homeState;
    if (!out.zip   && out.homeZip)   out.zip   = out.homeZip;

    // ── DERIVED: parse compound business address if city/state/zip missing ─
    // Some GHL setups return full address as one field "5368 W Borglum Lane, Herriman, UT 84096"
    if (out.bizAddress && !out.bizCity) {
      const addrMatch = out.bizAddress.match(/^(.+?),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      if (addrMatch) {
        out.bizAddress = addrMatch[1].trim();
        out.bizCity    = addrMatch[2].trim();
        out.bizState   = addrMatch[3].trim();
        out.bizZip     = addrMatch[4].trim();
      }
    }
    if (out.street && !out.city) {
      const homeMatch = out.street.match(/^(.+?),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      if (homeMatch) {
        out.street    = homeMatch[1].trim();
        out.city      = homeMatch[2].trim();
        out.state     = homeMatch[3].trim();
        out.zip       = homeMatch[4].trim();
        out.homeCity  = out.homeCity  || out.city;
        out.homeState = out.homeState || out.state;
        out.homeZip   = out.homeZip   || out.zip;
      }
    }

    // ── NORMALIZATION ──────────────────────────────────────────────────────
    // Clean up raw GHL values to the canonical portal formats. The admin
    // edit-profile inputs expect YYYY-MM-DD dates, digit-only phone/SSN/EIN,
    // and numeric money/percentage. Without this pass an import of e.g.
    // "03171976" lands as-is and the date input rejects it.
    _normalizeMappedFields(out);

    return out;
  }

  // Phone: strip everything that isn't a digit. Tolerates +1 country code.
  // Returns 10-digit string when possible, otherwise digits as-found.
  function _normPhone(v) {
    if (!v) return v;
    const digits = String(v).replace(/\D/g, '');
    if (digits.length === 11 && digits.charAt(0) === '1') return digits.slice(1);
    return digits;
  }

  // SSN: strip non-digits, preserve leading zeros (string output).
  function _normSsn(v) {
    if (!v) return v;
    return String(v).replace(/\D/g, '');
  }

  // EIN: digits only. ##-####### display formatting happens at render time.
  function _normEin(v) {
    if (!v) return v;
    return String(v).replace(/\D/g, '');
  }

  // DOB: accept MMDDYYYY, MM/DD/YYYY, YYYY-MM-DD, MM-DD-YYYY, MM.DD.YYYY,
  // ISO timestamps, or epoch numbers. Output in YYYY-MM-DD (HTML date input).
  function _normDob(v) {
    if (!v) return v;
    const s = String(v).trim();
    // ISO date string (with or without time)
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
    if (m) return m[1] + '-' + m[2] + '-' + m[3];
    // 8-digit MMDDYYYY (no separators)
    m = s.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (m) return m[3] + '-' + m[1] + '-' + m[2];
    // MM/DD/YYYY or MM-DD-YYYY or MM.DD.YYYY
    m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if (m) {
      let mm = m[1].padStart(2, '0');
      let dd = m[2].padStart(2, '0');
      let yy = m[3];
      if (yy.length === 2) yy = (parseInt(yy, 10) > 30 ? '19' : '20') + yy;
      return yy + '-' + mm + '-' + dd;
    }
    // Epoch millis
    const num = Number(s);
    if (!isNaN(num) && num > 31536000000) {
      const d = new Date(num);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
    return s;
  }

  // Money: strip $ , spaces, keep digits and decimal. Return numeric string.
  function _normMoney(v) {
    if (v === null || v === undefined || v === '') return v;
    const cleaned = String(v).replace(/[^\d.\-]/g, '');
    if (!cleaned) return '';
    const num = parseFloat(cleaned);
    if (isNaN(num)) return cleaned;
    return String(Math.round(num));
  }

  // Ownership %: strip non-digits/decimals, clamp to 0–100.
  function _normOwnership(v) {
    if (v === null || v === undefined || v === '') return v;
    const cleaned = String(v).replace(/[^\d.\-]/g, '');
    if (!cleaned) return '';
    let num = parseFloat(cleaned);
    if (isNaN(num)) return cleaned;
    if (num > 100) num = 100;
    if (num < 0) num = 0;
    return String(Math.round(num));
  }

  // Citizen: normalize various yes/no/true/false answers to "yes" or "no".
  function _normCitizen(v) {
    if (!v) return v;
    const s = String(v).toLowerCase().trim();
    if (['yes','y','true','1','us citizen','american','american citizen','u.s. citizen','us'].indexOf(s) >= 0) return 'yes';
    if (['no','n','false','0','not a citizen'].indexOf(s) >= 0) return 'no';
    return v;
  }

  // State abbreviation: if input is a full state name, return the two-letter
  // code. Otherwise return the input upper-cased.
  const _STATE_ABBR = {
    'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA',
    'colorado':'CO','connecticut':'CT','delaware':'DE','district of columbia':'DC',
    'florida':'FL','georgia':'GA','hawaii':'HI','idaho':'ID','illinois':'IL',
    'indiana':'IN','iowa':'IA','kansas':'KS','kentucky':'KY','louisiana':'LA',
    'maine':'ME','maryland':'MD','massachusetts':'MA','michigan':'MI','minnesota':'MN',
    'mississippi':'MS','missouri':'MO','montana':'MT','nebraska':'NE','nevada':'NV',
    'new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY',
    'north carolina':'NC','north dakota':'ND','ohio':'OH','oklahoma':'OK','oregon':'OR',
    'pennsylvania':'PA','rhode island':'RI','south carolina':'SC','south dakota':'SD',
    'tennessee':'TN','texas':'TX','utah':'UT','vermont':'VT','virginia':'VA',
    'washington':'WA','west virginia':'WV','wisconsin':'WI','wyoming':'WY'
  };
  function _normState(v) {
    if (!v) return v;
    const s = String(v).trim();
    if (s.length === 2) return s.toUpperCase();
    const code = _STATE_ABBR[s.toLowerCase()];
    return code || s;
  }

  function _normalizeMappedFields(out) {
    if (out.phone)        out.phone        = _normPhone(out.phone);
    if (out.bizPhone)     out.bizPhone     = _normPhone(out.bizPhone);
    if (out.ssn)          out.ssn          = _normSsn(out.ssn);
    if (out.ein)          out.ein          = _normEin(out.ein);
    if (out.dob)             out.dob             = _normDob(out.dob);
    if (out.dateEstablished) out.dateEstablished = _normDob(out.dateEstablished);
    if (out.signedDate)      out.signedDate      = _normDob(out.signedDate);
    if (out.annualIncome) out.annualIncome = _normMoney(out.annualIncome);
    if (out.monthlySales) out.monthlySales = _normMoney(out.monthlySales);
    if (out.loanAmount)   out.loanAmount   = _normMoney(out.loanAmount);
    if (out.ownership)    out.ownership    = _normOwnership(out.ownership);
    if (out.citizen)      out.citizen      = _normCitizen(out.citizen);
    if (out.state)        out.state        = _normState(out.state);
    if (out.homeState)    out.homeState    = _normState(out.homeState);
    if (out.bizState)     out.bizState     = _normState(out.bizState);
    // Mirror home* back into city/state/zip after normalization in case the
    // earlier mirror happened on raw values.
    if (out.homeCity  && !out.city)  out.city  = out.homeCity;
    if (out.homeState && !out.state) out.state = out.homeState;
    if (out.homeZip   && !out.zip)   out.zip   = out.homeZip;
  }

  // Validate form ownership: compare portal client vs GHL contact.
  // Returns { confidence: 'high'|'medium'|'low', score, matchedBy: [], warnings: [] }
  function validateFormOwnership (portalClient, ghlContact) {
    if (!portalClient || !ghlContact) {
      return { confidence: 'low', score: 0, matchedBy: [], warnings: ['Missing data for comparison'] };
    }
    const warnings = [], matchedBy = [];
    let score = 0;

    // Contact ID match (strongest signal)
    if (portalClient.ghlContactId && portalClient.ghlContactId === ghlContact.id) {
      matchedBy.push('contactId'); score += 50;
    }

    // Email match
    const pe = (portalClient.email || '').toLowerCase().trim();
    const ge = (ghlContact.email   || '').toLowerCase().trim();
    if (pe && ge) {
      if (pe === ge) { matchedBy.push('email'); score += 30; }
      else { warnings.push('Email mismatch — portal: "' + pe + '" · form: "' + ge + '"'); score -= 20; }
    }

    // Phone match
    const pp = (portalClient.phone || '').replace(/\D/g, '').slice(-10);
    const gp = (ghlContact.phone   || '').replace(/\D/g, '').slice(-10);
    if (pp && gp) {
      if (pp === gp) { matchedBy.push('phone'); score += 20; }
      else { warnings.push('Phone mismatch — portal: "' + (portalClient.phone||'') + '" · form: "' + (ghlContact.phone||'') + '"'); score -= 10; }
    }

    // Name match
    const pn = ((portalClient.fname || '') + ' ' + (portalClient.lname || '')).trim().toLowerCase();
    const gn = ((ghlContact.firstName || '') + ' ' + (ghlContact.lastName || '')).trim().toLowerCase();
    if (pn && gn) {
      if (pn === gn) { matchedBy.push('name'); score += 10; }
      else if (!gn.includes(pn.split(' ')[0]) && !pn.includes(gn.split(' ')[0])) {
        warnings.push('Name mismatch — portal: "' + pn + '" · form: "' + gn + '"');
        score -= 5;
      }
    }

    const confidence = score >= 50 ? 'high' : score >= 20 ? 'medium' : 'low';
    return { confidence, score, matchedBy, warnings };
  }

  // Main entry: fetch + parse + validate all GHL onboarding data for a portal client.
  // Returns { contact, fieldDefs, parsedFields, mappedFields, formSubmissions, matchInfo, error }
  async function fetchOnboardingData (portalClient) {
    try {
      let contact = null, contactSource = null;
      let extraContacts = [];

      // Priority 1: match by stored GHL contact ID
      if (portalClient.ghlContactId) {
        contact = await getContact(portalClient.ghlContactId);
        if (contact) contactSource = 'contactId';
      }
      // Priority 2: match by email
      if (!contact && portalClient.email) {
        contact = await lookupContact(portalClient.email, null);
        if (contact) contactSource = 'email';
      }
      // Priority 3: match by phone
      if (!contact && portalClient.phone) {
        contact = await lookupContact(null, portalClient.phone);
        if (contact) contactSource = 'phone';
      }

      if (!contact) {
        return { error: 'No GHL contact found for this client. Link this client to GHL first, or ensure their email or phone matches a GHL contact.' };
      }

      // ── EMAIL DUPLICATE FAN-OUT ─────────────────────────────────────────
      // GHL allows multiple contacts to share the same email — form
      // submissions sometimes attach to a DIFFERENT contact than the one
      // we matched first (different name, different phone, test entries,
      // etc.). Fetch every contact with the same email, hydrate each one
      // fully (lean lookup doesn't include customFields), pick the
      // richest as primary, and aggregate submissions + customFields
      // across every match.
      if (portalClient.email) {
        try {
          const allByEmail = await lookupContactsByEmail(portalClient.email, 10);
          const otherIds = (allByEmail || [])
            .map(c => c && c.id)
            .filter(id => id && id !== contact.id);

          if (otherIds.length) {
            // Hydrate each duplicate so we have their customFields too.
            const fullExtras = await Promise.all(
              otherIds.map(id => getContact(id).catch(() => null))
            );
            extraContacts = fullExtras.filter(Boolean);

            // Promote the contact with the MOST customFields to primary.
            const allCandidates = [contact].concat(extraContacts);
            let richest = contact;
            let richestCnt = ((contact.customFields || contact.customField) || []).length;
            allCandidates.forEach(c => {
              const cnt = ((c && (c.customFields || c.customField)) || []).length;
              if (cnt > richestCnt) { richest = c; richestCnt = cnt; }
            });
            if (richest && richest.id !== contact.id) {
              extraContacts = allCandidates.filter(c => c.id !== richest.id);
              contact = richest;
              contactSource = contactSource + '+email-richest';
            }

            try {
              if (localStorage.getItem('cq_ghl_quiet') !== '1') {
                console.log(
                  '[GHL] email duplicates: ' + (extraContacts.length + 1) +
                  ' contact(s) share ' + portalClient.email +
                  '. Promoted contact ' + contact.id + ' as primary (' + richestCnt +
                  ' customFields). Aggregating submissions + customFields from the other ' +
                  extraContacts.length + '.'
                );
                extraContacts.forEach(c => {
                  console.log(
                    '  ↳ duplicate ' + c.id +
                    ' — ' + (((c.customFields || c.customField) || []).length) +
                    ' customFields'
                  );
                });
              }
            } catch (e) {}
          }
        } catch (e) {
          console.warn('[GHL] email duplicate fan-out failed (non-fatal):', e.message);
        }
      }

      // Fetch field definitions + form submissions for the primary contact
      // AND each email-duplicate contact in parallel. Submissions get merged.
      const submissionPromises = [getContactFormSubmissions(contact.id)].concat(
        extraContacts.map(c => getContactFormSubmissions(c.id).catch(() => []))
      );
      const [fieldDefs, primarySubs, ...extraSubsArrays] = await Promise.all(
        [getCustomFieldDefs(), submissionPromises[0]].concat(submissionPromises.slice(1))
      );
      const formSubmissions = (primarySubs || []).concat(
        ...extraSubsArrays.map(arr => arr || [])
      );

      // Merge customFields from every email-matched contact into the primary.
      // Some onboarding forms get split: e.g. the address fields land on one
      // contact and the business fields on another (test contact submissions,
      // duplicate sign-ups, etc.). Combining them gives the resolver the
      // union of every field value GHL has for this email. Primary wins on
      // ID conflicts.
      if (extraContacts.length) {
        const primaryCfs = (contact.customFields || contact.customField || []).slice();
        const seenIds = {};
        primaryCfs.forEach(cf => { if (cf && cf.id) seenIds[cf.id] = true; });
        extraContacts.forEach(c => {
          const cfs = (c && (c.customFields || c.customField)) || [];
          cfs.forEach(cf => {
            if (cf && cf.id && !seenIds[cf.id] && cf.value != null && cf.value !== '') {
              primaryCfs.push(cf);
              seenIds[cf.id] = true;
            }
          });
        });
        contact = Object.assign({}, contact, { customFields: primaryCfs });
      }

      const fieldDefsMap = _buildFieldDefsMap(fieldDefs);
      _logCustomFieldCoverage(contact, fieldDefsMap);
      const parsedFields = _parseGhlFields(contact, fieldDefsMap, formSubmissions);
      const mappedFields = mapGhlToPortalFields(contact, parsedFields);
      const matchInfo    = validateFormOwnership(portalClient, contact);
      matchInfo.contactSource = contactSource;

      // Attach submission metadata for ownership tracking
      const firstSub = formSubmissions[0] || null;
      matchInfo.ghlFormId     = firstSub ? (firstSub.formId   || null) : null;
      matchInfo.ghlProposalId = firstSub ? (firstSub.id       || null) : null;

      return { contact, fieldDefs, parsedFields, mappedFields, formSubmissions, matchInfo };
    } catch (e) {
      return { error: 'GHL fetch failed: ' + e.message };
    }
  }

  // ── HIGH-LEVEL SYNC HELPERS ──────────────────────────────────────────────

  // Build GHL contact payload from portal client
  function clientToGHL (client) {
    return {
      firstName:   client.fname     || '',
      lastName:    client.lname     || '',
      email:       client.email     || '',
      phone:       _e164(client.phone || ''),
      address1:    client.address   || '',
      city:        client.city      || '',
      state:       client.state     || '',
      postalCode:  client.zip       || '',
      companyName: client.company   || client.bizName || '',
      tags:        client.tags      || [],
    };
  }

  // Build portal client fields from GHL contact
  function ghlToClient (g) {
    return {
      fname:       g.firstName     || '',
      lname:       g.lastName      || '',
      email:       g.email         || '',
      phone:       _fmtPhone(g.phone || ''),
      address:     g.address1      || '',
      city:        g.city          || '',
      state:       g.state         || '',
      zip:         g.postalCode    || '',
      company:     g.companyName   || '',
      tags:        g.tags          || [],
      assignedUser:g.assignedTo    || '',
      ghlContactId:g.id,
      ghlLocationId:g.locationId   || getSettings().locationId,
    };
  }

  // Push client to GHL (create or update) — stores ghlContactId back on client
  async function pushClient (client) {
    if (!getSettings().enabled) return null;
    let ghlContact = null;

    if (client.ghlContactId) {
      ghlContact = await updateContact(client.ghlContactId, clientToGHL(client), true);
      _logSync('push', true, 'Updated: ' + client.fname + ' ' + client.lname);
    } else {
      const existing = await lookupContact(client.email, client.phone);
      if (existing) {
        await updateContact(existing.id, clientToGHL(client), true);
        client.ghlContactId = existing.id;
        _logSync('push', true, 'Matched+updated: ' + client.fname + ' ' + client.lname);
      } else {
        const created = await createContact(clientToGHL(client));
        if (created) { client.ghlContactId = created.id; ghlContact = created; }
        _logSync('push', !!created, 'Created: ' + client.fname + ' ' + client.lname);
      }
    }

    if (client.ghlContactId && typeof fsSaveClient === 'function') {
      fsSaveClient(client).catch(() => {});
    }
    return ghlContact;
  }

  // Sync portal stage → GHL opportunity stage
  async function syncStage (client, stageName) {
    if (!getSettings().syncStages || !getSettings().enabled) return;
    if (!client) return;

    let contactId = client.ghlContactId;
    if (!contactId) {
      const found = await lookupContact(client.email, client.phone);
      if (found) {
        contactId = found.id;
        client.ghlContactId = contactId;
        if (typeof fsSaveClient === 'function') fsSaveClient(client).catch(() => {});
      }
    }
    if (!contactId) { _logSync('stage', false, 'Contact not found: ' + (client.email || client.id)); return; }

    let oppId = client.ghlOpportunityId;
    if (!oppId) {
      const found = await findOpportunity(contactId);
      if (found) oppId = found.id;
    }

    if (oppId) {
      await updateOpportunityStage(oppId, stageName);
      client.ghlOpportunityId = oppId;
    } else {
      const name = ((client.fname || '') + ' ' + (client.lname || '')).trim() || client.email || 'Client';
      const opp  = await createOpportunity(contactId, stageName, name);
      if (opp) { client.ghlOpportunityId = opp.id; oppId = opp.id; }
    }

    if (typeof fsSaveClient === 'function') fsSaveClient(client).catch(() => {});
    _logSync('stage', true, stageName + ' → GHL for ' + (client.email || client.id));
  }

  // Sync an important note to GHL contact notes
  async function syncNote (client, body) {
    if (!getSettings().syncNotes || !getSettings().enabled) return;
    if (!client?.ghlContactId) return;
    await addNote(client.ghlContactId, body);
  }

  // Sync a portal task to GHL
  async function syncTask (client, task) {
    if (!getSettings().syncTasks || !getSettings().enabled) return null;
    if (!client?.ghlContactId) return null;
    return await createTask(client.ghlContactId, task.title, task.dueDate, task.notes);
  }

  // ── RETRY QUEUE PROCESSOR ────────────────────────────────────────────────
  let _retryTimer = null;

  async function processQueue () {
    const queue = _getQueue();
    if (!queue.length) return;
    const now = Date.now();
    const ready = queue.filter(q => {
      if (q.attempts >= 5) return false;
      const backoff = Math.min(30000 * Math.pow(2, q.attempts), 600000);
      return now - q.addedAt > backoff;
    });
    for (const item of ready) {
      let ok = false;
      try {
        if (item.type === 'update_contact') { await updateContact(item.contactId, item.payload, true); ok = true; }
        if (item.type === 'add_note')       { await addNote(item.contactId, item.body); ok = true; }
        if (item.type === 'send_message')   { await sendMessage(item.contactId, item.text); ok = true; }
        if (item.type === 'update_stage')   { await updateOpportunityStage(item.oppId, item.stageName); ok = true; }
        if (item.type === 'create_task')    { await createTask(item.contactId, item.title); ok = true; }
      } catch (e) {}
      if (ok) { _dequeue(item.id); _logSync('retry', true, item.type); }
      else { item.attempts++; }
    }
    // Remove exhausted items
    _saveQueue(_getQueue().map(q => (ready.find(r => r.id === q.id) ? { ...q, attempts: Math.min(q.attempts, 5) } : q)).filter(q => q.attempts < 5));
  }

  function startRetryProcessor () {
    if (_retryTimer) clearInterval(_retryTimer);
    _retryTimer = setInterval(processQueue, 60000); // every 60s
  }

  // ── REAL-TIME POLLING ────────────────────────────────────────────────────
  let _pollTimer = null, _pollContactId = null, _pollCb = null;

  function startPolling (contactId, onUpdate) {
    stopPolling();
    _pollContactId = contactId;
    _pollCb = onUpdate;
    const sec = (getSettings().autoSyncSec || 30) * 1000;
    _pollTimer = setInterval(async () => {
      if (!_pollContactId) return;
      const msgs = await loadMessages(_pollContactId);
      if (_pollCb && msgs.length) _pollCb(msgs);
    }, sec);
  }

  function stopPolling () {
    if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
    _pollContactId = null; _pollCb = null;
  }

  // ── DUPLICATE DETECTION ──────────────────────────────────────────────────
  // Checks existing portal clients for match before importing from GHL
  function findDuplicate (ghlContact, portalClients) {
    if (!ghlContact || !portalClients) return null;
    const gid  = ghlContact.id;
    const mail = (ghlContact.email  || '').toLowerCase();
    const ph   = (ghlContact.phone  || '').replace(/\D/g, '');
    return portalClients.find(c =>
      (c.ghlContactId && c.ghlContactId === gid) ||
      (mail && (c.email || '').toLowerCase() === mail) ||
      (ph   && (c.phone || '').replace(/\D/g,'') === ph)
    ) || null;
  }

  // ── UTILS ────────────────────────────────────────────────────────────────
  function _e164 (phone) {
    if (!phone) return '';
    const d = phone.replace(/\D/g,'');
    if (!d) return '';
    if (d.length === 11 && d[0] === '1') return '+' + d;
    if (d.length === 10)                 return '+1' + d;
    return '+' + d;
  }

  function _fmtPhone (phone) {
    if (!phone) return '';
    let d = ('' + phone).replace(/\D/g, '');
    if (d.length === 11 && d[0] === '1') d = d.slice(1);
    d = d.slice(0, 10);
    if (d.length === 10) return '(' + d.slice(0,3) + ') ' + d.slice(3,6) + '-' + d.slice(6);
    return phone;
  }

  // ── CONVERSATION INBOX (full list) ──────────────────────────────────────

  // Fetch all conversations for the inbox with optional filters
  async function getConversationsInbox (opts) {
    const { locationId } = getSettings();
    const params = new URLSearchParams({ locationId, limit: String((opts && opts.limit) || 25) });
    if (opts && opts.query)      params.set('query', opts.query);
    if (opts && opts.assignedTo) params.set('assignedTo', opts.assignedTo);
    // status filter: 'unread', 'starred', 'all'
    if (opts && opts.status && opts.status !== 'all') params.set('status', opts.status);
    const d = await _fetch('GET', '/conversations/search?' + params.toString());
    return d?.conversations || [];
  }

  // Get a single conversation object by its conversation ID
  async function getConversationById (convId) {
    const d = await _fetch('GET', '/conversations/' + convId);
    return d?.conversation || d || null;
  }

  // Get messages for a conversation (paginated)
  async function getConversationMessages (convId, opts) {
    const limit  = (opts && opts.limit) || 50;
    const lastId = (opts && opts.lastId) || null;
    let path = '/conversations/' + convId + '/messages?limit=' + limit;
    if (lastId) path += '&lastMessageId=' + lastId;
    const d = await _fetch('GET', path);
    return d?.messages || [];
  }

  // Update conversation metadata (markAsRead, starred, assignedTo)
  async function updateConversation (convId, updates) {
    const d = await _fetch('PUT', '/conversations/' + convId, updates);
    return d?.conversation || d || null;
  }

  // Get all users (admins) for this location
  var _usersCache = null;
  async function getLocationUsers () {
    if (_usersCache) return _usersCache;
    const { locationId } = getSettings();
    const d = await _fetch('GET', '/users/?locationId=' + locationId + '&limit=50');
    _usersCache = d?.users || [];
    return _usersCache;
  }

  // Get location info (phone, email, etc.) — cached 1 hour
  async function getLocationInfo () {
    try {
      const cached = JSON.parse(localStorage.getItem('cq_ghl_location') || 'null');
      if (cached && (Date.now() - (cached._ts || 0)) < 3600000) return cached;
    } catch (e) {}
    const { locationId } = getSettings();
    const d = await _fetch('GET', '/locations/' + locationId);
    const info = d?.location || d || null;
    if (info) {
      info._ts = Date.now();
      try { localStorage.setItem('cq_ghl_location', JSON.stringify(info)); } catch (e) {}
    }
    return info;
  }

  // Add a typed note — prepends a label prefix to the note body
  async function addTypedNote (contactId, body, noteType) {
    const prefix = noteType ? '[' + noteType + '] ' : '';
    return addNote(contactId, prefix + body);
  }

  // Get all tasks for a contact
  async function getContactTasks (contactId) {
    const d = await _fetch('GET', '/contacts/' + contactId + '/tasks');
    return d?.tasks || [];
  }

  // Generate a deep-link URL into the GHL app for a conversation or contact
  function openInGHLUrl (contactId, convId) {
    if (convId)     return 'https://app.leadconnectorhq.com/v2/location/' + (getSettings().locationId || '') + '/conversations/' + convId;
    if (contactId)  return 'https://app.leadconnectorhq.com/v2/location/' + (getSettings().locationId || '') + '/contacts/detail/' + contactId;
    return 'https://app.leadconnectorhq.com/conversations/';
  }

  // ── PUBLIC API ───────────────────────────────────────────────────────────
  return {
    // Settings
    getSettings, saveSettings,
    // Contacts
    searchContacts, getContact, createContact, updateContact,
    lookupContact, lookupContactsByEmail, importAllContacts,
    clientToGHL, ghlToClient, findDuplicate,
    // Opportunities
    getPipeline, findOpportunity, createOpportunity, updateOpportunityStage,
    // Messaging
    getConversation, loadMessages, getCachedMessages, sendMessage,
    // Calling
    initiateCall, logCall,
    // Notes
    getContactNotes, addNote,
    // Tasks
    createTask, updateTask,
    // Form data / custom fields
    getCustomFieldDefs, getContactFormSubmissions,
    mapGhlToPortalFields, validateFormOwnership, fetchOnboardingData,
    // High-level sync
    pushClient, syncStage, syncNote, syncTask,
    // Queue & logging
    processQueue, startRetryProcessor, getSyncLog, getRetryQueue, getLastApiError,
    clearBadgeError,
    // Polling
    startPolling, stopPolling,
    // Inbox / full conversation center
    getConversationsInbox, getConversationById, getConversationMessages,
    updateConversation, getLocationUsers, getLocationInfo,
    addTypedNote, getContactTasks, openInGHLUrl,
    // Utils
    e164: _e164, fmtPhone: _fmtPhone,
    // Proxy
    isProxyReady, resetProxyCheck,
    // Expose local proxy URL for admin.html status display
    localProxyUrl: LOCAL_PROXY,
  };
})();
