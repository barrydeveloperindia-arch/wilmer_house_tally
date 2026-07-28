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
    
    const ledgers = [
        { name: 'Loan - Solistar', parent: 'Loans (Liability)' },
        { name: 'NWB BUSINESS LOAN', parent: 'Loans (Liability)' },
        { name: 'Salil Anand - Payable', parent: 'Unsecured Loans' },
        { name: 'Electricity & Gas Expenses', parent: 'Indirect Expenses', costCentre: 'Yes' },
        { name: 'Water Expenses', parent: 'Indirect Expenses', costCentre: 'Yes' },
        { name: 'Internet Expenses', parent: 'Indirect Expenses', costCentre: 'Yes' },
        { name: 'Rent Paid', parent: 'Indirect Expenses', costCentre: 'Yes' },
        { name: 'Rental Income', parent: 'Indirect Incomes', costCentre: 'Yes' }
    ];

    let xml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>
            <!-- 1. Cost Category -->
            <TALLYMESSAGE>
                <COSTCATEGORY ACTION="Create">
                    <NAME>Properties</NAME>
                    <ALLOCATEREVENUE>Yes</ALLOCATEREVENUE>
                    <ALLOCATENONREVENUE>Yes</ALLOCATENONREVENUE>
                </COSTCATEGORY>
            </TALLYMESSAGE>

            <!-- 2. Cost Centres -->
            <TALLYMESSAGE>
                <COSTCENTRE ACTION="Create">
                    <NAME>20 Wilmer Road</NAME>
                    <CATEGORY>Properties</CATEGORY>
                </COSTCENTRE>
            </TALLYMESSAGE>
            <TALLYMESSAGE>
                <COSTCENTRE ACTION="Create">
                    <NAME>22 Wilmer Road</NAME>
                    <CATEGORY>Properties</CATEGORY>
                </COSTCENTRE>
            </TALLYMESSAGE>
            <TALLYMESSAGE>
                <COSTCENTRE ACTION="Create">
                    <NAME>44 Drum Road</NAME>
                    <CATEGORY>Properties</CATEGORY>
                </COSTCENTRE>
            </TALLYMESSAGE>
            <TALLYMESSAGE>
                <COSTCENTRE ACTION="Create">
                    <NAME>37 Highstreet</NAME>
                    <CATEGORY>Properties</CATEGORY>
                </COSTCENTRE>
            </TALLYMESSAGE>
    `;

    // 3. Ledgers
    for (const l of ledgers) {
        xml += `
            <TALLYMESSAGE>
                <LEDGER ACTION="Create">
                    <NAME>${escapeXml(l.name)}</NAME>
                    <PARENT>${escapeXml(l.parent)}</PARENT>
                    ${l.costCentre ? '<ISCOSTCENTRESON>Yes</ISCOSTCENTRESON>' : ''}
                </LEDGER>
            </TALLYMESSAGE>
        `;
    }

    xml += `
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>
    `;

    console.log("Pushing Masters to Tally...");
    const response = await sendToTally(xml);
    console.log("Response:", response.match(/<(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join('\\n') || response.substring(0, 300));
}

main().catch(console.error);
