// fix-cc-bank-filter2.js — node fix-cc-bank-filter2.js
// Simplify CC filter: credit reports show bank/creditor name, not card product name.
// Just match the account name against the bank name.
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// Find and replace the complex _bankCardMap filter with a simple bank-name match
const OLD_FILTER_START = "      // Bank keyword map: catches cards that use product name without bank name in credit report";
const OLD_FILTER_END   = "      });";

const startIdx = html.indexOf(OLD_FILTER_START);
if (startIdx === -1) { console.error('filter start not found'); process.exit(1); }

// Find the closing }); after the filter function
const endIdx = html.indexOf(OLD_FILTER_END, startIdx);
if (endIdx === -1) { console.error('filter end not found'); process.exit(1); }

const NEW_FILTER = `      // Match credit report accounts to this bank by creditor name
      // Credit reports show the bank name (e.g. "CHASE", "AMERICAN EXPRESS") as the account name
      var _bankAliases = {
        'american express': ['american express','amex'],
        'amex':             ['american express','amex'],
        'bank of america':  ['bank of america','bankamerica','boa'],
        'wells fargo':      ['wells fargo','wellsfargo'],
        'us bank':          ['us bank','usbank','u.s. bank'],
        'td bank':          ['td bank','tdbank']
      };
      var _bnkKey2 = (w.bankName || '').toLowerCase();
      var _matchTerms = _bankAliases[_bnkKey2] || [_bnkKey2];
      var _personalCCs = _allAccts.filter(function(a){
        if (!a.isOpen) return false;
        if (a.type !== 'Credit Card' && a.type !== 'Line of Credit') return false;
        var aName = (a.name || '').toLowerCase();
        return _matchTerms.some(function(term){ return aName.indexOf(term) !== -1; });
      });`;

html = html.slice(0, startIdx) + NEW_FILTER + html.slice(endIdx + OLD_FILTER_END.length);
console.log('Filter simplified');

const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
