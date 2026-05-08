// ── GoHighLevel Integration Layer — CapitalQuest Admin Portal ────────────────
// Provides a unified GHL.* API for all integration needs.
// API: GHL v2 (services.leadconnectorhq.com) — called browser-native w/ CORS
// Contact search: proxied via Cloudflare Worker (ghl-proxy.sam-e5a.workers.dev)
// ─────────────────────────────────────────────────────────────────────────────

window.GHL = (function () {

  const API      = 'https://services.leadconnectorhq.com';
  const PROXY    = 'https://ghl-proxy.sam-e5a.workers.dev';
  const VER      = '2021-07-28';

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
        autoSyncSec:     s.autoSyncSec     || 30,
        defaultUser:     s.defaultUser     || '',
        fromNumber:      s.fromNumber      || '',
        enabled:         s.enabled         !== false,
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

  function _logSync (type, ok, detail) {
    const e = { type, ok, detail: (detail || '').substring(0, 200), ts: Date.now() };
    _log.unshift(e);
    if (_log.length > 300) _log.length = 300;
    try { localStorage.setItem('cq_ghl_log', JSON.stringify(_log.slice(0, 100))); } catch (err) {}
    _setBadge(!ok);
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
  async function _fetch (method, path, body, retryItem) {
    if (!getSettings().enabled) return null;
    const url = path.startsWith('http') ? path : API + path;
    try {
      const opts = { method, headers: _hdrs() };
      if (body && method !== 'GET') opts.body = JSON.stringify(body);
      const res = await fetch(url, opts);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        _logSync('api', false, method + ' ' + path + ' → ' + res.status + ' ' + (data.message || res.statusText));
        if (retryItem) _enqueue(retryItem);
        return null;
      }
      _logSync('api', true, method + ' ' + path);
      return data;
    } catch (e) {
      _logSync('api', false, method + ' ' + path + ': ' + e.message);
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
    return d?.contact || null;
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

  async function sendMessage (contactId, text, type) {
    type = type || 'SMS';
    let convId = null;
    try { convId = JSON.parse(localStorage.getItem('cq_ghl_msgs_' + contactId) || '{}').convId; } catch (e) {}
    const body = { type, contactId, message: text };
    if (convId) body.conversationId = convId;
    const d = await _fetch('POST', '/conversations/messages', body,
      { id: 'sm_' + contactId + '_' + Date.now(), type: 'send_message', contactId, text });
    _logSync('message', !!d, 'SMS to contact ' + contactId);
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
    const d = await _fetch('GET', '/custom-fields/?locationId=' + locationId);
    return d?.customFields || d?.fields || [];
  }

  async function getContactFormSubmissions (contactId) {
    const { locationId } = getSettings();
    const d = await _fetch('GET', '/forms/submissions?locationId=' + locationId + '&contactId=' + contactId + '&limit=50');
    return d?.submissions || [];
  }

  function _buildFieldDefsMap (defs) {
    const map = {};
    (defs || []).forEach(f => {
      const name = (f.name || f.fieldKey || '').toLowerCase().trim();
      map[f.id] = { name, orig: f.name, fieldKey: f.fieldKey };
    });
    return map;
  }

  function _parseGhlFields (contact, fieldDefsMap, formSubmissions) {
    const result = {};
    // Custom fields from contact object
    const customFields = contact.customFields || contact.customField || [];
    customFields.forEach(cf => {
      const def = fieldDefsMap[cf.id];
      const name = def ? def.name : (cf.id || '');
      if (name && cf.value != null && cf.value !== '') result[name] = cf.value;
    });
    // Form submission fields (override contact customFields)
    (formSubmissions || []).forEach(sub => {
      (sub.formFields || sub.data || []).forEach(ff => {
        const def = fieldDefsMap[ff.id] || fieldDefsMap[ff.fieldId];
        const name = def ? def.name : (ff.name || ff.fieldKey || '').toLowerCase().trim();
        if (name && ff.value != null && ff.value !== '') result[name] = ff.value;
      });
    });
    return result;
  }

  function mapGhlToPortalFields (contact, ghlFields) {
    const f = ghlFields || {};
    const out = {};
    const pick = (...names) => {
      for (const n of names) { const v = f[n.toLowerCase().trim()]; if (v != null && v !== '') return String(v); }
      return null;
    };
    const m = (key, ...names) => { const v = pick(...names); if (v) out[key] = v; };

    // Standard contact fields (highest priority — directly on contact object)
    if (contact.firstName)   out.firstName = contact.firstName;
    if (contact.lastName)    out.lastName  = contact.lastName;
    if (contact.email)       out.email     = contact.email;
    if (contact.phone)       out.phone     = contact.phone;
    if (contact.address1)    out.street    = contact.address1;
    if (contact.city)        out.city      = contact.city;
    if (contact.state)       out.state     = contact.state;
    if (contact.postalCode)  out.zip       = contact.postalCode;
    if (contact.companyName) out.bizName   = contact.companyName;

    // Full name split (from custom field)
    const fullName = pick('full name','name','contact name','applicant name','applicant');
    if (fullName && !out.firstName) {
      const parts = fullName.trim().split(/\s+/);
      out.firstName = parts[0];
      if (parts.length > 1) out.lastName = parts.slice(1).join(' ');
    }

    // Business fields
    m('bizName',         'business name','businessname','business_name','company','company name','legal business name','legal name');
    m('dba',             'dba','dba / trade name','trade name','doing business as','dba name');
    m('ein',             'ein','employer identification number','tax id','federal tax id','fein','employer id');
    m('dateEstablished', 'date established','date_established','business established','business start date','business open date','year established','date business established');
    m('bizAddress',      'business address','business_address','business street address','company address','business location');
    m('bizType',         'business type','business_type','entity type','business structure','entity structure','type of business');
    m('industry',        'industry','business industry','industry type','business category','type of industry');
    m('employees',       'employees','# of employees','number of employees','number employees','total employees','employee count');
    m('monthlySales',    'monthly revenue','monthly_revenue','monthly sales','average monthly revenue','monthly gross revenue','avg monthly revenue','gross monthly revenue');
    m('ownership',       'ownership','ownership %','ownership percentage','percent ownership','% ownership','ownership percent');
    m('loanAmount',      'funding goal','funding amount','loan amount','requested amount','desired funding','funding needed','amount requested','how much funding');
    m('loanReason',      'funding purpose','loan purpose','use of funds','purpose of funding','how will funds be used','funding use','intended use');
    m('bizCreditCards',  'existing business cards','business credit cards','business cards','current business cards','existing business credit cards');
    m('bizBanks',        'business banking','business bank','business banks','business bank relationships','current business bank','business banking relationship');
    m('personalBanks',   'personal banking','personal bank','personal banks','personal bank relationships','current personal bank','personal banking relationship');
    m('bizPhone',        'business phone','business_phone','company phone','business phone number');

    // Personal fields
    m('dob',             'date of birth','dob','birth date','birthday','date_of_birth','date of birth (mm/dd/yyyy)');
    m('ssn',             'social security number','ssn','ss#','social security','full ssn','ssn (last 4)','social');
    m('maidenName',      "mother's maiden name","mothers maiden name","mother's maiden name",'maiden name','mother maiden name');
    m('annualIncome',    'annual income','yearly income','annual personal income','personal income','household income','personal annual income');
    m('citizen',         'us citizen','us citizenship','united states citizen','citizenship','citizen','are you a us citizen');

    // Home address from custom fields (fallback)
    m('street', 'home address','home street','street address','residential address','personal address','home street address');
    m('city',   'home city','city');
    m('state',  'home state','state');
    m('zip',    'home zip','zip code','postal code','zip');

    return out;
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

      // Fetch field definitions + form submissions in parallel
      const [fieldDefs, formSubmissions] = await Promise.all([
        getCustomFieldDefs(),
        getContactFormSubmissions(contact.id),
      ]);

      const fieldDefsMap = _buildFieldDefsMap(fieldDefs);
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
    const d = phone.replace(/\D/g,'').replace(/^1/, '');
    if (d.length === 10) return '(' + d.slice(0,3) + ') ' + d.slice(3,6) + '-' + d.slice(6);
    return phone;
  }

  // ── PUBLIC API ───────────────────────────────────────────────────────────
  return {
    // Settings
    getSettings, saveSettings,
    // Contacts
    searchContacts, getContact, createContact, updateContact,
    lookupContact, importAllContacts,
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
    processQueue, startRetryProcessor, getSyncLog, getRetryQueue,
    clearBadgeError,
    // Polling
    startPolling, stopPolling,
    // Utils
    e164: _e164, fmtPhone: _fmtPhone,
  };
})();
