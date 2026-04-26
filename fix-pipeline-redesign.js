// fix-pipeline-redesign.js — node fix-pipeline-redesign.js
// Replaces pipeline CSS and all pipeline JS functions with redesigned versions.
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// ── 1. Replace CSS block ──────────────────────────────────────────────────────
const OLD_CSS_START = '    /* ── Pipeline ─────────────────────────────── */\r\n    .pl-board{';
const OLD_CSS_END   = '    .pl-advance-btn:disabled{background:#cbd5e1 !important;cursor:not-allowed;opacity:1}\r\n';
const cssStart = html.indexOf(OLD_CSS_START);
const cssEnd   = html.indexOf(OLD_CSS_END);
if (cssStart === -1) { console.error('CSS start not found'); process.exit(1); }
if (cssEnd   === -1) { console.error('CSS end not found');   process.exit(1); }

const NEW_CSS = [
  '    /* ── Pipeline ─────────────────────────────── */',
  '    .pl-board{display:flex;gap:14px;overflow-x:auto;padding-bottom:16px;align-items:flex-start}',
  '    .pl-col{flex:0 0 220px;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px;box-shadow:0 1px 4px rgba(0,0,0,.04)}',
  '    .pl-col-head{font-size:11px;font-weight:800;color:#0f2044;margin-bottom:12px;display:flex;align-items:flex-start;justify-content:space-between}',
  '    .pl-col-badge{font-size:10px;font-weight:800;color:#fff;padding:2px 8px;border-radius:20px;flex-shrink:0;margin-top:1px}',
  '    .pl-card{background:#fafafa;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 12px;margin-bottom:8px;cursor:pointer;transition:box-shadow .15s,border-color .15s,transform .1s}',
  '    .pl-card:hover{border-color:#93c5fd;box-shadow:0 4px 16px rgba(37,99,235,.10);transform:translateY(-1px)}',
  '    .pl-card-name{font-family:var(--font-h);font-size:13px;font-weight:700;color:#0f2044;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '    .pl-prog-bar{height:5px;background:#e2e8f0;border-radius:99px;overflow:hidden;margin-top:8px}',
  '    .pl-prog-fill{height:100%;border-radius:99px;transition:width .3s}',
  '    .pl-prog-label{font-size:10px;color:#94a3b8;margin-top:3px}',
  '    /* Modal */',
  '    .pl-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)}',
  '    .pl-modal{background:#fff;border-radius:18px;width:100%;max-width:700px;max-height:92vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,.28)}',
  '    .pl-modal-head{position:sticky;top:0;background:#fff;z-index:1;padding:18px 24px 14px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}',
  '    .pl-stages-nav{display:flex;gap:6px;padding:12px 24px 0;overflow-x:auto;flex-wrap:wrap}',
  '    .pl-stage-pill{padding:5px 12px;border-radius:20px;border:1.5px solid #e2e8f0;background:#fff;font-size:11px;font-weight:700;color:#64748b;cursor:pointer;transition:all .15s;white-space:nowrap}',
  '    .pl-stage-pill.done{background:#d1fae5;border-color:#6ee7b7;color:#065f46}',
  '    .pl-section-body{padding:16px 24px}',
  '    .pl-group-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;display:flex;align-items:center;gap:7px}',
  '    .pl-task-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;margin-bottom:3px;transition:background .1s;cursor:pointer}',
  '    .pl-task-row:hover{background:#f8fafc}',
  '    .pl-task-row input[type=checkbox]{width:16px;height:16px;accent-color:var(--blue);cursor:pointer;flex-shrink:0}',
  '    .pl-task-row label{font-size:13px;color:#0f2044;cursor:pointer;line-height:1.4}',
  '    .pl-task-row.done label{color:#94a3b8;text-decoration:line-through}',
  '    .pl-assign-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1.5px dashed;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;margin-bottom:10px;transition:opacity .15s}',
  '    .pl-assign-btn:hover{opacity:.8}',
  '    .pl-assign-dd{background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.10);padding:8px;margin-bottom:12px}',
  '    .pl-assign-dd-row{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:6px;cursor:pointer;transition:background .1s}',
  '    .pl-assign-dd-row:hover{background:#f8fafc}',
  '    .pl-assign-dd-row input{width:15px;height:15px;accent-color:var(--blue);cursor:pointer}',
  '    .pl-assign-dd-row label{font-size:13px;color:#0f2044;cursor:pointer}',
  '    .pl-advance-btn{display:block;width:calc(100% - 48px);margin:4px 24px 20px;padding:12px;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .15s}',
  '    .pl-advance-btn:hover{opacity:.88}',
  '    .pl-advance-btn:disabled{background:#cbd5e1 !important;cursor:not-allowed;opacity:1}',
  ''
].join('\r\n');

html = html.slice(0, cssStart) + NEW_CSS + html.slice(cssEnd + OLD_CSS_END.length);
console.log('1. CSS replaced');

// ── 2. Replace all pipeline JS (from PIPELINE_STAGES var to end of plAdvance) ─
const OLD_JS_START = '  // ══════════════════════════════════════════════════\n  //  PIPELINE — 6-stage client funding task system\n  // ══════════════════════════════════════════════════';
const OLD_JS_END   = '\n  function plAdvance(clientId, currentStage) {';

// Find the plAdvance function end
const jsStartIdx = html.indexOf(OLD_JS_START);
if (jsStartIdx === -1) { console.error('JS start not found'); process.exit(1); }

// Find end of plAdvance (last closing brace of pipeline section)
// plAdvance is the last function — find it and its closing brace
const plAdvStart = html.indexOf('\n  function plAdvance(clientId, currentStage) {', jsStartIdx);
if (plAdvStart === -1) { console.error('plAdvance not found'); process.exit(1); }

// Find the closing brace of plAdvance by counting braces
let depth = 0, pos = plAdvStart + 1;
let inFunc = false;
while (pos < html.length) {
  if (html[pos] === '{') { depth++; inFunc = true; }
  if (html[pos] === '}') { depth--; if (inFunc && depth === 0) { pos++; break; } }
  pos++;
}
const jsEndIdx = pos;
console.log('JS block:', jsStartIdx, '-', jsEndIdx, '(', jsEndIdx-jsStartIdx, 'chars)');

const NEW_JS = '\n' + fs.readFileSync(__dirname + '/pipeline-redesign-content.js', 'utf8');
html = html.slice(0, jsStartIdx) + NEW_JS + html.slice(jsEndIdx);
console.log('2. Pipeline JS replaced');

// ── 3. Syntax check ───────────────────────────────────────────────────────────
const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
