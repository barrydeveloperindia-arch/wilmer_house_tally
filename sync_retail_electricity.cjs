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
    const vouchers = [
        { date: '20251031', amount: 301.61, narration: 'Electricity Rent for Oct 2025 (Partial 15th-31st)' },
        { date: '20251130', amount: 550.00, narration: 'Electricity Rent for Nov 2025' },
        { date: '20251231', amount: 550.00, narration: 'Electricity Rent for Dec 2025' },
        { date: '20260131', amount: 550.00, narration: 'Electricity Rent for Jan 2026' },
        { date: '20260228', amount: 550.00, narration: 'Electricity Rent for Feb 2026' },
        { date: '20260331', amount: 550.00, narration: 'Electricity Rent for Mar 2026' },
        { date: '20260430', amount: 550.00, narration: 'Electricity Rent for Apr 2026' },
        { date: '20260531', amount: 550.00, narration: 'Electricity Rent for May 2026' },
        { date: '20260630', amount: 550.00, narration: 'Electricity Rent for Jun 2026' }
    ];

    let xml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>
            <TALLYMESSAGE>
                <LEDGER ACTION="Create">
                    <NAME>Electricity Rent</NAME>
                    <PARENT>Direct Incomes</PARENT>
                    <ISCOSTCENTRESON>Yes</ISCOSTCENTRESON>
                </LEDGER>
            </TALLYMESSAGE>
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>
    `;

    console.log("Pushing Ledger to Tally...");
    const ledgerResponse = await sendToTally(xml);
    console.log("Ledger response:", ledgerResponse.match(/<(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join('\\n') || ledgerResponse.substring(0, 300));


    let vouchersXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>
    `;
    
    for (let v of vouchers) {
        vouchersXml += `
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
                <VOUCHER VCHTYPE="Journal" ACTION="Create">
                    <DATE>${v.date}</DATE>
                    <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                    <NARRATION>${escapeXml(v.narration)}</NARRATION>
                    <ALLLEDGERENTRIES.LIST>
                        <LEDGERNAME>Wilmer Retail Ltd - Rent Receivable</LEDGERNAME>
                        <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                        <AMOUNT>-${v.amount}</AMOUNT>
                    </ALLLEDGERENTRIES.LIST>
                    <ALLLEDGERENTRIES.LIST>
                        <LEDGERNAME>Electricity Rent</LEDGERNAME>
                        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                        <AMOUNT>${v.amount}</AMOUNT>
                        <CATEGORYALLOCATIONS.LIST>
                            <CATEGORY>Properties</CATEGORY>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <COSTCENTREALLOCATIONS.LIST>
                                <NAME>37 Highstreet</NAME>
                                <AMOUNT>${v.amount}</AMOUNT>
                            </COSTCENTREALLOCATIONS.LIST>
                        </CATEGORYALLOCATIONS.LIST>
                    </ALLLEDGERENTRIES.LIST>
                </VOUCHER>
            </TALLYMESSAGE>
        `;
    }
    
    vouchersXml += `</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
    
    console.log("\\nPushing Vouchers to Tally...");
    const vouchersResponse = await sendToTally(vouchersXml);
    console.log("Vouchers response:");
    console.log(vouchersResponse.match(/<(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join('\\n') || vouchersResponse.substring(0, 300));
}

main().catch(console.error);
