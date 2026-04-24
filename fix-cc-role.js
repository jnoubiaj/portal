// fix-cc-role.js — node fix-cc-role.js
// Adds Role (Auth User / Primary) cell to CC data grid, 5 columns, neat layout
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// 1. Update grid from 4 to 5 columns
const OLD_GRID = 'grid-template-columns:repeat(4,1fr)';
const NEW_GRID = 'grid-template-columns:repeat(5,1fr)';
const ig = html.indexOf(OLD_GRID);
if (ig === -1) { console.error('grid cols not found'); process.exit(1); }
html = html.slice(0, ig) + NEW_GRID + html.slice(ig + OLD_GRID.length);
console.log('1. grid updated to 5 cols');

// 2. Add Role cell after the Opened cell
const OLD_OPENED_END = "+ '<div style=\"background:var(--white);border:1px solid var(--gray-100);border-radius:6px;padding:7px 10px\"><div style=\"font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px\">Opened</div><div style=\"font-size:13px;font-weight:700;color:var(--navy)\">' + (a.dateOpened || '—') + '</div></div>'";
const NEW_OPENED_END = "+ '<div style=\"background:var(--white);border:1px solid var(--gray-100);border-radius:6px;padding:7px 10px\"><div style=\"font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px\">Opened</div><div style=\"font-size:13px;font-weight:700;color:var(--navy)\">' + (a.dateOpened || '—') + '</div></div>'\r\n            + '<div style=\"background:' + (a.isAuthUser ? '#fef9ec' : '#f0fdf4') + ';border:1px solid ' + (a.isAuthUser ? '#fde68a' : '#bbf7d0') + ';border-radius:6px;padding:7px 10px\"><div style=\"font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px\">Role</div><div style=\"font-size:12px;font-weight:700;color:' + (a.isAuthUser ? '#92400e' : '#065f46') + '\">' + (a.isAuthUser ? 'Auth User' : 'Primary') + '</div></div>'";

const io = html.indexOf(OLD_OPENED_END);
if (io === -1) { console.error('opened cell not found'); process.exit(1); }
html = html.slice(0, io) + NEW_OPENED_END + html.slice(io + OLD_OPENED_END.length);
console.log('2. Role cell added');

// 3. Remove the separate authTag from the name row (now redundant)
const OLD_NAME_ROW = "+ '<div style=\"display:flex;align-items:center;margin-bottom:8px\"><span style=\"font-size:13px;font-weight:700;color:var(--navy)\">' + a.name + '</span>' + authTag + '</div>'";
const NEW_NAME_ROW = "+ '<div style=\"margin-bottom:8px\"><span style=\"font-size:13px;font-weight:700;color:var(--navy)\">' + a.name + '</span></div>'";
const in2 = html.indexOf(OLD_NAME_ROW);
if (in2 === -1) { console.error('name row not found'); process.exit(1); }
html = html.slice(0, in2) + NEW_NAME_ROW + html.slice(in2 + OLD_NAME_ROW.length);
console.log('3. Name row cleaned up');

// Verify syntax
const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
