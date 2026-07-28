const http = require('http');

const xml = `<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
            <LEDGER NAME="Credit Card" ACTION="Alter">
                <NAME.LIST>
                    <NAME>Credit Card</NAME>
                </NAME.LIST>
                <PARENT>Current Liabilities</PARENT>
            </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

const req = http.request('http://localhost:9000', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml', 'Content-Length': Buffer.byteLength(xml) }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log("Fix Response 2:", data));
});
req.on('error', console.error);
req.write(xml);
req.end();
