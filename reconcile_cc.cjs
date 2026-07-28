const fs = require('fs');
const http = require('http');

// 1. Calculate CSV Total
const data = fs.readFileSync('Extracted_CC_Transactions.csv', 'utf8');
const lines = data.split('\n').filter(l => l.trim() !== '');

let csvNet = 0;
let expenseTotal = 0;
let paymentTotal = 0;

for (let i = 1; i < lines.length; i++) {
    const match = lines[i].match(/"[^"]*","([^"]*)",([-\d\.]+)/);
    if (match) {
        const val = parseFloat(match[2]);
        if (!isNaN(val)) {
            csvNet += val;
            if (val >= 0) expenseTotal += val;
            else paymentTotal += val;
        }
    }
}

console.log(`--- CSV Data ---`);
console.log(`Total Expenses (Debits): ${expenseTotal.toFixed(2)}`);
console.log(`Total Payments Received (Credits): ${paymentTotal.toFixed(2)}`);
console.log(`Net Balance from CSV: ${csvNet.toFixed(2)}`);
console.log(``);

// 2. Query Tally
const xml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY>
        <EXPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>Ledger Vouchers</REPORTNAME>
                <STATICVARIABLES>
                    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                    <LEDGERNAME>Credit Card</LEDGERNAME>
                </STATICVARIABLES>
            </REQUESTDESC>
        </EXPORTDATA>
    </BODY>
</ENVELOPE>
`;

const req = http.request('http://localhost:9000', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml', 'Content-Length': Buffer.byteLength(xml) }
}, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
        console.log(`--- Tally Data ---`);
        
        // Extract Closing Balance from Tally XML
        const clBalMatch = d.match(/<CLOSINGBALANCE>([^<]+)<\/CLOSINGBALANCE>/);
        if (clBalMatch) {
            console.log(`Closing Balance of 'Credit Card' in Tally: ${clBalMatch[1]}`);
        } else {
            console.log(`Could not extract closing balance. Length of response: ${d.length}`);
            if (d.includes('LINEERROR')) {
                const errorMatch = d.match(/<LINEERROR>([^<]+)<\/LINEERROR>/);
                console.log(`Tally Error: ${errorMatch ? errorMatch[1] : 'Unknown'}`);
            }
        }
        
        // Extract Total Vouchers
        const vouchers = d.match(/<VOUCHER /g);
        console.log(`Total Vouchers imported in Tally for this ledger: ${vouchers ? vouchers.length : 0}`);
        
    });
});
req.on('error', console.error);
req.write(xml);
req.end();
