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
    // Month 3 - Ending 30 June 2025 - CORRECTION for Parth Kumar Patoliya
    // OLD: Gross 976.80, Tax -293.00, Emp NICs 0, Emp'r NICs 83.97, Net 1,269.80
    // NEW: Gross 1,196.58, Tax -293.00, Emp NICs 11.89, Emp'r NICs 116.94, Net 1,477.69

    const correctionXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>

            <!-- REVERSAL of old wrong Jun 2025 Parth entry -->
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER VCHTYPE="Journal" ACTION="Create">
                <DATE>20250630</DATE>
                <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                <NARRATION>REVERSAL - Payroll - Parth Kumar Patoliya - Month 3 - Jun 2025 (Correction)</NARRATION>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>976.80</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Employer NICs</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>83.97</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>293.00</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Employer NICs Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-83.97</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-1269.80</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
              </VOUCHER>
            </TALLYMESSAGE>

            <!-- CORRECTED Jun 2025 Parth entry -->
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER VCHTYPE="Journal" ACTION="Create">
                <DATE>20250630</DATE>
                <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                <NARRATION>Payroll - Parth Kumar Patoliya - Month 3 - Jun 2025 (CORRECTED)</NARRATION>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-1196.58</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Employer NICs</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-116.94</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-293.00</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Employee NICs Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>11.89</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Employer NICs Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>116.94</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>1477.69</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
              </VOUCHER>
            </TALLYMESSAGE>

          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>`;

    console.log('Posting correction for Jun 2025 Parth...');
    const res = await postToTally(correctionXml);
    const summary = res.match(/<(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join(' ');
    console.log('Result:', summary);

    if (res.includes('<CREATED>2</CREATED>')) {
        console.log('\n✅ SUCCESS! Jun 2025 Parth entry corrected.');
        console.log('\n--- Corrected Entry (Parth Kumar Patoliya - Jun 2025) ---');
        console.log('   Dr. Parth Kumar Salary      £1,196.58');
        console.log('   Dr. Employer NICs            £116.94');
        console.log('   Dr. HMRC PAYE Tax Payable    £293.00  <-- Tax Refund');
        console.log('   Cr. Employee NICs Payable    £11.89');
        console.log('   Cr. Employer NICs Payable    £116.94');
        console.log('   Cr. Parth Salary Payable     £1,477.69');
    } else {
        console.log('\nFull Response:', res);
    }
}

main().catch(console.error);
