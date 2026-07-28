const fs = require('fs');
const http = require('http');

const TALLY_URL = "http://localhost:9000";

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

const months = {Jan:'01', Feb:'02', Mar:'03', Apr:'04', May:'05', Jun:'06', Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12'};

function parseDateFromFilename(filename) {
    const match = filename.match(/_-_(\d{1,2}_[A-Za-z]{3}_\d{4})/);
    if (match) {
        const [d, m, y] = match[1].split('_');
        return `${y}${months[m]}${d.padStart(2, '0')}`;
    }
    return "20251013"; // fallback to end of statement period
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
    const csv = fs.readFileSync('Extracted_CC_Transactions.csv', 'utf8');
    const lines = csv.split('\n').map(l => l.trim()).filter(l => l !== '');
    
    const targetFile = "14_Sep_2025_-_13_Oct_2025.pdf";
    
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        let inQuotes = false;
        let cols = [];
        let current = '';
        for (let char of line) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { cols.push(current); current = ''; }
            else current += char;
        }
        cols.push(current);
        
        if (cols.length >= 3 && cols[0].replace(/"/g, '') === targetFile) {
            rows.push({
                file: cols[0].replace(/"/g, ''),
                desc: cols[1].replace(/"/g, '').trim(),
                amount: parseFloat(cols[2])
            });
        }
    }
    
    const mainLiabilityLedger = "Credit Card American Express";
    
    // 1. Create Ledgers
    const uniqueLedgers = new Set(rows.map(r => r.desc));
    let ledgersXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>
    `;
    
    // Create the 'Credit Card Expense' group
    ledgersXml += `
        <TALLYMESSAGE>
            <GROUP ACTION="Create">
                <NAME>Credit Card Expense</NAME>
                <PARENT>Indirect Expenses</PARENT>
            </GROUP>
        </TALLYMESSAGE>
    `;

    for (let ledger of uniqueLedgers) {
        ledgersXml += `
            <TALLYMESSAGE>
                <LEDGER ACTION="Create">
                    <NAME>${escapeXml(ledger)}</NAME>
                    <PARENT>Credit Card Expense</PARENT>
                </LEDGER>
            </TALLYMESSAGE>
        `;
    }
    
    // Create the main liability ledger just in case it doesn't exist
    ledgersXml += `
        <TALLYMESSAGE>
            <LEDGER ACTION="Create">
                <NAME>${escapeXml(mainLiabilityLedger)}</NAME>
                <PARENT>Current Liabilities</PARENT>
            </LEDGER>
        </TALLYMESSAGE>
    `;

    ledgersXml += `</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
    
    console.log("Creating ledgers in Tally...");
    const ledgersResponse = await sendToTally(ledgersXml);
    console.log("Ledgers response:", ledgersResponse.substring(0, 300));

    // 2. Create Vouchers
    let vouchersXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>
    `;
    
    for (let row of rows) {
        if (isNaN(row.amount)) continue;
        
        const dateStr = parseDateFromFilename(row.file);
        const val = Math.abs(row.amount);
        const isExpense = row.amount >= 0;
        
        // If it is a regular expense (positive amount), we Debit the expense ledger, and Credit the Liability Ledger.
        // If it is a negative amount (credit/payment), we Debit the Liability Ledger, and Credit the expense ledger.
        const debitLedger = isExpense ? row.desc : mainLiabilityLedger;
        const creditLedger = isExpense ? mainLiabilityLedger : row.desc;
        
        vouchersXml += `
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
                <VOUCHER VCHTYPE="Journal" ACTION="Create">
                    <DATE>${dateStr}</DATE>
                    <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                    <NARRATION>Credit Card Transaction: ${escapeXml(row.desc)} from ${escapeXml(row.file)}</NARRATION>
                    <ALLLEDGERENTRIES.LIST>
                        <LEDGERNAME>${escapeXml(debitLedger)}</LEDGERNAME>
                        <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                        <AMOUNT>-${val}</AMOUNT>
                    </ALLLEDGERENTRIES.LIST>
                    <ALLLEDGERENTRIES.LIST>
                        <LEDGERNAME>${escapeXml(creditLedger)}</LEDGERNAME>
                        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                        <AMOUNT>${val}</AMOUNT>
                    </ALLLEDGERENTRIES.LIST>
                </VOUCHER>
            </TALLYMESSAGE>
        `;
    }
    
    vouchersXml += `</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
    
    console.log("Pushing Vouchers to Tally...");
    const vouchersResponse = await sendToTally(vouchersXml);
    console.log("Vouchers response:", vouchersResponse.substring(0, 300));
}

main().catch(console.error);
