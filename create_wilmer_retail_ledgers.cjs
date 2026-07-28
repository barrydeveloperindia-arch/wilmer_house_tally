const http = require('http');

const TALLY_URL = "http://localhost:9000";

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

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

async function main() {
    let xml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>
            <TALLYMESSAGE>
                <LEDGER ACTION="Create">
                    <NAME>Wilmer Retail Ltd - Rent Receivable</NAME>
                    <PARENT>Sundry Debtors</PARENT>
                </LEDGER>
            </TALLYMESSAGE>
            <TALLYMESSAGE>
                <LEDGER ACTION="Create">
                    <NAME>Wilmer Retail Ltd - Loan Account</NAME>
                    <PARENT>Loans &amp; Advances (Asset)</PARENT>
                </LEDGER>
            </TALLYMESSAGE>
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>
    `;

    console.log("Pushing ledgers to Tally...");
    const response = await sendToTally(xml);
    console.log("Response:", response.match(/<(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join('\\n') || response.substring(0, 300));
}

main().catch(console.error);
