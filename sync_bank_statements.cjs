const fs = require('fs');
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
    const files = [
        'Transactions_Export_May_2026_44304678.csv',
        'Transactions_Export_Jun_2026_44304678.csv'
    ];
    
    const bankLedger = "WILMER HOUSE LTD Bank";
    const suspenseLedger = "Suspense A/c";
    
    // Create the Suspense ledger if it doesn't exist
    let ledgersXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>
            <TALLYMESSAGE>
                <LEDGER ACTION="Create">
                    <NAME>${escapeXml(suspenseLedger)}</NAME>
                    <PARENT>Suspense A/c</PARENT>
                </LEDGER>
            </TALLYMESSAGE>
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>
    `;
    console.log("Creating Suspense ledger...");
    await sendToTally(ledgersXml);
    
    let vouchersXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>
    `;
    
    let count = 0;
    
    for (const file of files) {
        if (!fs.existsSync(file)) {
            console.warn(`File ${file} not found!`);
            continue;
        }
        
        const data = fs.readFileSync(file, 'utf8');
        const lines = data.split('\n').filter(l => l.trim() !== '');
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            let inQuotes = false;
            let cols = [];
            let current = '';
            for(let char of line) {
                if(char === '"') inQuotes = !inQuotes;
                else if(char === ',' && !inQuotes) { cols.push(current); current = ''; }
                else current += char;
            }
            cols.push(current);
            
            if (cols.length >= 6) {
                const dateStrRaw = cols[0].trim(); // DD/MM/YYYY
                const parts = dateStrRaw.split('/');
                if (parts.length !== 3) continue;
                const dateStr = `${parts[2]}${parts[1]}${parts[0]}`; // YYYYMMDD
                
                const detail = cols[1].trim();
                const txnType = cols[2].trim();
                const valIn = parseFloat(cols[3]);
                const valOut = parseFloat(cols[4]);
                
                const isReceipt = !isNaN(valIn) && valIn > 0;
                const isPayment = !isNaN(valOut) && valOut > 0;
                
                const narration = `Bank Transaction: ${detail} - ${txnType}`;
                
                if (isReceipt) {
                    vouchersXml += `
                        <TALLYMESSAGE xmlns:UDF="TallyUDF">
                            <VOUCHER VCHTYPE="Receipt" ACTION="Create">
                                <DATE>${dateStr}</DATE>
                                <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
                                <NARRATION>${escapeXml(narration)}</NARRATION>
                                <ALLLEDGERENTRIES.LIST>
                                    <LEDGERNAME>${escapeXml(suspenseLedger)}</LEDGERNAME>
                                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                                    <AMOUNT>${valIn}</AMOUNT>
                                </ALLLEDGERENTRIES.LIST>
                                <ALLLEDGERENTRIES.LIST>
                                    <LEDGERNAME>${escapeXml(bankLedger)}</LEDGERNAME>
                                    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                                    <AMOUNT>-${valIn}</AMOUNT>
                                </ALLLEDGERENTRIES.LIST>
                            </VOUCHER>
                        </TALLYMESSAGE>
                    `;
                    count++;
                } else if (isPayment) {
                    vouchersXml += `
                        <TALLYMESSAGE xmlns:UDF="TallyUDF">
                            <VOUCHER VCHTYPE="Payment" ACTION="Create">
                                <DATE>${dateStr}</DATE>
                                <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
                                <NARRATION>${escapeXml(narration)}</NARRATION>
                                <ALLLEDGERENTRIES.LIST>
                                    <LEDGERNAME>${escapeXml(suspenseLedger)}</LEDGERNAME>
                                    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                                    <AMOUNT>-${valOut}</AMOUNT>
                                </ALLLEDGERENTRIES.LIST>
                                <ALLLEDGERENTRIES.LIST>
                                    <LEDGERNAME>${escapeXml(bankLedger)}</LEDGERNAME>
                                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                                    <AMOUNT>${valOut}</AMOUNT>
                                </ALLLEDGERENTRIES.LIST>
                            </VOUCHER>
                        </TALLYMESSAGE>
                    `;
                    count++;
                }
            }
        }
    }
    
    vouchersXml += `</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
    
    console.log(`Pushing ${count} Vouchers to Tally...`);
    const vouchersResponse = await sendToTally(vouchersXml);
    console.log("Vouchers response:");
    console.log(vouchersResponse.match(/<(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join('\\n') || vouchersResponse.substring(0, 300));
}

main().catch(console.error);
