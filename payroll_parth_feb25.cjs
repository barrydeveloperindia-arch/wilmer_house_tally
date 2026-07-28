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
    // Step 1: Create required ledgers
    const ledgersXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>
            <TALLYMESSAGE>
              <LEDGER ACTION="Create">
                <NAME>Parth Kumar Salary</NAME>
                <PARENT>Indirect Expenses</PARENT>
              </LEDGER>
            </TALLYMESSAGE>
            <TALLYMESSAGE>
              <LEDGER ACTION="Create">
                <NAME>Parth Kumar Salary Payable</NAME>
                <PARENT>Current Liabilities</PARENT>
              </LEDGER>
            </TALLYMESSAGE>
            <TALLYMESSAGE>
              <LEDGER ACTION="Create">
                <NAME>HMRC PAYE Tax Payable</NAME>
                <PARENT>Current Liabilities</PARENT>
              </LEDGER>
            </TALLYMESSAGE>
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>`;

    console.log('Creating ledgers...');
    const ledRes = await postToTally(ledgersXml);
    console.log('Ledgers:', ledRes.match(/<(CREATED|ALTERED|ERRORS|EXCEPTIONS)>[^<]+<\/(CREATED|ALTERED|ERRORS|EXCEPTIONS)>/g)?.join(' '));

    // Step 2: Create Journal Voucher for Parth Kumar Patoliya - Feb 2025
    // Date: 28-Feb-2025 => 20250228
    // Gross Pay: 276.00
    // PAYE Tax: 55.20
    // Net Pay: 220.80
    // No Employee NICs, No Employer NICs

    const voucherXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER VCHTYPE="Journal" ACTION="Create">
                <DATE>20250228</DATE>
                <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                <NARRATION>Payroll - Parth Kumar Patoliya - Month 11 - Feb 2025</NARRATION>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-276.00</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>55.20</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>220.80</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
              </VOUCHER>
            </TALLYMESSAGE>
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>`;

    console.log('\nPosting Journal Voucher for Parth Kumar Patoliya...');
    const vchRes = await postToTally(voucherXml);
    console.log('Result:', vchRes.match(/<(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join(' '));

    if (vchRes.includes('<CREATED>1</CREATED>')) {
        console.log('\n✅ SUCCESS! Journal entry for Parth Kumar Patoliya posted in Tally.');
        console.log('   Dr. Parth Kumar Salary       £276.00');
        console.log('   Cr. HMRC PAYE Tax Payable    £55.20');
        console.log('   Cr. Parth Kumar Salary Payable £220.80');
    } else {
        console.log('\n⚠️  Check the response above for any errors.');
        console.log('Full response:', vchRes);
    }
}

main().catch(console.error);
