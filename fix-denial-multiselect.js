// fix-denial-multiselect.js — node fix-denial-multiselect.js
// Replaces free-text denial reason with a multi-select checkbox dropdown.
// Strategy: add a wizDenialMultiSelect(saved) function that builds all HTML cleanly,
// then call it from the wizard step instead of wizInput.
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// 1. Replace the wizInput call with a function call
const OLD_DENIAL = "+ wizInput('wiz-denial', 'Denial Reason (if denied)', 'e.g. Low FICO, insufficient revenue...', wd.denialReason || '', 'text')";
const NEW_DENIAL  = "+ wizDenialMultiSelect(wd.denialReason || '')";

const idx = html.indexOf(OLD_DENIAL);
if (idx === -1) { console.error('denial input not found'); process.exit(1); }
html = html.slice(0, idx) + NEW_DENIAL + html.slice(idx + OLD_DENIAL.length);
console.log('1. wizInput replaced with wizDenialMultiSelect()');

// 2. Add all helper functions before wizSaveCurrentFields
const INSERT_BEFORE = 'function wizSaveCurrentFields()';
const idx2 = html.indexOf(INSERT_BEFORE);
if (idx2 === -1) { console.error('wizSaveCurrentFields not found'); process.exit(1); }

const HELPERS = [
  'function wizDenialMultiSelect(saved) {',
  '    var REASONS = [',
  "      'Low Credit Score',",
  "      'High Credit Utilization',",
  "      'Too Many Inquiries',",
  "      'Collections / Derogatory Marks',",
  "      'Late Payments / Delinquencies',",
  "      'Insufficient Income',",
  "      'High Debt-to-Income (DTI)',",
  "      'Short Time in Business',",
  "      'Insufficient Business Revenue',",
  "      'No Business Bank Account',",
  "      'Low Average Daily Balance',",
  "      'NSF / Overdrafts on Bank Statements',",
  "      'Bankruptcy on File',",
  "      'No Established Business Credit',",
  "      'High-Risk Industry / NAICS Code',",
  "      'Insufficient Collateral',",
  "      'Fraud Alert / Frozen Credit',",
  "      'Missing Documentation',",
  "      'Too Many Open Accounts',",
  "      'Requires Existing Relationship',",
  "      'Insufficient Employment History',",
  "      'Insufficient Time at Address'",
  '    ];',
  "    var vals = saved ? saved.split('|') : [];",
  "    var tagHtml = vals.length",
  '      ? vals.map(function(v){',
  "          return '<span class=\"denial-tag\" style=\"display:inline-flex;align-items:center;background:#dbeafe;color:#1e40af;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;margin:2px\">' + v + '</span>';",
  '        }).join(\'\')',
  "      : '<span id=\"wiz-denial-ph\" style=\"font-size:13px;color:var(--gray-400)\">Select denial reasons...</span>';",
  '    var rows = REASONS.map(function(r) {',
  "      var chk = vals.indexOf(r) !== -1 ? ' checked' : '';",
  "      return '<label style=\"display:flex;align-items:center;gap:8px;padding:7px 10px;cursor:pointer;border-radius:6px\" onmouseover=\"this.style.background=\\'#f1f5f9\\'\" onmouseout=\"this.style.background=\\'\\'\"><input type=\"checkbox\" value=\"' + r + '\" onchange=\"wizDenialChange()\"' + chk + ' style=\"width:15px;height:15px;accent-color:#2563eb;cursor:pointer\"> <span style=\"font-size:13px;color:#0f2044\">' + r + '</span></label>';",
  '    }).join(\'\');',
  "    var safeVal = saved.replace(/\"/g, '&quot;');",
  "    return '<div class=\"wiz-field\">'",
  "      + '<div class=\"wiz-field-label\">Denial Reason (if denied)</div>'",
  "      + '<input type=\"hidden\" id=\"wiz-denial\" value=\"' + safeVal + '\">'",
  "      + '<div id=\"wiz-denial-box\" onclick=\"wizToggleDenialDD(event)\" style=\"min-height:38px;border:1.5px solid var(--gray-200);border-radius:8px;padding:5px 10px;cursor:pointer;background:#fff;display:flex;flex-wrap:wrap;align-items:center;gap:4px;position:relative\">' + tagHtml + '</div>'",
  "      + '<div id=\"wiz-denial-dd\" style=\"display:none;position:absolute;z-index:9999;background:#fff;border:1.5px solid var(--gray-200);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.12);padding:8px;max-height:280px;overflow-y:auto;width:460px;margin-top:2px\">' + rows + '</div>'",
  "      + '</div>';",
  '  }',
  '  function wizToggleDenialDD(e) {',
  '    if (e) e.stopPropagation();',
  "    var dd = document.getElementById('wiz-denial-dd');",
  '    if (!dd) return;',
  "    var open = dd.style.display !== 'none';",
  "    dd.style.display = open ? 'none' : 'block';",
  '    if (!open) {',
  '      setTimeout(function() {',
  "        document.addEventListener('click', function _closeDenial(ev) {",
  "          var dd2 = document.getElementById('wiz-denial-dd');",
  "          var box = document.getElementById('wiz-denial-box');",
  '          if (dd2 && !dd2.contains(ev.target) && box && !box.contains(ev.target)) {',
  "            dd2.style.display = 'none';",
  "            document.removeEventListener('click', _closeDenial);",
  '          }',
  '        });',
  '      }, 0);',
  '    }',
  '  }',
  '  function wizDenialChange() {',
  "    var dd  = document.getElementById('wiz-denial-dd');",
  "    var inp = document.getElementById('wiz-denial');",
  "    var box = document.getElementById('wiz-denial-box');",
  '    if (!dd || !inp || !box) return;',
  "    var checked = Array.from(dd.querySelectorAll('input[type=checkbox]:checked')).map(function(cb){ return cb.value; });",
  "    inp.value = checked.join('|');",
  "    var oldTags = box.querySelectorAll('.denial-tag');",
  '    oldTags.forEach(function(t){ t.remove(); });',
  "    var ph = document.getElementById('wiz-denial-ph');",
  "    if (ph) ph.style.display = checked.length ? 'none' : '';",
  '    checked.forEach(function(v) {',
  '      var tag = document.createElement(\'span\');',
  "      tag.className = 'denial-tag';",
  "      tag.style.cssText = 'display:inline-flex;align-items:center;background:#dbeafe;color:#1e40af;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;margin:2px';",
  '      tag.textContent = v;',
  '      box.appendChild(tag);',
  '    });',
  '  }',
  '  '
].join('\r\n  ');

html = html.slice(0, idx2) + HELPERS + html.slice(idx2);
console.log('2. Helper functions added');

// Verify syntax
const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
