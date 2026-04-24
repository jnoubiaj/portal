// fix-wizcancel-clear.js — node fix-wizcancel-clear.js
// wizCancel was referencing wrong input ID and not clearing the selected client badge.
// After closing the wizard the search box and selected client both stayed visible.
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

const OLD = "  function wizCancel() {\r\n    var wrap = document.getElementById('bnk-questionnaire-wrap');\r\n    if (wrap) wrap.innerHTML = '';\r\n    var inp = document.getElementById('bnk-client-pick');\r\n    if (inp) inp.value = '';\r\n    window._wiz = null;\r\n  }";

const NEW  = "  function wizCancel() {\r\n    var wrap = document.getElementById('bnk-questionnaire-wrap');\r\n    if (wrap) wrap.innerHTML = '';\r\n    var inp = document.getElementById('bnk-client-search');\r\n    if (inp) inp.value = '';\r\n    var sel = document.getElementById('bnk-selected-client');\r\n    if (sel) sel.innerHTML = '';\r\n    var res = document.getElementById('bnk-search-results');\r\n    if (res) res.style.display = 'none';\r\n    window._wiz = null;\r\n  }";

const idx = html.indexOf(OLD);
if (idx === -1) { console.error('wizCancel not found'); process.exit(1); }
html = html.slice(0, idx) + NEW + html.slice(idx + OLD.length);
console.log('wizCancel fixed');

const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
