// CapitalQuest Daily Summary Scheduler
// ─────────────────────────────────────
// Runs 4 sends per day (all times America/New_York):
//   9 AM  → full morning brief
//  12 PM  → reminder (active unfinished tasks only)
//   3 PM  → reminder (active unfinished tasks only)
//   6 PM  → full end-of-day recap
//
// Email via nodemailer SMTP  |  SMS via Twilio REST API
// Task data synced from admin.html → tasks-cache.json
// Client data synced from admin.html → clients-cache.json

import cron        from 'node-cron';
import nodemailer  from 'nodemailer';
import https       from 'https';
import fs          from 'fs';
import path        from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CFG_FILE      = path.join(__dirname, 'scheduler-config.json');
const TASKS_FILE    = path.join(__dirname, 'tasks-cache.json');
const CLIENTS_FILE  = path.join(__dirname, 'clients-cache.json');

// ── Firestore REST API (primary data source on Railway) ───────────────────────
const FS_PROJECT = 'capitalquest-portal';
const FS_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyAlNWS38LA53121Bm0K2QaAKO-TGv3pNI4';
const FS_BASE    = `https://firestore.googleapis.com/v1/projects/${FS_PROJECT}/databases/(default)/documents`;

function fsHttpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// Parse a Firestore field value into a plain JS value
function fsVal(v) {
  if (!v) return null;
  if ('stringValue'    in v) return v.stringValue;
  if ('integerValue'   in v) return parseInt(v.integerValue);
  if ('doubleValue'    in v) return v.doubleValue;
  if ('booleanValue'   in v) return v.booleanValue;
  if ('nullValue'      in v) return null;
  if ('timestampValue' in v) return new Date(v.timestampValue).getTime();
  if ('arrayValue'     in v) return (v.arrayValue.values || []).map(fsVal);
  if ('mapValue'       in v) {
    const o = {};
    for (const [k, val] of Object.entries(v.mapValue.fields || {})) o[k] = fsVal(val);
    return o;
  }
  return null;
}

function fsParseDoc(doc) {
  const id  = (doc.name || '').split('/').pop();
  const obj = { id };
  for (const [k, v] of Object.entries(doc.fields || {})) obj[k] = fsVal(v);
  return obj;
}

async function fsGetCollection(collection) {
  const docs = [];
  let url = `${FS_BASE}/${collection}?key=${FS_API_KEY}&pageSize=300`;
  while (url) {
    const res = await fsHttpGet(url);
    if (res.error) throw new Error(res.error.message || JSON.stringify(res.error));
    (res.documents || []).forEach(d => docs.push(fsParseDoc(d)));
    url = res.nextPageToken ? `${FS_BASE}/${collection}?key=${FS_API_KEY}&pageSize=300&pageToken=${res.nextPageToken}` : null;
  }
  return docs;
}

async function loadClientsLive() {
  try {
    const docs = await fsGetCollection('clients');
    if (docs.length > 0) {
      console.log(`[Scheduler] Firestore: loaded ${docs.length} clients`);
      return docs;
    }
  } catch(e) {
    console.warn('[Scheduler] Firestore clients failed:', e.message, '— falling back to cache');
  }
  return loadClients(); // cache fallback
}

async function loadTasksLive() {
  try {
    const dashDocs = await fsGetCollection('dashboards');
    const taskMap  = {};
    let   count    = 0;
    for (const dash of dashDocs) {
      if (Array.isArray(dash.opsTasks) && dash.opsTasks.length > 0) {
        taskMap[dash.id] = dash.opsTasks;
        count += dash.opsTasks.length;
      }
    }
    if (count > 0) {
      console.log(`[Scheduler] Firestore: loaded ${count} ops tasks across ${Object.keys(taskMap).length} clients`);
      return taskMap;
    }
  } catch(e) {
    console.warn('[Scheduler] Firestore tasks failed:', e.message, '— falling back to cache');
  }
  return loadTasks(); // cache fallback
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadConfig() {
  try {
    const cfg = JSON.parse(fs.readFileSync(CFG_FILE, 'utf8'));
    // Env var overrides (used in Railway deployment — set via Railway dashboard)
    if (process.env.EMAIL_PASS && cfg.email) cfg.email.pass = process.env.EMAIL_PASS;
    if (process.env.EMAIL_USER && cfg.email) cfg.email.user = process.env.EMAIL_USER;
    if (process.env.EMAIL_FROM && cfg.email) cfg.email.from = process.env.EMAIL_FROM;
    if (process.env.SMS_FROM_PHONE && cfg.sms) cfg.sms.fromPhone = process.env.SMS_FROM_PHONE;
    return cfg;
  } catch(e) {
    console.error('[Scheduler] Could not read scheduler-config.json:', e.message);
    return null;
  }
}

function loadTasks() {
  try {
    return fs.existsSync(TASKS_FILE) ? JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8')) : {};
  } catch(e) { return {}; }
}

function loadClients() {
  try {
    return fs.existsSync(CLIENTS_FILE) ? JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf8')) : [];
  } catch(e) { return []; }
}

function todayStr() { return new Date().toISOString().split('T')[0]; }
function tomorrowStr() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
function fmtDate(str) {
  if (!str) return '—';
  try { return new Date(str + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch(e) { return str; }
}
function daysSince(ts) {
  if (!ts) return 999;
  const ms = typeof ts === 'number' ? ts : new Date(ts).getTime();
  return Math.floor((Date.now() - ms) / 86400000);
}

// ── Task Aggregation ──────────────────────────────────────────────────────────

async function aggregateTasks(cfg) {
  const taskMap    = await loadTasksLive();
  const clients    = await loadClientsLive();
  const clientById = Object.fromEntries(clients.map(c => [c.id, c]));
  const today      = todayStr();
  const tomorrow   = tomorrowStr();
  const thresholds = cfg.thresholds || {};
  const noActDays  = thresholds.noActivityDays || 5;
  const stageLimits = thresholds.stageStuck || { 0:7, 1:45, 2:14, 3:14, 4:10 };

  const overdue    = [];
  const dueToday   = [];
  const dueTomorrow = [];
  const completed  = [];
  const critical   = [];

  for (const [clientId, tasks] of Object.entries(taskMap)) {
    const client = clientById[clientId] || { id: clientId, fname: 'Unknown', lname: '' };
    const name = `${client.fname || ''} ${client.lname || ''}`.trim() || 'Unknown';

    for (const t of (tasks || [])) {
      const entry = { clientId, clientName: name, task: t };
      if (t.status === 'completed') {
        const hrs = t.completedAt ? (Date.now() - t.completedAt) / 3600000 : 999;
        if (hrs <= 24) completed.push(entry);
      } else {
        const isOverdue = t.status === 'overdue' ||
          (t.dueDate && new Date(t.dueDate + 'T23:59:00') < new Date() && t.status !== 'completed');
        if (isOverdue) {
          overdue.push(entry);
        } else if (t.dueDate === today) {
          dueToday.push(entry);
        } else if (t.dueDate === tomorrow) {
          dueTomorrow.push(entry);
        }
        if (t.priority === 'critical' || t.priority === 'high') {
          if (!isOverdue && t.dueDate !== today) critical.push(entry);
        }
      }
    }
  }

  // Stuck clients: no activity in noActDays+
  const stuckClients = clients.filter(c => {
    if (c.archived || c.status === 'closed') return false;
    return daysSince(c.lastActivity || c.createdAt) >= noActDays;
  }).map(c => ({
    id: c.id,
    name: `${c.fname || ''} ${c.lname || ''}`.trim(),
    daysSince: daysSince(c.lastActivity || c.createdAt),
  }));

  // Stage-stuck clients
  const stageStagNames = ['Initial Setup', 'Credit Optimization', 'Funding Strategy', 'Application Phase', 'Decision / Results'];
  const stageStuck = clients.filter(c => {
    if (c.archived || c.status === 'closed') return false;
    const stage = c.currentStage != null ? Number(c.currentStage) : null;
    if (stage === null) return false;
    const limit = stageLimits[String(stage)] || stageLimits[stage] || 999;
    return daysSince(c.stageEnteredAt || c.lastActivity || c.createdAt) >= limit;
  }).map(c => ({
    id: c.id,
    name: `${c.fname || ''} ${c.lname || ''}`.trim(),
    stage: stageStagNames[c.currentStage] || `Stage ${c.currentStage}`,
    days: daysSince(c.stageEnteredAt || c.lastActivity || c.createdAt),
  }));

  // Funding snapshot
  const approved = clients.reduce((sum, c) => sum + (c.fundingApprovedAmount || 0), 0);
  const approvedToday = clients.filter(c => c.fundingApprovedDate === today)
    .reduce((sum, c) => sum + (c.fundingApprovedAmount || 0), 0);

  return { overdue, dueToday, dueTomorrow, completed, critical, stuckClients, stageStuck, approvedToday, approved };
}

// ── Email Templates ───────────────────────────────────────────────────────────

const STAGE_NAMES = ['Initial Setup','Credit Optimization','Funding Strategy','Application Phase','Decision / Results'];

function getStageLabel(task, clients) {
  const client = clients ? clients.find(c => c.id === task.clientId) : null;
  if (task.stage != null) return STAGE_NAMES[task.stage] || `Stage ${task.stage}`;
  if (client && client.currentStage != null) return STAGE_NAMES[client.currentStage] || `Stage ${client.currentStage}`;
  return '—';
}

function getStatusLabel(task, isOverdue) {
  if (isOverdue && task.priority === 'critical') return ['Needs Immediate Attention', '#dc2626', '#fef2f2'];
  if (isOverdue)                                 return ['Past Due — Action Required', '#dc2626', '#fef2f2'];
  if (task.dueDate === todayStr() && task.priority === 'critical') return ['Critical — Due Today', '#b91c1c', '#fef2f2'];
  if (task.dueDate === todayStr())               return ['Awaiting Client Action', '#f59e0b', '#fffbeb'];
  if (task.priority === 'critical')              return ['Critical — Action Required', '#dc2626', '#fef2f2'];
  if (task.priority === 'high')                  return ['High Priority', '#f59e0b', '#fffbeb'];
  return ['In Progress', '#6b7280', '#f3f4f6'];
}

function getPriorityColor(priority) {
  return { critical:'#dc2626', high:'#f59e0b', medium:'#3b82f6', low:'#9ca3af' }[priority] || '#6b7280';
}

function getDueColor(task) {
  if (!task.dueDate) return '#6b7280';
  const today = todayStr();
  if (new Date(task.dueDate) < new Date(today)) return '#dc2626';
  if (task.dueDate === today) return '#f59e0b';
  return '#374151';
}

function kpiRow(cards) {
  const w = Math.floor(100 / cards.length);
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px">
    <tr>
      ${cards.map(([color, bg, label, n]) => `
      <td width="${w}%" style="padding:0 5px 0 0">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <tr><td style="background:${bg};border:1.5px solid ${color}44;border-radius:10px;padding:14px 10px;text-align:center">
            <div style="font-size:30px;font-weight:900;color:${color};line-height:1;font-variant-numeric:tabular-nums">${n}</div>
            <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;margin-top:5px">${label}</div>
          </td></tr>
        </table>
      </td>`).join('')}
    </tr>
  </table>`;
}

// Alias used by full/reminder builders
function kpiCards(cards) { return kpiRow(cards); }

function urgencyBadge(task, isOverdue) {
  if (task.priority === 'critical') return `<span style="display:inline-block;background:#fef2f2;color:#dc2626;border:1.5px solid #fca5a5;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">🔴 Critical</span>`;
  if (isOverdue)                    return `<span style="display:inline-block;background:#fff7ed;color:#ea580c;border:1.5px solid #fdba74;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">🟠 Overdue</span>`;
  if (task.dueDate === todayStr())   return `<span style="display:inline-block;background:#fffbeb;color:#d97706;border:1.5px solid #fcd34d;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">🟡 Due Today</span>`;
  return                               `<span style="display:inline-block;background:#f0fdf4;color:#15803d;border:1.5px solid #86efac;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">🟢 On Track</span>`;
}

function clientCard(entry, clients) {
  const { clientName, task } = entry;
  const isOverdue = task.status === 'overdue' || (task.dueDate && new Date(task.dueDate + 'T23:59:00') < new Date() && task.status !== 'completed');
  const [statusLabel, statusColor, statusBg] = getStatusLabel(task, isOverdue);
  const accentColor = task.priority === 'critical' ? '#dc2626'
                    : isOverdue                    ? '#f97316'
                    : task.dueDate === todayStr()  ? '#f59e0b'
                    : '#22a7f0';
  const priColor  = getPriorityColor(task.priority);
  const dueColor  = getDueColor(task);
  const stageLabel = getStageLabel(task, clients);
  const assignedTo = task.assignedTo || '—';
  const needed   = smartNeeded(task);
  const nextStep = smartNextStep(task);
  const pending  = pendingDays(task);
  const due      = friendlyDue(task);
  const pri      = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium';

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px">
    <tr>
      <td width="4" style="background:${accentColor};border-radius:4px 0 0 4px">&nbsp;</td>
      <td style="background:#ffffff;border:1px solid #e5e7eb;border-left:none;border-radius:0 10px 10px 0;padding:18px 20px">

        <!-- Client name + badge -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:14px">
          <tr>
            <td>
              <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">👤 Client</div>
              <div style="font-size:17px;font-weight:800;color:#111827">${clientName}</div>
            </td>
            <td align="right" valign="top">${urgencyBadge(task, isOverdue)}</td>
          </tr>
        </table>

        <!-- Task name -->
        <div style="background:#f8fafc;border-radius:6px;padding:10px 14px;margin-bottom:14px;border-left:3px solid ${accentColor}">
          <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Task</div>
          <div style="font-size:14px;font-weight:700;color:#1e293b">${task.title}</div>
        </div>

        <!-- Details grid -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:14px">
          <tr>
            <td width="25%" style="padding:0 8px 10px 0;vertical-align:top">
              <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Stage</div>
              <div style="font-size:12px;color:#374151;font-weight:600">${stageLabel}</div>
            </td>
            <td width="25%" style="padding:0 8px 10px 0;vertical-align:top">
              <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Assigned</div>
              <div style="font-size:12px;color:#374151;font-weight:600">${assignedTo}</div>
            </td>
            <td width="25%" style="padding:0 8px 10px 0;vertical-align:top">
              <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Pending</div>
              <div style="font-size:13px;font-weight:800;color:${isOverdue ? '#dc2626' : '#f59e0b'}">${pending}</div>
            </td>
            <td width="25%" style="padding:0 0 10px 0;vertical-align:top">
              <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Due</div>
              <div style="font-size:13px;font-weight:800;color:${dueColor}">${due}</div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding:0 8px 0 0;vertical-align:top">
              <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Priority</div>
              <div style="font-size:12px;font-weight:700;color:${priColor}">${pri}</div>
            </td>
            <td colspan="2" style="vertical-align:top">
              <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Status</div>
              <div style="font-size:12px;font-weight:700;color:${statusColor}">${statusLabel}</div>
            </td>
          </tr>
        </table>

        <!-- What's needed -->
        <div style="background:#fffbeb;border-radius:6px;padding:10px 14px;margin-bottom:8px;border:1px solid #fde68a">
          <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px">What's Needed</div>
          <div style="font-size:12px;color:#374151;line-height:1.6">${needed}</div>
        </div>

        <!-- Next step -->
        <div style="background:#eff6ff;border-radius:6px;padding:10px 14px;border:1px solid #bfdbfe">
          <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px">→ Next Step</div>
          <div style="font-size:12px;color:#1e40af;line-height:1.6;font-weight:600">${nextStep}</div>
        </div>

      </td>
    </tr>
  </table>`;
}

function sectionBlock(emoji, title, color, bg, items, clients) {
  if (!items.length) return '';
  return `
  <div style="margin-bottom:32px">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px">
      <tr>
        <td style="background:${color};padding:12px 18px;border-radius:8px">
          <span style="font-size:15px">${emoji}</span>
          <span style="color:white;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;margin-left:8px">${title}</span>
          <span style="float:right;background:rgba(255,255,255,0.2);color:white;border-radius:20px;padding:2px 12px;font-size:12px;font-weight:800">${items.length}</span>
        </td>
      </tr>
    </table>
    ${items.map(entry => clientCard(entry, clients)).join('')}
  </div>`;
}

function stuckClientCard(c) {
  const lastAct = c.lastActivity
    ? new Date(typeof c.lastActivity === 'number' ? c.lastActivity : c.lastActivity)
        .toLocaleDateString('en-US', { month:'short', day:'numeric' })
    : '—';
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px">
    <tr>
      <td width="4" style="background:#7c3aed;border-radius:4px 0 0 4px">&nbsp;</td>
      <td style="background:#faf5ff;border:1px solid #ddd6fe;border-left:none;border-radius:0 10px 10px 0;padding:18px 20px">
        <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">⏸️ Client</div>
        <div style="font-size:17px;font-weight:800;color:#111827;margin-bottom:14px">${c.name}</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:12px">
          <tr>
            <td width="33%" style="padding:0 8px 8px 0;vertical-align:top">
              <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Stage</div>
              <div style="font-size:12px;color:#374151;font-weight:600">${c.stage || '—'}</div>
            </td>
            <td width="33%" style="padding:0 8px 8px 0;vertical-align:top">
              <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Stuck</div>
              <div style="font-size:14px;font-weight:800;color:#7c3aed">${c.daysSince || c.days} days</div>
            </td>
            <td width="33%" style="padding:0 0 8px 0;vertical-align:top">
              <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Last Activity</div>
              <div style="font-size:12px;color:#374151;font-weight:600">${lastAct}</div>
            </td>
          </tr>
        </table>
        <div style="background:white;border-radius:6px;padding:10px 14px;margin-bottom:8px;border:1px solid #ddd6fe">
          <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px">Blocked By</div>
          <div style="font-size:12px;color:#374151;line-height:1.6">${c.stuckReason || 'No recent updates or activity logged'}</div>
        </div>
        <div style="background:#eff6ff;border-radius:6px;padding:10px 14px;border:1px solid #bfdbfe">
          <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px">→ Recommended Action</div>
          <div style="font-size:12px;color:#1e40af;line-height:1.6;font-weight:600">${c.recommendedAction || 'Follow up with client and request status update'}</div>
        </div>
      </td>
    </tr>
  </table>`;
}

function emailShell(label, dateStr, timeStr, kpiHtml, bodyHtml, totalCount) {
  const urgentColor = totalCount > 0 ? '#dc2626' : '#059669';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${label}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">

<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
<tr><td align="center" style="padding:24px 12px">

<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:640px">

  <!-- HERO HEADER -->
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1a1f4b 50%,#0c1a3d 100%);padding:32px 32px 28px;border-radius:16px 16px 0 0">

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px">
      <tr>
        <td>
          <div style="color:#38bdf8;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:6px">CapitalQuest Consulting</div>
          <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.01em;line-height:1.2">${label}</div>
          <div style="color:#64748b;font-size:12px;margin-top:6px">Live operational summary · ${dateStr} at ${timeStr}</div>
        </td>
        <td align="right" valign="top">
          <div style="background:${urgentColor};color:white;border-radius:50%;width:48px;height:48px;text-align:center;line-height:48px;font-size:20px;font-weight:900;display:inline-block">${totalCount}</div>
          <div style="color:#64748b;font-size:10px;text-align:center;margin-top:4px">urgent</div>
        </td>
      </tr>
    </table>

    <!-- KPI bar inside header -->
    ${kpiHtml}

  </td></tr>

  <!-- BODY -->
  <tr><td style="background:#ffffff;padding:28px 32px">${bodyHtml}</td></tr>

  <!-- CTA FOOTER -->
  <tr><td style="background:#0f172a;padding:24px 32px;border-radius:0 0 16px 16px;text-align:center">
    <a href="http://localhost:3002/admin.html"
       style="display:inline-block;background:#22a7f0;color:white;text-decoration:none;font-size:14px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;padding:14px 36px;border-radius:8px;margin-bottom:14px">
      OPEN ADMIN PORTAL →
    </a>
    <div style="color:#475569;font-size:11px">CapitalQuest Admin Scheduler &nbsp;·&nbsp; ${dateStr}</div>
  </td></tr>

</table>
</td></tr>
</table>

</body></html>`;
}

function buildFullEmailHtml(label, data) {
  const { overdue, dueToday, dueTomorrow, completed, critical, stuckClients, stageStuck, approvedToday, approved } = data;
  const clients  = loadClients();
  const now      = new Date();
  const dateStr  = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
  const timeStr  = now.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true });
  const total    = overdue.length + dueToday.length + critical.length;

  const allStuck = [
    ...stuckClients,
    ...stageStuck.filter(ss => !stuckClients.find(sc => sc.id === ss.id)),
  ];

  const kpiHtml = `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    <tr>
      ${[
        ['#fca5a5','#7f1d1d','Overdue',   overdue.length],
        ['#fcd34d','#78350f','Due Today',  dueToday.length],
        ['#c4b5fd','#4c1d95','Critical',   critical.length],
        ['#6ee7b7','#064e3b','Completed',  completed.length],
      ].map(([bg, color, lbl, n]) => `
      <td width="25%" style="padding:0 4px 0 0">
        <div style="background:${bg}22;border:1px solid ${bg}55;border-radius:8px;padding:12px 6px;text-align:center">
          <div style="font-size:26px;font-weight:900;color:${bg};line-height:1">${n}</div>
          <div style="font-size:9px;font-weight:700;color:${bg}cc;text-transform:uppercase;letter-spacing:0.07em;margin-top:4px">${lbl}</div>
        </div>
      </td>`).join('')}
    </tr>
  </table>`;

  const bodyHtml = [
    sectionBlock('🚨','Critical Tasks',   '#b91c1c','#fef2f2', critical,   clients),
    sectionBlock('⚠️','Overdue Tasks',    '#c2410c','#fff7ed', overdue,    clients),
    sectionBlock('📅','Due Today',        '#1d4ed8','#eff6ff', dueToday,   clients),
    dueTomorrow.length ? sectionBlock('🗓️','Due Tomorrow','#374151','#f8fafc', dueTomorrow, clients) : '',
    completed.length   ? sectionBlock('✅','Completed Today','#15803d','#f0fdf4', completed, clients) : '',

    allStuck.length ? `
    <div style="margin-bottom:32px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px">
        <tr><td style="background:#6d28d9;padding:12px 18px;border-radius:8px">
          <span style="font-size:15px">🛑</span>
          <span style="color:white;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;margin-left:8px">Stuck Clients</span>
          <span style="float:right;background:rgba(255,255,255,0.2);color:white;border-radius:20px;padding:2px 12px;font-size:12px;font-weight:800">${allStuck.length}</span>
        </td></tr>
      </table>
      ${allStuck.map(c => stuckClientCard(c)).join('')}
    </div>` : '',

    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr><td style="background:linear-gradient(135deg,#064e3b,#065f46);border-radius:12px;padding:24px 24px">
        <div style="color:#6ee7b7;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px">🏦 Funding Operations</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <tr>
            <td width="50%" style="text-align:center;padding:0 12px 0 0;border-right:1px solid #065f46">
              <div style="font-size:32px;font-weight:900;color:#6ee7b7;line-height:1">$${approvedToday.toLocaleString()}</div>
              <div style="font-size:11px;color:#a7f3d0;margin-top:6px;text-transform:uppercase;letter-spacing:0.05em">Approved Today</div>
            </td>
            <td width="50%" style="text-align:center;padding:0 0 0 12px">
              <div style="font-size:32px;font-weight:900;color:#ffffff;line-height:1">$${approved.toLocaleString()}</div>
              <div style="font-size:11px;color:#a7f3d0;margin-top:6px;text-transform:uppercase;letter-spacing:0.05em">All-Time Approved</div>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>`,
  ].join('');

  return emailShell(label, dateStr, timeStr, kpiHtml, bodyHtml, total);
}

function buildReminderEmailHtml(label, data) {
  const { overdue, dueToday, critical } = data;
  const clients = loadClients();
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true });
  const total   = overdue.length + dueToday.length + critical.length;

  const kpiHtml = `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    <tr>
      ${[
        ['#fca5a5','#7f1d1d','Overdue',  overdue.length],
        ['#fcd34d','#78350f','Due Today', dueToday.length],
        ['#c4b5fd','#4c1d95','Critical',  critical.length],
        ['#94a3b8','#1e293b','Total',     total],
      ].map(([bg, color, lbl, n]) => `
      <td width="25%" style="padding:0 4px 0 0">
        <div style="background:${bg}22;border:1px solid ${bg}55;border-radius:8px;padding:12px 6px;text-align:center">
          <div style="font-size:26px;font-weight:900;color:${bg};line-height:1">${n}</div>
          <div style="font-size:9px;font-weight:700;color:${bg}cc;text-transform:uppercase;letter-spacing:0.07em;margin-top:4px">${lbl}</div>
        </div>
      </td>`).join('')}
    </tr>
  </table>`;

  const bodyHtml = total === 0
    ? `<div style="text-align:center;padding:40px 20px">
        <div style="font-size:48px;margin-bottom:14px">✅</div>
        <div style="font-size:18px;font-weight:800;color:#059669">All clear — no urgent tasks right now.</div>
        <div style="font-size:13px;color:#6b7280;margin-top:8px">Open the portal to view all client activity.</div>
      </div>`
    : [
        sectionBlock('🚨','Critical Tasks',  '#b91c1c','#fef2f2', critical, clients),
        sectionBlock('⚠️','Overdue Tasks',   '#c2410c','#fff7ed', overdue,  clients),
        sectionBlock('📅','Due Today',       '#1d4ed8','#eff6ff', dueToday, clients),
      ].join('');

  return emailShell(label, dateStr, timeStr, kpiHtml, bodyHtml, total);
}

// ── SMS Text Builders ─────────────────────────────────────────────────────────

// ── SMS Detail Helpers ────────────────────────────────────────────────────────

const DIVIDER = '━━━━━━━━━━━━━━';

function pendingDays(task) {
  const ms = task.createdAt ? (Date.now() - task.createdAt) : 0;
  const d  = Math.max(0, Math.floor(ms / 86400000));
  return d === 0 ? 'Today' : d === 1 ? '1 day' : `${d} days`;
}

function friendlyDue(task) {
  if (!task.dueDate) return '—';
  const today    = todayStr();
  const tomorrow = tomorrowStr();
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; })();
  const timePart = task.dueTime ? ` ${fmtTime(task.dueTime)}` : '';
  if (task.dueDate === today)     return `Today${timePart}`;
  if (task.dueDate === yesterday) return 'Yesterday';
  if (task.dueDate === tomorrow)  return `Tomorrow${timePart}`;
  // Past dates show "X days ago"
  const diff = Math.floor((new Date(today) - new Date(task.dueDate)) / 86400000);
  if (diff > 1) return `${diff} days ago`;
  return fmtDate(task.dueDate);
}

function fmtTime(t) {
  if (!t) return '';
  try {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
  } catch(e) { return t; }
}

function smartNeeded(task) {
  if (task.description && task.description.trim()) return task.description.trim();
  const t = (task.title || '').toLowerCase();
  if (t.includes('inquiry') || t.includes('inquiries')) return 'Client must submit inquiry removal docs';
  if (t.includes('bank statement') || t.includes('upload'))  return 'Client must upload required documents';
  if (t.includes('chase') || t.includes('checking') || t.includes('account')) return 'Open account + fund minimum deposit';
  if (t.includes('amex') || t.includes('recon'))  return 'Call recon line + document decision';
  if (t.includes('contract') || t.includes('onboard')) return 'Review signed contract + onboarding submission';
  if (t.includes('application') || t.includes('apply')) return 'Complete and submit funding application';
  if (t.includes('credit') || t.includes('score'))  return 'Review credit profile + action plan';
  if (t.includes('document') || t.includes('doc'))  return 'Collect and review required documents';
  return 'Complete assigned task and update portal';
}

function smartNextStep(task) {
  if (task.fundingImpact && task.fundingImpact.trim()) return task.fundingImpact.trim();
  const t = (task.title || '').toLowerCase();
  if (t.includes('inquiry') || t.includes('inquiries')) return 'Follow up with client';
  if (t.includes('upload') || t.includes('statement'))  return 'Request documents from client';
  if (t.includes('chase') || t.includes('checking') || t.includes('account')) return 'Confirm account opened + screenshot';
  if (t.includes('amex') || t.includes('recon'))  return 'Upload decision notes to portal';
  if (t.includes('contract') || t.includes('onboard')) return 'Begin onboarding / application review';
  if (t.includes('application') || t.includes('apply')) return 'Submit application + notify client';
  if (t.includes('review') || t.includes('audit'))     return 'Review docs + leave notes';
  if (t.includes('follow') || t.includes('call'))      return 'Call client + log outcome';
  return 'Follow up with client + update portal';
}

function formatTaskBlock(entry) {
  const { clientName, task } = entry;
  const lines = [
    DIVIDER,
    `Client: ${clientName}`,
    `Task: ${task.title}`,
    `Pending: ${pendingDays(task)}`,
    `Due: ${friendlyDue(task)}`,
    `Needed: ${smartNeeded(task)}`,
    `Next Step: ${smartNextStep(task)}`,
  ];
  if (task.priority === 'critical' || task.priority === 'high') {
    lines.push(`Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`);
  }
  return lines.join('\n');
}

function buildDetailedSms(header, sections, totalCount) {
  const now  = new Date();
  const date = now.toLocaleDateString('en-US', { month:'short', day:'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true });

  const lines = [`CapitalQuest Admin Reminder`, `${date} — ${time}`, ''];

  // Flatten all tasks in priority order for top-5 cap
  const allTasks = [];
  for (const { emoji, label, items } of sections) {
    items.forEach(item => allTasks.push({ emoji, label, item }));
  }

  const MAX = 5;
  const shown  = allTasks.slice(0, MAX);
  const hidden = allTasks.length - shown.length;

  // Group shown tasks back by section
  const shownBySection = {};
  shown.forEach(({ emoji, label, item }) => {
    const key = `${emoji} ${label}`;
    if (!shownBySection[key]) shownBySection[key] = [];
    shownBySection[key].push(item);
  });

  for (const [sectionHeader, items] of Object.entries(shownBySection)) {
    lines.push(sectionHeader, '');
    items.forEach(item => { lines.push(formatTaskBlock(item)); lines.push(''); });
  }

  if (hidden > 0) {
    lines.push(DIVIDER, `+${hidden} more pending tasks`, 'Check portal for full list.');
  } else if (allTasks.length === 0) {
    lines.push('All clear — no urgent tasks right now.');
  } else {
    lines.push(DIVIDER, 'Check portal for full list.');
  }

  lines.push('', 'CapitalQuest Admin');
  return lines.join('\n');
}

// ── SMS Builders ──────────────────────────────────────────────────────────────

function buildFullSmsText(data) {
  const { overdue, dueToday, critical, completed, stuckClients, approvedToday } = data;

  const sections = [];
  if (overdue.length)   sections.push({ emoji: '🚨', label: 'OVERDUE',    items: overdue });
  if (dueToday.length)  sections.push({ emoji: '⚠️', label: 'DUE TODAY',  items: dueToday });
  if (critical.length)  sections.push({ emoji: '🔥', label: 'CRITICAL',   items: critical });
  if (stuckClients.length) {
    // Convert stuck clients to task-like entries for display
    const stuckItems = stuckClients.map(c => ({
      clientName: c.name,
      task: { title: 'No activity', dueDate: '', createdAt: Date.now() - c.daysSince * 86400000,
              description: `No updates in ${c.daysSince} days`, fundingImpact: 'Re-engage client — check in on progress' }
    }));
    sections.push({ emoji: '⏸️', label: 'STUCK CLIENTS', items: stuckItems });
  }

  const total = overdue.length + dueToday.length + critical.length + stuckClients.length;
  let text = buildDetailedSms('Morning Brief', sections, total);

  if (approvedToday > 0) {
    text += `\n\n💰 Funding Approved Today: $${approvedToday.toLocaleString()}`;
  }
  if (completed.length > 0) {
    text += `\n✅ Completed Today: ${completed.length}`;
  }
  return text;
}

function buildReminderSmsText(data) {
  const { overdue, dueToday, critical } = data;

  const sections = [];
  if (overdue.length)   sections.push({ emoji: '🚨', label: 'OVERDUE',   items: overdue });
  if (dueToday.length)  sections.push({ emoji: '⚠️', label: 'DUE TODAY', items: dueToday });
  if (critical.length)  sections.push({ emoji: '🔥', label: 'CRITICAL',  items: critical });

  const total = overdue.length + dueToday.length + critical.length;
  return buildDetailedSms('Task Reminder', sections, total);
}

// ── Email Sender ──────────────────────────────────────────────────────────────

async function sendEmails(cfg, subject, htmlBody) {
  const { email, recipients } = cfg;
  if (!email || !email.user || !email.pass || email.pass === 'YOUR_APP_PASSWORD_HERE' || email.pass === 'TASKS_APP_PASSWORD_HERE') {
    console.warn('[Scheduler] Email not configured — skipping email send');
    console.warn('[Scheduler] Set email.user = tasks@capitalquestfunding.com and email.pass = App Password in scheduler-config.json');
    return;
  }
  const transporter = nodemailer.createTransport({
    host:   email.host   || 'smtp.gmail.com',
    port:   email.port   || 587,
    secure: email.secure || false,
    auth:   { user: email.user, pass: email.pass },
  });
  const mailFrom  = email.from    || `CapitalQuest Task Alerts <${email.user}>`;
  const mailReply = email.replyTo || null;
  for (const to of (recipients?.email || [])) {
    try {
      const msg = { from: mailFrom, to, subject, html: htmlBody };
      if (mailReply) msg.replyTo = mailReply;
      await transporter.sendMail(msg);
      console.log(`[Scheduler] Email sent → ${to} (from: ${mailFrom})`);
    } catch(e) {
      console.error(`[Scheduler] Email FAILED → ${to}:`, e.message);
    }
  }
}

// ── SMS Sender (via GHL proxy) ────────────────────────────────────────────────
// Looks up each recipient's GHL contactId by phone, then sends via localhost:3001

import http from 'http';

function localPost(url, body) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      port:     u.port || 3001,
      path:     u.pathname,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    };
    const req = http.request(opts, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try { resolve({ status: r.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: r.statusCode, data: d }); }
      });
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.write(payload);
    req.end();
  });
}

function localGet(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      port:     u.port || 3001,
      path:     u.pathname + u.search,
      method:   'GET',
    };
    const req = http.request(opts, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try { resolve({ status: r.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: r.statusCode, data: d }); }
      });
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.end();
  });
}

// Cache contactIds looked up at startup
const _contactIdCache = {};

async function lookupGhlContactId(phone, proxyUrl) {
  const digits = phone.replace(/\D/g, '').replace(/^1/, '');
  if (_contactIdCache[digits]) return _contactIdCache[digits];
  try {
    const ghlCfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'ghl-config.json'), 'utf8'));
    const locId  = ghlCfg.locationId || '';
    const { status, data } = await localGet(
      `${proxyUrl}/api/ghl/contacts/?locationId=${locId}&query=${encodeURIComponent(digits)}`
    );
    if (status === 200) {
      const contacts = data?.contacts || data?.data || [];
      if (contacts.length > 0) {
        _contactIdCache[digits] = contacts[0].id;
        console.log(`[Scheduler] Found GHL contact for ${phone}: ${contacts[0].id} (${contacts[0].firstName || ''} ${contacts[0].lastName || ''})`);
        return contacts[0].id;
      }
    }
  } catch(e) { /* proxy not running */ }
  console.warn(`[Scheduler] Could not find GHL contact for ${phone} — SMS skipped for this recipient`);
  return null;
}

async function sendSms(cfg, smsText) {
  const { sms, recipients } = cfg;
  const proxyUrl = process.env.GHL_PROXY_PORT
    ? `http://localhost:${process.env.GHL_PROXY_PORT}`
    : ((sms && sms.proxyUrl) || 'http://localhost:3001');
  const fromPhone = sms && sms.fromPhone;

  if (!fromPhone || fromPhone === '+1XXXXXXXXXX') {
    console.warn('[Scheduler] SMS fromPhone not configured in scheduler-config.json — skipping SMS');
    return;
  }

  for (const recipient of (recipients?.sms || [])) {
    const contactId = await lookupGhlContactId(recipient.phone, proxyUrl);
    if (!contactId) continue;

    const { status, data, error } = await localPost(`${proxyUrl}/api/ghl/send-sms`, {
      contactId,
      message:   smsText,
      fromPhone,
    });

    if (error || status >= 400) {
      console.error(`[Scheduler] SMS FAILED → ${recipient.name} (${recipient.phone}):`, error || data?.error);
    } else {
      console.log(`[Scheduler] SMS sent → ${recipient.name} (${recipient.phone})`);
    }
  }
}

// ── Same-Day Recurring Task Reminders (SMS only) ──────────────────────────────
// Fires: 10 AM, 12 PM, 2 PM, 4 PM, 6 PM ET
// Includes ALL incomplete client tasks due today — no priority filter.
// Only skips: completed, cancelled, archived, closed.
// Dedup key: taskId_YYYY-MM-DD_HH — won't resend same task in the same hour slot.

const _sdSent = new Set(); // in-memory dedup; resets on process restart

// Statuses that mean "done — stop reminding"
const SKIP_STATUSES = new Set(['completed', 'cancelled', 'archived', 'closed']);

function capFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

async function buildSameDaySms() {
  const taskMap    = await loadTasksLive();
  const clients    = await loadClientsLive();
  const clientById = Object.fromEntries(clients.map(c => [c.id, c]));
  const today      = todayStr();
  const now        = new Date();
  const hourKey    = `${today}_${now.getHours()}`;

  const eligible = [];
  for (const [clientId, tasks] of Object.entries(taskMap)) {
    const client = clientById[clientId] || { id: clientId, fname: 'Unknown', lname: '' };
    const clientName = `${client.fname || ''} ${client.lname || ''}`.trim() || 'Unknown';
    for (const t of (tasks || [])) {
      // Skip only truly done/inactive statuses — ALL priorities included
      if (SKIP_STATUSES.has(t.status)) continue;
      if (t.dueDate !== today) continue;
      const key = `${t.id}_${hourKey}`;
      if (_sdSent.has(key)) continue; // already sent this hour
      eligible.push({ client, clientName, task: t, key });
    }
  }

  if (eligible.length === 0) return null;

  // Mark all as sent for this hour slot before building message
  eligible.forEach(e => _sdSent.add(e.key));

  const lines = ['CapitalQuest Task Reminder', ''];

  for (const { client, clientName, task: t } of eligible) {
    const stageIdx    = t.stage != null ? t.stage : (client.currentStage != null ? client.currentStage : 0);
    const stageLabel  = STAGE_NAMES[stageIdx] || `Stage ${stageIdx}`;
    const priorityLbl = capFirst(t.priority || 'medium');
    const pendingDays = t.createdAt ? Math.floor((Date.now() - t.createdAt) / 86400000) : 0;
    const dueTimeFmt  = t.dueTime ? ` ${t.dueTime}` : '';

    // Overdue: explicit status OR dueTime has already passed today
    let isOverdue = t.status === 'overdue';
    if (!isOverdue && t.dueTime) {
      const [hh, mm] = t.dueTime.split(':').map(Number);
      const deadline = new Date();
      deadline.setHours(hh, mm, 0, 0);
      if (now > deadline) isOverdue = true;
    }

    lines.push('──────────────');
    if (isOverdue) lines.push('⚠️ OVERDUE TASK');
    lines.push(`Client: ${clientName}`);
    lines.push(`Task: ${t.title || '—'}`);
    lines.push(`Priority: ${priorityLbl}`);
    lines.push(`Stage: ${stageLabel}`);
    lines.push(`Due: Today${dueTimeFmt}`);
    lines.push(`Pending: ${pendingDays} day${pendingDays !== 1 ? 's' : ''}`);
    if (t.description) {
      // Split on newline or " | " to separate action needed from next step
      const parts = t.description.split(/\n|\s\|\s/);
      lines.push(`What's Needed: ${parts[0].trim()}`);
      if (parts[1]) lines.push(`Next Step: ${parts[1].trim()}`);
    }
    lines.push('');
  }

  lines.push('──────────────');
  lines.push('Reply COMPLETE in portal when done.');
  lines.push('');
  lines.push('CapitalQuest Admin');

  return lines.join('\n');
}

async function runSameDayReminder(label) {
  console.log(`\n[Scheduler] ──── Same-Day Reminder (${label}) ────`);
  const cfg = loadConfig();
  if (!cfg)           { console.error('[Scheduler] Config missing — aborting'); return; }
  if (!cfg.enabled)   { console.log('[Scheduler] Disabled — skipping'); return; }

  const smsText = await buildSameDaySms();
  if (!smsText) {
    console.log('[Scheduler] No incomplete same-day tasks — skipping');
    return;
  }

  console.log('[Scheduler] Sending same-day reminders via SMS…');
  await sendSms(cfg, smsText);
  console.log(`[Scheduler] ──── Same-Day Reminder done ────\n`);
}

// ── Send Logic ────────────────────────────────────────────────────────────────

async function runSend(type, label) {
  console.log(`\n[Scheduler] ──── ${label} (${type}) ────`);
  const cfg = loadConfig();
  if (!cfg) { console.error('[Scheduler] Config missing — aborting'); return; }
  if (!cfg.enabled) { console.log('[Scheduler] Disabled in config — skipping'); return; }

  const data    = await aggregateTasks(cfg);
  const dateStr = new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  const isFull  = type === 'full';

  const subject  = isFull
    ? `CapitalQuest Daily Client Task Summary — ${dateStr}`
    : `CapitalQuest Task Reminder — ${label} — ${dateStr}`;
  const htmlBody = isFull ? buildFullEmailHtml(label, data) : buildReminderEmailHtml(label, data);
  const smsText  = isFull ? buildFullSmsText(data) : buildReminderSmsText(data);

  console.log(`[Scheduler] Data → overdue:${data.overdue.length} dueToday:${data.dueToday.length} completed:${data.completed.length} stuck:${data.stuckClients.length}`);

  await Promise.all([
    sendEmails(cfg, subject, htmlBody),
    sendSms(cfg, smsText),
  ]);
  console.log(`[Scheduler] ──── ${label} done ────\n`);
}

// ── Cron Setup ────────────────────────────────────────────────────────────────

const cfg = loadConfig();
if (!cfg) {
  console.error('[Scheduler] No scheduler-config.json found. Exiting.');
  process.exit(1);
}

const tz = cfg.timezone || 'America/New_York';
const schedule = cfg.schedule || {
  morning:   { cron: '0 9  * * *', type: 'full',     label: 'Morning Brief'      },
  midday:    { cron: '0 12 * * *', type: 'reminder', label: 'Midday Reminder'    },
  afternoon: { cron: '0 15 * * *', type: 'reminder', label: 'Afternoon Reminder' },
  evening:   { cron: '0 18 * * *', type: 'full',     label: 'End-of-Day Recap'   },
};

let scheduledCount = 0;
for (const [key, entry] of Object.entries(schedule)) {
  if (!entry.cron) continue;
  cron.schedule(entry.cron, () => runSend(entry.type, entry.label), { timezone: tz });
  console.log(`[Scheduler] Registered: ${entry.label} (${entry.cron} ${tz})`);
  scheduledCount++;
}

// Same-day reminder crons: every 2 hours, 10 AM–6 PM ET
const sameDayCrons = [
  { cron: '0 10 * * *', label: '10:00 AM' },
  { cron: '0 12 * * *', label: '12:00 PM' },
  { cron: '0 14 * * *', label: '2:00 PM'  },
  { cron: '0 16 * * *', label: '4:00 PM'  },
  { cron: '0 18 * * *', label: '6:00 PM'  },
];
for (const { cron: c, label } of sameDayCrons) {
  cron.schedule(c, () => runSameDayReminder(label), { timezone: tz });
  console.log(`[Scheduler] Registered same-day reminder: ${label} (${c} ${tz})`);
}

console.log(`\n[Scheduler] Running — ${scheduledCount} jobs scheduled in ${tz}`);
console.log('[Scheduler] Waiting for task/client cache from admin.html...');
console.log(`[Scheduler] Cache: ${fs.existsSync(TASKS_FILE) ? '✓' : '✗'} tasks-cache.json  |  ${fs.existsSync(CLIENTS_FILE) ? '✓' : '✗'} clients-cache.json\n`);

// Optional: run a test send immediately with --test flag
if (process.argv.includes('--test')) {
  console.log('[Scheduler] --test flag detected, running full send now...');
  runSend('full', 'Test Send');
}
if (process.argv.includes('--test-sameday')) {
  console.log('[Scheduler] --test-sameday flag detected, running same-day reminder now...');
  runSameDayReminder('Test');
}
