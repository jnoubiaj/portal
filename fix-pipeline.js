// fix-pipeline.js — node fix-pipeline.js
// Adds Pipeline section:
//   - Kanban board (one column per stage + "Not Started")
//   - Per-client task modal:
//       * Internal tasks: auto-shown based on current stage (admin marks complete)
//       * Client tasks: admin selects which apply to THIS client (not all clients need same steps)
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// ── 1. CSS ────────────────────────────────────────────────────────────────────
const CSS_ANCHOR = '.wiz-snapshot-grid { display:grid;';
const CSS_IDX = html.indexOf(CSS_ANCHOR);
if (CSS_IDX === -1) { console.error('CSS anchor not found'); process.exit(1); }

const PIPELINE_CSS = [
  '',
  '    /* ── Pipeline ─────────────────────────────── */',
  '    .pl-board{display:flex;gap:14px;overflow-x:auto;padding-bottom:12px;align-items:flex-start}',
  '    .pl-col{flex:0 0 210px;background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:12px;padding:12px}',
  '    .pl-col-head{font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between}',
  '    .pl-col-badge{font-size:10px;font-weight:700;background:var(--blue);color:#fff;padding:1px 7px;border-radius:20px}',
  '    .pl-card{background:#fff;border:1.5px solid var(--gray-200);border-radius:10px;padding:10px 12px;margin-bottom:8px;cursor:pointer;transition:box-shadow .15s,border-color .15s}',
  '    .pl-card:hover{border-color:var(--blue);box-shadow:0 4px 16px rgba(37,99,235,.10)}',
  '    .pl-card-name{font-family:var(--font-h);font-size:13px;font-weight:700;color:var(--navy);margin-bottom:3px}',
  '    .pl-card-sub{font-size:11px;color:var(--gray-400);margin-bottom:8px}',
  '    .pl-prog-bar{height:5px;background:var(--gray-200);border-radius:99px;overflow:hidden}',
  '    .pl-prog-fill{height:100%;background:var(--blue);border-radius:99px;transition:width .3s}',
  '    .pl-prog-label{font-size:10px;color:var(--gray-400);margin-top:3px}',
  '    /* Modal */',
  '    .pl-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px}',
  '    .pl-modal{background:#fff;border-radius:18px;width:100%;max-width:680px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.25)}',
  '    .pl-modal-head{position:sticky;top:0;background:#fff;z-index:1;padding:20px 24px 16px;border-bottom:1px solid var(--gray-100);display:flex;align-items:center;justify-content:space-between}',
  '    .pl-stages-nav{display:flex;gap:6px;padding:14px 24px 0;overflow-x:auto;flex-wrap:wrap}',
  '    .pl-stage-pill{padding:5px 11px;border-radius:20px;border:1.5px solid var(--gray-200);background:#fff;font-size:11px;font-weight:700;color:var(--gray-500);cursor:pointer;transition:all .15s;white-space:nowrap}',
  '    .pl-stage-pill.active{background:var(--blue);border-color:var(--blue);color:#fff}',
  '    .pl-stage-pill.done{background:#d1fae5;border-color:#6ee7b7;color:#065f46}',
  '    .pl-section-body{padding:16px 24px}',
  '    .pl-group-label{font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;display:flex;align-items:center;gap:7px}',
  '    .pl-task-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;margin-bottom:3px;transition:background .1s;cursor:pointer}',
  '    .pl-task-row:hover{background:var(--gray-50)}',
  '    .pl-task-row input[type=checkbox]{width:16px;height:16px;accent-color:var(--blue);cursor:pointer;flex-shrink:0}',
  '    .pl-task-row label{font-size:13px;color:var(--navy);cursor:pointer;line-height:1.4}',
  '    .pl-task-row.done label{color:var(--gray-400);text-decoration:line-through}',
  '    /* Assign dropdown */',
  '    .pl-assign-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1.5px dashed var(--blue);border-radius:8px;background:#f0f7ff;color:var(--blue);font-size:12px;font-weight:700;cursor:pointer;margin-bottom:10px;transition:background .15s}',
  '    .pl-assign-btn:hover{background:#dbeafe}',
  '    .pl-assign-dd{background:#fff;border:1.5px solid var(--gray-200);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:8px;margin-bottom:12px}',
  '    .pl-assign-dd-row{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:6px;cursor:pointer;transition:background .1s}',
  '    .pl-assign-dd-row:hover{background:var(--gray-50)}',
  '    .pl-assign-dd-row input{width:15px;height:15px;accent-color:var(--blue);cursor:pointer}',
  '    .pl-assign-dd-row label{font-size:13px;color:var(--navy);cursor:pointer}',
  '    .pl-advance-btn{display:block;width:calc(100% - 48px);margin:4px 24px 20px;padding:11px;background:var(--blue);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;transition:background .15s}',
  '    .pl-advance-btn:hover{background:#1d4ed8}',
  '    .pl-advance-btn:disabled{background:var(--gray-300);cursor:not-allowed}',
  ''
].join('\r\n');

html = html.slice(0, CSS_IDX) + PIPELINE_CSS + '\r\n    ' + html.slice(CSS_IDX);
console.log('1. CSS added');

// ── 2. Nav item ───────────────────────────────────────────────────────────────
const OLD_NAV = "        <div class=\"a-nav-item\" onclick=\"switchAdminSection('analytics',this)\">\r\n          <svg class=\"a-nav-icon\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"22 12 18 12 15 21 9 3 6 12 2 12\"/></svg>\r\n          Analytics\r\n        </div>";
const NEW_NAV = OLD_NAV + "\r\n        <div class=\"a-nav-item\" onclick=\"switchAdminSection('pipeline',this)\">\r\n          <svg class=\"a-nav-icon\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M9 11l3 3L22 4\"/><path d=\"M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11\"/></svg>\r\n          Pipeline\r\n        </div>";
const ni = html.indexOf(OLD_NAV);
if (ni === -1) { console.error('nav anchor not found'); process.exit(1); }
html = html.slice(0, ni) + NEW_NAV + html.slice(ni + OLD_NAV.length);
console.log('2. Nav item added');

// ── 3. Section HTML ───────────────────────────────────────────────────────────
const SECTION_ANCHOR = '\r\n\r\n      </div><!-- /a-content -->\r\n    </main>';
const sai = html.lastIndexOf(SECTION_ANCHOR);
if (sai === -1) { console.error('section anchor not found'); process.exit(1); }
const PIPELINE_SECTION = "\r\n\r\n        <!-- PIPELINE -->\r\n        <div class=\"a-section\" id=\"asec-pipeline\">\r\n          <div id=\"pipeline-board-wrap\"></div>\r\n        </div>";
html = html.slice(0, sai) + PIPELINE_SECTION + html.slice(sai);
console.log('3. Section HTML added');

// ── 4. sectionLabels ──────────────────────────────────────────────────────────
const OLD_LABELS = "const sectionLabels = { overview:'Overview', clients:'Clients', messages:'Messages', analytics:'Analytics' };";
const NEW_LABELS  = "const sectionLabels = { overview:'Overview', clients:'Clients', messages:'Messages', analytics:'Analytics', pipeline:'Pipeline' };";
const li = html.indexOf(OLD_LABELS);
if (li === -1) { console.error('sectionLabels not found'); process.exit(1); }
html = html.slice(0, li) + NEW_LABELS + html.slice(li + OLD_LABELS.length);
console.log('4. sectionLabels updated');

// ── 5. Wire into switchAdminSection ──────────────────────────────────────────
const OLD_SW = "if (name === 'overview') renderOverview();";
const NEW_SW  = "if (name === 'overview') renderOverview();\r\n    if (name === 'pipeline') renderPipeline();";
const swi = html.indexOf(OLD_SW);
if (swi === -1) { console.error('switch hook not found'); process.exit(1); }
html = html.slice(0, swi) + NEW_SW + html.slice(swi + OLD_SW.length);
console.log('5. Switch wired');

// ── 6. Pipeline JS (read from separate file to avoid escaping issues) ─────────
const SCRIPT_END = '\r\n</script>';
const sei = html.lastIndexOf(SCRIPT_END);
if (sei === -1) { console.error('script end not found'); process.exit(1); }

const PIPELINE_JS = '\r\n' + fs.readFileSync(__dirname + '/pipeline-js-insert.js', 'utf8');
html = html.slice(0, sei) + PIPELINE_JS + html.slice(sei);
console.log('6. Pipeline JS added');

// ── 7. Syntax check ───────────────────────────────────────────────────────────
const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
