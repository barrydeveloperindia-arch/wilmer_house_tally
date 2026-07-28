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
    // Month 1 - Ending 30 April 2025
    // Date: 20250430

    // === PARTH KUMAR PATOLIYA ===
    // Gross Pay: 488.40
    // Tax: 97.60
    // Employee NICs: 0.00
    // Employer NICs: 10.71
    // Net Pay: 390.80
    // Cost to employer: 499.11

    // === SALIL ANAND ===
    // Gross Pay: 1,666.67
    // Tax: 123.60
    // Employee NICs: 0.00
    // Employer NICs: 0.00
    // Net Pay: 1,543.07

    const vouchersXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>

            <!-- Parth Kumar Patoliya - Apr 2025 -->
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER VCHTYPE="Journal" ACTION="Create">
                <DATE>20250430</DATE>
                <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                <NARRATION>Payroll - Parth Kumar Patoliya - Month 1 - Apr 2025</NARRATION>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-488.40</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Employer NICs</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-10.71</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>97.60</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Employer NICs Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>10.71</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>390.80</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
              </VOUCHER>
            </TALLYMESSAGE>

            <!-- Salil Anand - Apr 2025 -->
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER VCHTYPE="Journal" ACTION="Create">
                <DATE>20250430</DATE>
                <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                <NARRATION>Payroll - Salil Anand - Month 1 - Apr 2025</NARRATION>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Salil Anand Salary</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-1666.67</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>123.60</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Salil Anand Salary Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>1543.07</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
              </VOUCHER>
            </TALLYMESSAGE>

          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>`;

    console.log('Posting payroll journals for April 2025...');
    const res = await postToTally(vouchersXml);
    const summary = res.match(/<(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join(' ');
    console.log('Result:', summary);

    if (res.includes('<CREATED>2</CREATED>')) {
        console.log('\n✅ SUCCESS! Both payroll entries posted for April 2025.');
        console.log('\n--- Parth Kumar Patoliya ---');
        console.log('   Dr. Parth Kumar Salary      £488.40');
        console.log('   Dr. Employer NICs            £10.71');
        console.log('   Cr. HMRC PAYE Tax Payable    £97.60');
        console.log('   Cr. Employer NICs Payable    £10.71');
        console.log('   Cr. Parth Salary Payable     £390.80');
        console.log('\n--- Salil Anand ---');
        console.log('   Dr. Salil Anand Salary       £1,666.67');
        console.log('   Cr. HMRC PAYE Tax Payable    £123.60');
        console.log('   Cr. Salil Salary Payable     £1,543.07');
    } else {
        console.log('\nFull Response:', res);
    }
}

main().catch(console.error);
