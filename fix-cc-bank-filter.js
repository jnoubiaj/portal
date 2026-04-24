// fix-cc-bank-filter.js — node fix-cc-bank-filter.js
// Restore bank-specific filter for personal CC section.
// Shows only credit cards belonging to the current bank (e.g. Chase cards in Chase dept).
// Uses both bank name keywords AND a card-product-name mapping for cards that don't include bank name.
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

const OLD_FILTER = "      var _personalCCs = _allAccts.filter(function(a){\r\n        if (!a.isOpen) return false;\r\n        return a.type === 'Credit Card' || a.type === 'Line of Credit';\r\n      });";

const NEW_FILTER = `      // Bank keyword map: catches cards that use product name without bank name in credit report
      var _bankCardMap = {
        'chase': ['chase','sapphire','freedom','slate','ink','amazon','disney','united','marriott','ihg','southwest','hyatt','aarp'],
        'american express': ['amex','american express','americanexpress','platinum','gold','blue cash','everyday','hilton','delta','marriott','amazon'],
        'amex': ['amex','american express','americanexpress','platinum','gold','blue cash','everyday','hilton','delta'],
        'bank of america': ['bank of america','bankamerica','bofA','preferred rewards','travel rewards','cash rewards','unlimited cash','customized cash'],
        'capital one': ['capital one','venture','quicksilver','savor','spark','secured'],
        'citi': ['citi','citibank','citicard','double cash','custom cash','premier','prestige','simplicity','diamond'],
        'citibank': ['citi','citibank','citicard','double cash','custom cash','premier','prestige','simplicity','diamond'],
        'wells fargo': ['wells fargo','wellsfargo','active cash','autograph','reflect','bilt'],
        'discover': ['discover','discover it','discover miles','discover secured'],
        'us bank': ['us bank','usbank','altitude','cash+','flexperks'],
        'barclays': ['barclays','barclaycard','jetblue','carnival','aadvantage','arrival'],
        'synchrony': ['synchrony','care credit','amazon store','walmart','gap','lowes','home depot','amazon'],
        'td bank': ['td bank','tdbank','td cash','td double up'],
        'pnc': ['pnc','points visa','cash rewards']
      };
      var _bnkKey = (w.bankName || '').toLowerCase();
      var _cardKeywords = _bankCardMap[_bnkKey] || (w.bankName || '').toLowerCase().split(/\\s+/).filter(function(wrd){ return wrd.length > 2; });
      var _personalCCs = _allAccts.filter(function(a){
        if (!a.isOpen) return false;
        if (a.type !== 'Credit Card' && a.type !== 'Line of Credit') return false;
        var aName = (a.name || '').toLowerCase();
        return _cardKeywords.some(function(kw){ return aName.indexOf(kw) !== -1; });
      });`;

const idx = html.indexOf(OLD_FILTER);
if (idx === -1) { console.error('filter not found'); process.exit(1); }
html = html.slice(0, idx) + NEW_FILTER + html.slice(idx + OLD_FILTER.length);
console.log('Bank filter restored at', idx);

// Also update the "no cards found" message to mention the bank name
const OLD_NO = "'<div style=\"font-size:12px;color:var(--gray-400);font-style:italic;padding:8px 0\">No credit cards found in credit report</div>'";
const NEW_NO  = "'<div style=\"font-size:12px;color:var(--gray-400);font-style:italic;padding:8px 0\">No ' + w.bankName + ' credit cards found in credit report</div>'";
const i2 = html.indexOf(OLD_NO);
if (i2 === -1) { console.warn('no-cards msg not found — skipping'); }
else {
  html = html.slice(0, i2) + NEW_NO + html.slice(i2 + OLD_NO.length);
  console.log('No-cards message updated');
}

const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
