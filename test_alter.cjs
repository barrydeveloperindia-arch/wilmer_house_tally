const http = require('http');
const xml = `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC><REQUESTDATA><TALLYMESSAGE><LEDGER ACTION="Alter"><OLDNAME>NETFLIX.COM 203832      LND</OLDNAME><NAME>NETFLIX.COM 203832      LND</NAME><PARENT>Credit Card Expense</PARENT></LEDGER></TALLYMESSAGE></REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;

const req = http.request('http://localhost:9000', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml', 'Content-Length': Buffer.byteLength(xml) }
}, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => console.log('Response:', d));
});
req.on('error', console.error); req.write(xml); req.end();
