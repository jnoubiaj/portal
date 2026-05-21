// send-preview.mjs
// One-shot: sends a preview of the premium email template to all configured recipients.
// Uses demo data so it looks fully populated even without a live task cache.
// Run: node send-preview.mjs

import nodemailer from 'nodemailer';
import fs         from 'fs';
import path       from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'scheduler-config.json'), 'utf8'));

// ── Demo data ─────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0];
const YESTERDAY = (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; })();
const TOMORROW  = (() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; })();

const DEMO = {
  overdue: [
    { clientName: 'Marcus Johnson', task: { title: 'Inquiry Removal Follow-Up',       priority: 'critical', status: 'overdue', dueDate: YESTERDAY, createdAt: Date.now() - 8*86400000, assignedTo: 'Sam', stage: 2, description: 'Client must submit 3 bureau dispute letters + ID', fundingImpact: 'Call client — letters need to be mailed this week' } },
    { clientName: 'Aisha Williams', task: { title: 'Chase Business Checking Account',  priority: 'high',     status: 'overdue', dueDate: YESTERDAY, createdAt: Date.now() - 5*86400000, assignedTo: 'Ali', stage: 3, description: 'Open account + fund $2,000 minimum deposit',    fundingImpact: 'Confirm account opened + send screenshot to portal' } },
  ],
  dueToday: [
    { clientName: 'Derek Thompson', task: { title: 'Amex Business Reconsideration Call', priority: 'high', status: 'pending', dueDate: TODAY, createdAt: Date.now() - 3*86400000, assignedTo: 'Sam', stage: 3, description: 'Call Amex recon line at 1-800-567-1083 + document outcome', fundingImpact: 'Upload decision notes + recommended next product' } },
  ],
  dueTomorrow: [
    { clientName: 'Priya Patel',     task: { title: 'Business Plan Review',   priority: 'medium', status: 'pending', dueDate: TOMORROW, createdAt: Date.now() - 2*86400000, assignedTo: 'Ali', stage: 1, description: 'Review submitted business plan for completeness',  fundingImpact: 'Approve plan + move to application phase' } },
  ],
  completed: [
    { clientName: 'Jordan Lewis',    task: { title: 'Credit Score Audit',     priority: 'medium', status: 'completed', completedAt: Date.now() - 2*3600000, dueDate: TODAY, createdAt: Date.now() - 4*86400000, assignedTo: 'Sam', stage: 1 } },
  ],
  critical: [
    { clientName: 'Carlos Rivera',   task: { title: 'Funding Application Deadline', priority: 'critical', status: 'pending', dueDate: TOMORROW, createdAt: Date.now() - 6*86400000, assignedTo: 'Sam', stage: 4, description: 'Submit SBA loan application by EOD tomorrow', fundingImpact: 'Submit application + notify client of timeline' } },
  ],
  stuckClients: [
    { id: 's1', name: 'Michael Brown', daysSince: 9,  stage: 'Credit Optimization', lastActivity: Date.now() - 9*86400000,  stuckReason: 'Waiting on client to upload bank statements — 3 follow-ups sent', recommendedAction: 'Final notice email + schedule call for tomorrow' },
    { id: 's2', name: 'Keisha Davis',  daysSince: 12, stage: 'Funding Strategy',    lastActivity: Date.now() - 12*86400000, stuckReason: 'Client unresponsive since initial onboarding call',             recommendedAction: 'Send urgent re-engagement email with deadline' },
  ],
  stageStuck: [],
  approvedToday: 45000,
  approved:      387500,
};

// ── Email template (copied from scheduler.mjs) ────────────────────────────────

function todayStr() { return new Date().toISOString().split('T')[0]; }

function fmtDate(str) {
  if (!str) return '—';
  try { return new Date(str + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' }); }
  catch(e) { return str; }
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

function getStatusLabel(task, isOverdue) {
  if (isOverdue && task.priority === 'critical') return ['Needs Immediate Attention', '#dc2626', '#fef2f2'];
  if (isOverdue)                                 return ['Past Due — Action Required', '#dc2626', '#fef2f2'];
  if (task.dueDate === todayStr() && task.priority === 'critical') return ['Critical — Due Today', '#b91c1c', '#fef2f2'];
  if (task.dueDate === todayStr())               return ['Awaiting Client Action', '#f59e0b', '#fffbeb'];
  if (task.priority === 'critical')              return ['Critical — Action Required', '#dc2626', '#fef2f2'];
  if (task.priority === 'high')                  return ['High Priority', '#f59e0b', '#fffbeb'];
  return ['In Progress', '#6b7280', '#f3f4f6'];
}

const STAGE_NAMES = ['Initial Setup','Credit Optimization','Funding Strategy','Application Phase','Decision / Results'];

function getStageLabel(task) {
  if (task.stage != null) return STAGE_NAMES[task.stage] || `Stage ${task.stage}`;
  return '—';
}

function pendingDays(task) {
  const ms = task.createdAt ? (Date.now() - task.createdAt) : 0;
  const d  = Math.max(0, Math.floor(ms / 86400000));
  return d === 0 ? 'Today' : d === 1 ? '1 day' : `${d} days`;
}

function friendlyDue(task) {
  if (!task.dueDate) return '—';
  const today    = todayStr();
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; })();
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; })();
  if (task.dueDate === today)     return 'Today';
  if (task.dueDate === yesterday) return 'Yesterday';
  if (task.dueDate === tomorrow)  return 'Tomorrow';
  const diff = Math.floor((new Date(today) - new Date(task.dueDate)) / 86400000);
  if (diff > 1) return `${diff} days ago`;
  return fmtDate(task.dueDate);
}

function urgencyBadge(task, isOverdue) {
  if (task.priority === 'critical') return `<span style="display:inline-block;background:#fef2f2;color:#dc2626;border:1.5px solid #fca5a5;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">&#x1F534; Critical</span>`;
  if (isOverdue)                    return `<span style="display:inline-block;background:#fff7ed;color:#ea580c;border:1.5px solid #fdba74;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">&#x1F7E0; Overdue</span>`;
  if (task.dueDate === todayStr())   return `<span style="display:inline-block;background:#fffbeb;color:#d97706;border:1.5px solid #fcd34d;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">&#x1F7E1; Due Today</span>`;
  return                               `<span style="display:inline-block;background:#f0fdf4;color:#15803d;border:1.5px solid #86efac;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">&#x1F7E2; On Track</span>`;
}

function smartNeeded(task) {
  if (task.description && task.description.trim()) return task.description.trim();
  const t = (task.title || '').toLowerCase();
  if (t.includes('inquiry')) return 'Client must submit inquiry removal docs';
  if (t.includes('upload') || t.includes('statement')) return 'Client must upload required documents';
  if (t.includes('chase') || t.includes('checking'))  return 'Open account + fund minimum deposit';
  if (t.includes('amex') || t.includes('recon'))      return 'Call recon line + document decision';
  if (t.includes('contract') || t.includes('onboard')) return 'Review signed contract + onboarding submission';
  if (t.includes('application') || t.includes('apply')) return 'Complete and submit funding application';
  if (t.includes('credit') || t.includes('score'))    return 'Review credit profile + action plan';
  if (t.includes('document') || t.includes('doc'))    return 'Collect and review required documents';
  return 'Complete assigned task and update portal';
}

function smartNextStep(task) {
  if (task.fundingImpact && task.fundingImpact.trim()) return task.fundingImpact.trim();
  const t = (task.title || '').toLowerCase();
  if (t.includes('inquiry'))   return 'Follow up with client';
  if (t.includes('upload') || t.includes('statement')) return 'Request documents from client';
  if (t.includes('chase') || t.includes('checking')) return 'Confirm account opened + screenshot';
  if (t.includes('amex') || t.includes('recon'))  return 'Upload decision notes to portal';
  if (t.includes('contract') || t.includes('onboard')) return 'Begin onboarding / application review';
  if (t.includes('application') || t.includes('apply')) return 'Submit application + notify client';
  if (t.includes('follow') || t.includes('call')) return 'Call client + log outcome';
  return 'Follow up with client + update portal';
}

function clientCard(entry) {
  const { clientName, task } = entry;
  const isOverdue = task.status === 'overdue' || (task.dueDate && new Date(task.dueDate + 'T23:59:00') < new Date() && task.status !== 'completed');
  const [statusLabel, statusColor] = getStatusLabel(task, isOverdue);
  const accentColor = task.priority === 'critical' ? '#dc2626'
                    : isOverdue                    ? '#f97316'
                    : task.dueDate === todayStr()  ? '#f59e0b'
                    : '#22a7f0';
  const priColor   = getPriorityColor(task.priority);
  const dueColor   = getDueColor(task);
  const stageLabel = getStageLabel(task);
  const assignedTo = task.assignedTo || '—';
  const needed     = smartNeeded(task);
  const nextStep   = smartNextStep(task);
  const pending    = pendingDays(task);
  const due        = friendlyDue(task);
  const pri        = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium';

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px">
    <tr>
      <td width="4" style="background:${accentColor};border-radius:4px 0 0 4px">&nbsp;</td>
      <td style="background:#ffffff;border:1px solid #e5e7eb;border-left:none;border-radius:0 10px 10px 0;padding:18px 20px">

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:14px">
          <tr>
            <td>
              <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">&#x1F464; Client</div>
              <div style="font-size:17px;font-weight:800;color:#111827">${clientName}</div>
            </td>
            <td align="right" valign="top">${urgencyBadge(task, isOverdue)}</td>
          </tr>
        </table>

        <div style="background:#f8fafc;border-radius:6px;padding:10px 14px;margin-bottom:14px;border-left:3px solid ${accentColor}">
          <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Task</div>
          <div style="font-size:14px;font-weight:700;color:#1e293b">${task.title}</div>
        </div>

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

        <div style="background:#fffbeb;border-radius:6px;padding:10px 14px;margin-bottom:8px;border:1px solid #fde68a">
          <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px">What's Needed</div>
          <div style="font-size:12px;color:#374151;line-height:1.6">${needed}</div>
        </div>

        <div style="background:#eff6ff;border-radius:6px;padding:10px 14px;border:1px solid #bfdbfe">
          <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px">&#x2192; Next Step</div>
          <div style="font-size:12px;color:#1e40af;line-height:1.6;font-weight:600">${nextStep}</div>
        </div>

      </td>
    </tr>
  </table>`;
}

function sectionBlock(emoji, title, color, items) {
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
    ${items.map(entry => clientCard(entry)).join('')}
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
        <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">&#x23F8;&#xFE0F; Client</div>
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
          <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px">&#x2192; Recommended Action</div>
          <div style="font-size:12px;color:#1e40af;line-height:1.6;font-weight:600">${c.recommendedAction || 'Follow up with client and request status update'}</div>
        </div>
      </td>
    </tr>
  </table>`;
}

function buildEmail(data) {
  const { overdue, dueToday, dueTomorrow, completed, critical, stuckClients, approvedToday, approved } = data;
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true });
  const total   = overdue.length + dueToday.length + critical.length;
  const urgentColor = total > 0 ? '#dc2626' : '#059669';

  const kpiHtml = `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    <tr>
      ${[
        ['#fca5a5','Overdue',  overdue.length],
        ['#fcd34d','Due Today', dueToday.length],
        ['#c4b5fd','Critical',  critical.length],
        ['#6ee7b7','Completed', completed.length],
      ].map(([bg, lbl, n]) => `
      <td width="25%" style="padding:0 4px 0 0">
        <div style="background:${bg}22;border:1px solid ${bg}55;border-radius:8px;padding:12px 6px;text-align:center">
          <div style="font-size:26px;font-weight:900;color:${bg};line-height:1">${n}</div>
          <div style="font-size:9px;font-weight:700;color:${bg}cc;text-transform:uppercase;letter-spacing:0.07em;margin-top:4px">${lbl}</div>
        </div>
      </td>`).join('')}
    </tr>
  </table>`;

  const bodyHtml = [
    sectionBlock('&#x1F6A8;', 'Critical Tasks',  '#b91c1c', critical),
    sectionBlock('&#x26A0;&#xFE0F;', 'Overdue Tasks', '#c2410c', overdue),
    sectionBlock('&#x1F4C5;', 'Due Today',       '#1d4ed8', dueToday),
    dueTomorrow.length ? sectionBlock('&#x1F5D3;&#xFE0F;', 'Due Tomorrow', '#374151', dueTomorrow) : '',
    completed.length   ? sectionBlock('&#x2705;', 'Completed Today', '#15803d', completed) : '',

    stuckClients.length ? `
    <div style="margin-bottom:32px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px">
        <tr><td style="background:#6d28d9;padding:12px 18px;border-radius:8px">
          <span style="font-size:15px">&#x1F6D1;</span>
          <span style="color:white;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;margin-left:8px">Stuck Clients</span>
          <span style="float:right;background:rgba(255,255,255,0.2);color:white;border-radius:20px;padding:2px 12px;font-size:12px;font-weight:800">${stuckClients.length}</span>
        </td></tr>
      </table>
      ${stuckClients.map(c => stuckClientCard(c)).join('')}
    </div>` : '',

    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr><td style="background:linear-gradient(135deg,#064e3b,#065f46);border-radius:12px;padding:24px 24px">
        <div style="color:#6ee7b7;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px">&#x1F3E6; Funding Operations</div>
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>CapitalQuest Morning Brief — PREVIEW</title>
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
          <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.01em;line-height:1.2">&#x2600;&#xFE0F; Morning Brief — PREVIEW</div>
          <div style="color:#64748b;font-size:12px;margin-top:6px">Live operational summary &nbsp;&#xB7;&nbsp; ${dateStr} at ${timeStr}</div>
        </td>
        <td align="right" valign="top">
          <div style="background:${urgentColor};color:white;border-radius:50%;width:48px;height:48px;text-align:center;line-height:48px;font-size:20px;font-weight:900;display:inline-block">${total}</div>
          <div style="color:#64748b;font-size:10px;text-align:center;margin-top:4px">urgent</div>
        </td>
      </tr>
    </table>

    ${kpiHtml}

  </td></tr>

  <!-- PREVIEW BANNER -->
  <tr><td style="background:#1e40af;padding:10px 32px;text-align:center">
    <div style="color:white;font-size:11px;font-weight:700;letter-spacing:0.05em">
      &#x1F9EA; PREVIEW EMAIL &mdash; This is a sample with demo data. Live sends use your real client task data.
    </div>
  </td></tr>

  <!-- BODY -->
  <tr><td style="background:#ffffff;padding:28px 32px">${bodyHtml}</td></tr>

  <!-- CTA FOOTER -->
  <tr><td style="background:#0f172a;padding:24px 32px;border-radius:0 0 16px 16px;text-align:center">
    <a href="http://localhost:3002/admin.html"
       style="display:inline-block;background:#22a7f0;color:white;text-decoration:none;font-size:14px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;padding:14px 36px;border-radius:8px;margin-bottom:14px">
      OPEN ADMIN PORTAL &#x2192;
    </a>
    <div style="color:#475569;font-size:11px">CapitalQuest Admin Scheduler &nbsp;&#xB7;&nbsp; ${dateStr}</div>
  </td></tr>

</table>
</td></tr>
</table>

</body></html>`;
}

// ── Send ──────────────────────────────────────────────────────────────────────

const html = buildEmail(DEMO);
const { email, recipients } = cfg;

if (!email.pass || email.pass === 'TASKS_APP_PASSWORD_HERE' || email.pass === 'YOUR_APP_PASSWORD_HERE') {
  console.error('ERROR: Set email.pass in scheduler-config.json to the App Password for tasks@capitalquestfunding.com');
  console.error('See: myaccount.google.com/apppasswords (must be signed into tasks@ account with 2FA on)');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host:   email.host   || 'smtp.gmail.com',
  port:   email.port   || 587,
  secure: email.secure || false,
  auth:   { user: email.user, pass: email.pass },
});

const from     = email.from    || `CapitalQuest Task Alerts <${email.user}>`;
const replyTo  = email.replyTo || null;
const subject  = `[PREVIEW] CapitalQuest Morning Brief — ${new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}`;
const toList   = recipients?.email || [];

console.log(`From:    ${from}`);
if (replyTo) console.log(`Reply-To: ${replyTo}`);
console.log(`Sending to: ${toList.join(', ')} ...\n`);

for (const to of toList) {
  try {
    const msg = { from, to, subject, html };
    if (replyTo) msg.replyTo = replyTo;
    await transporter.sendMail(msg);
    console.log(`  ✓ Sent → ${to}`);
  } catch(e) {
    console.error(`  ✗ FAILED → ${to}:`, e.message);
  }
}

console.log('\nDone. Check your inbox (and spam folder).');
