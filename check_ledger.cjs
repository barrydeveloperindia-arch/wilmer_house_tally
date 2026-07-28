const http = require('http');

const TALLY_URL = "http://localhost:9000";

function checkLedger(ledgerName) {
    const xml = `
    <ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>List of Accounts</REPORTNAME>
                    <STATICVARIABLES>
                        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                        <ACCOUNTTYPE>Ledgers</ACCOUNTTYPE>
                    </STATICVARIABLES>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>
    `;

    const req = http.request(TALLY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml',
            'Content-Length': Buffer.byteLength(xml)
        }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (data.toLowerCase().includes(ledgerName.toLowerCase())) {
                console.log(`✅ Ledger "${ledgerName}" found in Tally!`);
            } else {
                console.log(`❌ Ledger "${ledgerName}" NOT found in Tally.`);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.write(xml);
    req.end();
}

checkLedger("Credit Card");
