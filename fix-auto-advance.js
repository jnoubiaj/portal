// fix-auto-advance.js — node fix-auto-advance.js
// When all internal (admin) tasks for the current stage are checked,
// automatically advance the client to the next stage.
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

const OLD = "  function plToggle(clientId, key, viewStage) {\n    var t = initClientTasks(clientId);\n    t.checked[key] = !t.checked[key];\n    saveClientTasks(clientId, t);\n    renderTaskModal(clientId, viewStage);\n    renderPipeline();\n  }";

const NEW = "  function plToggle(clientId, key, viewStage) {\n    var t = initClientTasks(clientId);\n    t.checked[key] = !t.checked[key];\n    saveClientTasks(clientId, t);\n    // Auto-advance when all internal tasks for the current stage are done\n    if (viewStage === t.stage) {\n      var stage = PIPELINE_STAGES[viewStage];\n      var assigned = t.assigned[viewStage] || [];\n      var allInternalDone = stage.internal.every(function(_,i){ return t.checked['s'+viewStage+'i'+i]; });\n      var allClientDone   = assigned.length === 0 || assigned.every(function(i){ return t.checked['s'+viewStage+'c'+i]; });\n      if (allInternalDone && allClientDone) {\n        setTimeout(function() { plAdvance(clientId, viewStage); }, 600);\n        return;\n      }\n    }\n    renderTaskModal(clientId, viewStage);\n    renderPipeline();\n  }";

const idx = html.indexOf(OLD);
if (idx === -1) { console.error('plToggle not found'); process.exit(1); }
html = html.slice(0, idx) + NEW + html.slice(idx + OLD.length);
console.log('plToggle updated with auto-advance');

const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
