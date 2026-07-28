const fs = require('fs');
const http = require('http');

const data = fs.readFileSync('Extracted_CC_Transactions.csv', 'utf8');
const lines = data.split('\n').slice(1);
const unique = new Set();
lines.forEach(l => {
    // Regex to match "file","desc",amount
    const match = l.match(/"[^"]*","([^"]*)",([-\d\.]+)/);
    if(match && match[1]) {
        unique.add(match[1]);
    }
});

let xml = '<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC><REQUESTDATA>';
for(let l of unique) {
    if (l === 'PAYMENT RECEIVED - THANK YOU') {
        // Technically this shouldn't be an expense, but if the user wants it...
    }
    const escaped = l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    xml += `<TALLYMESSAGE><LEDGER ACTION="Alter"><NAME>${escaped}</NAME><PARENT>Credit Card Expense</PARENT></LEDGER></TALLYMESSAGE>`;
}
xml += '</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>';

const req = http.request('http://localhost:9000', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml', 'Content-Length': Buffer.byteLength(xml) }
}, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => console.log('Update results:', d));
});
req.on('error', console.error);
req.write(xml);
req.end();
