// fix-wizselect-onchange.js — node fix-wizselect-onchange.js
// Adds onchange support to wizSelect so toggle functions fire immediately on selection
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// ── 1. Update wizSelect signature and wire onchange to <select> ───────────
const OLD_SEL = "function wizSelect(id, label, options, prefill) {\r\n    var autoClass = prefill ? ' auto-prefill' : '';\r\n    var badge = prefill ? ' <span class=\"wiz-autobadge\">AUTO</span>' : '';\r\n    var opts = options.map(function(o){\r\n      var v = o.value !== undefined ? o.value : o;\r\n      var l = o.label !== undefined ? o.label : o;\r\n      var sel = (prefill && String(prefill) === String(v)) ? ' selected' : '';\r\n      return '<option value=\"' + v + '\"' + sel + '>' + l + '</option>';\r\n    }).join('');\r\n    return '<div class=\"wiz-field' + autoClass + '\">'\r\n      + '<label class=\"wiz-field-label\" for=\"' + id + '\">' + label + badge + '</label>'\r\n      + '<select class=\"wiz-input' + (prefill ? ' wiz-prefilled' : '') + '\" id=\"' + id + '\">' + opts + '</select>'\r\n      + '</div>';\r\n  }";

const NEW_SEL = "function wizSelect(id, label, options, prefill, onchange) {\r\n    var autoClass = prefill ? ' auto-prefill' : '';\r\n    var badge = prefill ? ' <span class=\"wiz-autobadge\">AUTO</span>' : '';\r\n    var opts = options.map(function(o){\r\n      var v = o.value !== undefined ? o.value : o;\r\n      var l = o.label !== undefined ? o.label : o;\r\n      var sel = (prefill && String(prefill) === String(v)) ? ' selected' : '';\r\n      return '<option value=\"' + v + '\"' + sel + '>' + l + '</option>';\r\n    }).join('');\r\n    var onchAttr = onchange ? ' onchange=\"' + onchange + '\"' : '';\r\n    return '<div class=\"wiz-field' + autoClass + '\">'\r\n      + '<label class=\"wiz-field-label\" for=\"' + id + '\">' + label + badge + '</label>'\r\n      + '<select class=\"wiz-input' + (prefill ? ' wiz-prefilled' : '') + '\" id=\"' + id + '\"' + onchAttr + '>' + opts + '</select>'\r\n      + '</div>';\r\n  }";

const idx = html.indexOf(OLD_SEL);
if (idx === -1) { console.error('wizSelect not found'); process.exit(1); }
html = html.slice(0, idx) + NEW_SEL + html.slice(idx + OLD_SEL.length);
console.log('1. wizSelect updated with onchange support at', idx);

// ── 2. Verify syntax ──────────────────────────────────────────────────────
const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
