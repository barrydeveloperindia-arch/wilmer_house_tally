const http = require('http');

const TALLY_URL = "http://localhost:9000";

async function sendToTally(xml) {
    return new Promise((resolve, reject) => {
        const req = http.request(TALLY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml',
                'Content-Length': Buffer.byteLength(xml)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.write(xml);
        req.end();
    });
}

async function fetchSummary(ledgerName) {
    const xml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
      <BODY>
        <EXPORTDATA>
          <REQUESTDESC>
            <REPORTNAME>Ledger Monthly Summary</REPORTNAME>
            <STATICVARIABLES>
              <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
              <LEDGERNAME>${ledgerName}</LEDGERNAME>
              <SVFROMDATE>20250101</SVFROMDATE>
              <SVTODATE>20260630</SVTODATE>
            </STATICVARIABLES>
          </REQUESTDESC>
        </EXPORTDATA>
      </BODY>
    </ENVELOPE>
    `;
    return await sendToTally(xml);
}

async function main() {
    const emp = await fetchSummary("Employee NICs Payable");
    const empr = await fetchSummary("Employer NICs Payable");

    const fs = require('fs');
    fs.writeFileSync('nics_summary.xml', emp + "\\n\\n<!-- SEP -->\\n\\n" + empr);
    console.log("Saved to nics_summary.xml");
}

main().catch(console.error);
