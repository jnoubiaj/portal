// fix-cc-grid-5col.js — node fix-cc-grid-5col.js
// The personal CC card grid is still repeat(4,1fr) — Role wraps to a second row.
// Fix: change the inline grid style on the CC card to repeat(5,1fr).
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

const OLD = "'<div style=\"display:grid;grid-template-columns:repeat(4,1fr);gap:8px\">'";
const NEW  = "'<div style=\"display:grid;grid-template-columns:repeat(5,1fr);gap:8px\">'";

const idx = html.indexOf(OLD);
if (idx === -1) { console.error('CC grid not found'); process.exit(1); }
html = html.slice(0, idx) + NEW + html.slice(idx + OLD.length);
console.log('CC grid updated to 5 columns at offset', idx);

const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
