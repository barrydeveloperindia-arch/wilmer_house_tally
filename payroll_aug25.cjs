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
    // Month 5 - Ending 31 August 2025
    // Date: 20250831

    // === PARTH KUMAR PATOLIYA ===
    // Gross Pay: 2,490.84 | Tax: 202.00 | Employee NICs: 115.43 | Employer NICs: 311.08 | Net Pay: 2,173.41

    // === SALIL ANAND ===
    // Gross Pay: 1,666.67 | Tax: 123.80 | Employee NICs: 0.00 | Employer NICs: 250.00 | Net Pay: 1,542.87

    const vouchersXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>

            <!-- Parth Kumar Patoliya - Aug 2025 -->
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER VCHTYPE="Journal" ACTION="Create">
                <DATE>20250831</DATE>
                <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                <NARRATION>Payroll - Parth Kumar Patoliya - Month 5 - Aug 2025</NARRATION>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-2490.84</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Employer NICs</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-311.08</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>202.00</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Employee NICs Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>115.43</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Employer NICs Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>311.08</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>2173.41</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
              </VOUCHER>
            </TALLYMESSAGE>

            <!-- Salil Anand - Aug 2025 -->
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER VCHTYPE="Journal" ACTION="Create">
                <DATE>20250831</DATE>
                <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                <NARRATION>Payroll - Salil Anand - Month 5 - Aug 2025</NARRATION>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Salil Anand Salary</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-1666.67</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Employer NICs</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-250.00</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>123.80</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Employer NICs Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>250.00</AMOUNT>
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

    console.log('Posting payroll journals for August 2025...');
    const res = await postToTally(vouchersXml);
    const summary = res.match(/<(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join(' ');
    console.log('Result:', summary);

    if (res.includes('<CREATED>2</CREATED>')) {
        console.log('\n✅ SUCCESS! Both payroll entries posted for August 2025.');
        console.log('\n--- Parth Kumar Patoliya ---');
        console.log('   Dr. Parth Kumar Salary      £2,490.84');
        console.log('   Dr. Employer NICs            £311.08');
        console.log('   Cr. HMRC PAYE Tax Payable    £202.00');
        console.log('   Cr. Employee NICs Payable    £115.43');
        console.log('   Cr. Employer NICs Payable    £311.08');
        console.log('   Cr. Parth Salary Payable     £2,173.41');
        console.log('\n--- Salil Anand ---');
        console.log('   Dr. Salil Anand Salary       £1,666.67');
        console.log('   Dr. Employer NICs            £250.00');
        console.log('   Cr. HMRC PAYE Tax Payable    £123.80');
        console.log('   Cr. Employer NICs Payable    £250.00');
        console.log('   Cr. Salil Salary Payable     £1,542.87');
    } else {
        console.log('\nFull Response:', res);
    }
}

main().catch(console.error);
