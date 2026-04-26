// fix-stage-timestamps.js — node fix-stage-timestamps.js
// 1. applyStageSlider: stamp stageStartedAt when manually changing stage via dashboard dots
// 2. initClientTasks: always stamp stageStartedAt for current stage if missing
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// ── 1. applyStageSlider sync: add stageStartedAt stamp ───────────────────────
const OLD_SYNC = "    // Sync pipeline stage (dashboard stage click → pipeline)\r\n    var _pt = initClientTasks(clientId);\r\n    _pt.stage = cs - 1; // dashboard is 1-indexed, pipeline is 0-indexed\r\n    saveClientTasks(clientId, _pt);";
const NEW_SYNC  = "    // Sync pipeline stage (dashboard stage click → pipeline)\r\n    var _pt = initClientTasks(clientId);\r\n    var _newStage = cs - 1;\r\n    if (_pt.stage !== _newStage) {\r\n      _pt.stage = _newStage;\r\n      if (!_pt.stageStartedAt) _pt.stageStartedAt = {};\r\n      if (!_pt.stageStartedAt[_newStage]) _pt.stageStartedAt[_newStage] = Date.now();\r\n    }\r\n    saveClientTasks(clientId, _pt);";

const idx1 = html.indexOf(OLD_SYNC);
if (idx1 === -1) { console.error('applyStageSlider sync not found'); process.exit(1); }
html = html.slice(0, idx1) + NEW_SYNC + html.slice(idx1 + OLD_SYNC.length);
console.log('1. applyStageSlider now stamps stageStartedAt');

// ── 2. initClientTasks: stamp current stage if missing ────────────────────────
// Find in pipeline JS (LF endings)
const OLD_INIT = "    if (!t.stageStartedAt) { t.stageStartedAt = {}; t.stageStartedAt[t.stage] = Date.now(); }\n    saveClientTasks(id, t);";
const NEW_INIT  = "    if (!t.stageStartedAt) t.stageStartedAt = {};\n    if (!t.stageStartedAt[t.stage]) t.stageStartedAt[t.stage] = Date.now();\n    saveClientTasks(id, t);";

const idx2 = html.indexOf(OLD_INIT);
if (idx2 === -1) { console.error('initClientTasks stamp not found'); process.exit(1); }
html = html.slice(0, idx2) + NEW_INIT + html.slice(idx2 + OLD_INIT.length);
console.log('2. initClientTasks always stamps current stage');

// ── Syntax check ──────────────────────────────────────────────────────────────
const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
