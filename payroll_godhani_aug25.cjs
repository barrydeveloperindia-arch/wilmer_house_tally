const http = require('http');

function postToTally(xml) {
    return new Promise((resolve, reject) => {
        const req = http.request('http://localhost:9000', {
            method: 'POST',
            headers: { 'Content-Type': 'text/xml', 'Content-Length': Buffer.byteLength(xml) }
        }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(d));
        });
        req.on('error', reject);
        req.write(xml);
        req.end();
    });
}

async function main() {
    // Create ledgers for new employee
    const ledgersXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC><REQUESTDATA>
        <TALLYMESSAGE>
          <LEDGER ACTION="Create">
            <NAME>Nayankumar Godhani Salary</NAME>
            <PARENT>Indirect Expenses</PARENT>
          </LEDGER>
        </TALLYMESSAGE>
        <TALLYMESSAGE>
          <LEDGER ACTION="Create">
            <NAME>Nayankumar Godhani Salary Payable</NAME>
            <PARENT>Current Liabilities</PARENT>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;

    console.log('Creating ledgers for Nayankumar Godhani...');
    const ledRes = await postToTally(ledgersXml);
    const ledSummary = ledRes.match(/<(CREATED|ERRORS|EXCEPTIONS)>[^<]+<\/(CREATED|ERRORS|EXCEPTIONS)>/g)?.join(' ');
    console.log('Ledgers:', ledSummary);

    // Month 5 - Aug 2025 - Nayankumar Arvind Godhani
    // Gross: 219.78 | Tax: 0 | Emp NICs: 0 | Emp'r NICs: 0 | Net Pay: 219.78
    const voucherXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC><REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Journal" ACTION="Create">
            <DATE>20250831</DATE>
            <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
            <NARRATION>Payroll - Nayankumar Arvind Godhani - Month 5 - Aug 2025</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Nayankumar Godhani Salary</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-219.78</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Nayankumar Godhani Salary Payable</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>219.78</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;

    console.log('\nPosting payroll for Nayankumar Godhani - Aug 2025...');
    const res = await postToTally(voucherXml);
    const summary = res.match(/<(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join(' ');
    console.log('Result:', summary);

    if (res.includes('<CREATED>1</CREATED>')) {
        console.log('\n✅ SUCCESS! Nayankumar Godhani payroll posted for Aug 2025.');
        console.log('   Dr. Nayankumar Godhani Salary       £219.78');
        console.log('   Cr. Nayankumar Godhani Salary Payable £219.78');
    } else {
        console.log('\nFull Response:', res);
    }
}

main().catch(console.error);
