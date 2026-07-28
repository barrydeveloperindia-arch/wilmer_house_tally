const fs = require('fs');
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

function parseSummaryOrdered(xmlSection) {
    const list = [];
    const regex = /<DSPPERIOD>(.*?)<\/DSPPERIOD>[\s\S]*?<DSPCRAMTA>(.*?)<\/DSPCRAMTA>/g;
    let match;
    let currentYear = 2025;
    let lastMonth = '';
    while ((match = regex.exec(xmlSection)) !== null) {
        let monthName = match[1];
        const creditAmt = parseFloat(match[2]) || 0;
        
        if (lastMonth === 'December' && monthName === 'January') {
            currentYear = 2026;
        }
        
        let dateStr = monthName + " " + currentYear;
        let monthNum = new Date(Date.parse(monthName +" 1, 2012")).getMonth() + 1;
        let lastDay = new Date(currentYear, monthNum, 0).getDate();
        let mStr = monthNum < 10 ? '0'+monthNum : ''+monthNum;
        let dStr = '' + currentYear + mStr + lastDay;
        
        list.push({ month: monthName, year: currentYear, date: dStr, amount: creditAmt });
        lastMonth = monthName;
    }
    return list;
}

async function main() {
    const rawData = fs.readFileSync('nics_summary.xml', 'utf8');
    const parts = rawData.split('<!-- SEP -->');
    const empData = parseSummaryOrdered(parts[0]);
    const emprData = parseSummaryOrdered(parts[1]);
    console.log("Parsed Emp:", empData.length, "Empr:", emprData.length);

    let ledgerXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>
            <TALLYMESSAGE>
                <LEDGER ACTION="Create">
                    <NAME>NICs Payable</NAME>
                    <PARENT>Current Liabilities</PARENT>
                </LEDGER>
            </TALLYMESSAGE>
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>
    `;
    await sendToTally(ledgerXml);
    console.log("Created NICs Payable ledger");

    let vouchersXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>
    `;

    for (let i = 0; i < empData.length; i++) {
        let empAmt = empData[i].amount;
        let emprAmt = emprData[i].amount;
        let total = empAmt + emprAmt;
        if (total > 0) {
            vouchersXml += `
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
                <VOUCHER VCHTYPE="Journal" ACTION="Create">
                    <DATE>${empData[i].date}</DATE>
                    <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                    <NARRATION>Month-wise transfer to combined NICs Payable</NARRATION>
            `;
            
            if (empAmt > 0) {
                vouchersXml += `
                    <ALLLEDGERENTRIES.LIST>
                        <LEDGERNAME>Employee NICs Payable</LEDGERNAME>
                        <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                        <AMOUNT>-${empAmt.toFixed(2)}</AMOUNT>
                    </ALLLEDGERENTRIES.LIST>
                `;
            }
            if (emprAmt > 0) {
                vouchersXml += `
                    <ALLLEDGERENTRIES.LIST>
                        <LEDGERNAME>Employer NICs Payable</LEDGERNAME>
                        <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                        <AMOUNT>-${emprAmt.toFixed(2)}</AMOUNT>
                    </ALLLEDGERENTRIES.LIST>
                `;
            }
            
            vouchersXml += `
                    <ALLLEDGERENTRIES.LIST>
                        <LEDGERNAME>NICs Payable</LEDGERNAME>
                        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                        <AMOUNT>${total.toFixed(2)}</AMOUNT>
                    </ALLLEDGERENTRIES.LIST>
                </VOUCHER>
            </TALLYMESSAGE>
            `;
        }
    }

    vouchersXml += `</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
    console.log("Pushing Vouchers...");
    const vRes = await sendToTally(vouchersXml);
    console.log("Vouchers Response: " + (vRes.match(/<(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join('\n') || vRes.substring(0,300)));
}

main().catch(console.error);
