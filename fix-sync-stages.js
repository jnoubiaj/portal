// fix-sync-stages.js — node fix-sync-stages.js
// 1. Replace DEFAULT_DASH stageNames with the 6 Pipeline stages
// 2. Force getDashData to always use canonical stage names (upgrades existing clients)
// 3. Sync plAdvance → dashboard currentStage (pipeline advance = dashboard advance)
// 4. Sync applyStageSlider → pipeline stage (dashboard stage click = pipeline advance)
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// ── 1. Replace stageNames in DEFAULT_DASH ─────────────────────────────────────
const OLD_STAGES = "stageNames:['Contract Signed','Onboarding Complete','Fraud Alerts Off','Pay Down Utilization','Add Tradeline','Remove Inquiries','Business Account','Cleared for Funding','Funded'],";
const NEW_STAGES  = "stageNames:['Initial Setup / Credit Review','Credit Optimization','Funding Strategy','Bank Relationships','Application Phase','Decision / Results'],";
const idx1 = html.indexOf(OLD_STAGES);
if (idx1 === -1) { console.error('stageNames not found'); process.exit(1); }
html = html.slice(0, idx1) + NEW_STAGES + html.slice(idx1 + OLD_STAGES.length);
console.log('1. stageNames updated to 6 pipeline stages');

// ── 2. Force canonical stage names in getDashData ─────────────────────────────
// After Object.assign, override stageNames so existing saved data is upgraded
const OLD_GET = "      const d = Object.assign({}, DEFAULT_DASH, saved);";
const NEW_GET  = "      const d = Object.assign({}, DEFAULT_DASH, saved);\r\n      d.stageNames = DEFAULT_DASH.stageNames; // always use canonical pipeline stages";
const idx2 = html.indexOf(OLD_GET);
if (idx2 === -1) { console.error('getDashData assign not found'); process.exit(1); }
html = html.slice(0, idx2) + NEW_GET + html.slice(idx2 + OLD_GET.length);
console.log('2. getDashData force-override added');

// ── 3. Sync plAdvance → dashboard currentStage ────────────────────────────────
const OLD_ADV = "  function plAdvance(clientId, currentStage) {\n    var t = initClientTasks(clientId);\n    if (currentStage < PIPELINE_STAGES.length - 1) {\n      t.stage = currentStage + 1;\n      saveClientTasks(clientId, t);\n      renderTaskModal(clientId, t.stage);\n    } else {\n      t.stage = currentStage;\n      saveClientTasks(clientId, t);\n      document.getElementById('pl-modal-bg').remove();\n    }\n    renderPipeline();\n  }";
const NEW_ADV  = "  function plAdvance(clientId, currentStage) {\n    var t = initClientTasks(clientId);\n    if (currentStage < PIPELINE_STAGES.length - 1) {\n      t.stage = currentStage + 1;\n      saveClientTasks(clientId, t);\n      var d = getDashData(clientId);\n      d.currentStage = t.stage + 1;\n      saveDashData(clientId, d);\n      renderTaskModal(clientId, t.stage);\n    } else {\n      t.stage = currentStage;\n      saveClientTasks(clientId, t);\n      var df = getDashData(clientId);\n      df.currentStage = PIPELINE_STAGES.length;\n      saveDashData(clientId, df);\n      document.getElementById('pl-modal-bg').remove();\n    }\n    renderPipeline();\n  }";
const idx3 = html.indexOf(OLD_ADV);
if (idx3 === -1) { console.error('plAdvance not found'); process.exit(1); }
html = html.slice(0, idx3) + NEW_ADV + html.slice(idx3 + OLD_ADV.length);
console.log('3. plAdvance syncs dashboard stage');

// ── 4. Sync applyStageSlider → pipeline stage ─────────────────────────────────
// When admin clicks a stage dot on the client dashboard, also update pipeline stage
const OLD_TOAST = "    // Toast\r\n    const toast = document.getElementById('stage-saved-toast-'+clientId);";
const NEW_TOAST  = "    // Sync pipeline stage (dashboard stage click → pipeline)\r\n    var _pt = initClientTasks(clientId);\r\n    _pt.stage = cs - 1; // dashboard is 1-indexed, pipeline is 0-indexed\r\n    saveClientTasks(clientId, _pt);\r\n    if (typeof renderPipeline === 'function') renderPipeline();\r\n    // Toast\r\n    const toast = document.getElementById('stage-saved-toast-'+clientId);";
const idx4 = html.indexOf(OLD_TOAST);
if (idx4 === -1) { console.error('applyStageSlider toast anchor not found'); process.exit(1); }
html = html.slice(0, idx4) + NEW_TOAST + html.slice(idx4 + OLD_TOAST.length);
console.log('4. applyStageSlider syncs pipeline stage');

// ── Syntax check ──────────────────────────────────────────────────────────────
const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
