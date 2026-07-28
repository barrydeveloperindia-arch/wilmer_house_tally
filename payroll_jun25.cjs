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
    // Month 3 - Ending 30 June 2025
    // Date: 20250630

    // === PARTH KUMAR PATOLIYA ===
    // Gross Pay: 976.80 | Tax: -293.00 (REFUND) | Employee NICs: 0 | Employer NICs: 83.97 | Net Pay: 1,269.80
    // NOTE: Tax is NEGATIVE = HMRC refunding tax to employee → Dr HMRC PAYE Tax Payable

    // === SALIL ANAND ===
    // Gross Pay: 1,666.67 | Tax: 123.80 | Employee NICs: 0 | Employer NICs: 0 | Net Pay: 1,542.87

    const vouchersXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>

            <!-- Parth Kumar Patoliya - Jun 2025 (Tax Refund month) -->
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER VCHTYPE="Journal" ACTION="Create">
                <DATE>20250630</DATE>
                <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                <NARRATION>Payroll - Parth Kumar Patoliya - Month 3 - Jun 2025 (Tax Refund -293.00)</NARRATION>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-976.80</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Employer NICs</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-83.97</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-293.00</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Employer NICs Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>83.97</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>1269.80</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
              </VOUCHER>
            </TALLYMESSAGE>

            <!-- Salil Anand - Jun 2025 -->
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER VCHTYPE="Journal" ACTION="Create">
                <DATE>20250630</DATE>
                <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                <NARRATION>Payroll - Salil Anand - Month 3 - Jun 2025</NARRATION>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Salil Anand Salary</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-1666.67</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>123.80</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Salil Anand Salary Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>1542.87</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
              </VOUCHER>
            </TALLYMESSAGE>

          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>`;

    console.log('Posting payroll journals for June 2025...');
    const res = await postToTally(vouchersXml);
    const summary = res.match(/<(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join(' ');
    console.log('Result:', summary);

    if (res.includes('<CREATED>2</CREATED>')) {
        console.log('\n✅ SUCCESS! Both payroll entries posted for June 2025.');
        console.log('\n--- Parth Kumar Patoliya (Tax Refund) ---');
        console.log('   Dr. Parth Kumar Salary      £976.80');
        console.log('   Dr. Employer NICs            £83.97');
        console.log('   Dr. HMRC PAYE Tax Payable    £293.00  <-- Tax Refund');
        console.log('   Cr. Employer NICs Payable    £83.97');
        console.log('   Cr. Parth Salary Payable     £1,269.80');
        console.log('\n--- Salil Anand ---');
        console.log('   Dr. Salil Anand Salary       £1,666.67');
        console.log('   Cr. HMRC PAYE Tax Payable    £123.80');
        console.log('   Cr. Salil Salary Payable     £1,542.87');
    } else {
        console.log('\nFull Response:', res);
    }
}

main().catch(console.error);
