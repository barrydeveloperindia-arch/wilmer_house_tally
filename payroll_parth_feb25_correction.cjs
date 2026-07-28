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
    // Step 1: Find the existing Feb 2025 Parth payroll voucher
    const queryXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
      <BODY>
        <EXPORTDATA>
          <REQUESTDESC>
            <REPORTNAME>Ledger Vouchers</REPORTNAME>
            <STATICVARIABLES>
              <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
              <LEDGERNAME>Parth Kumar Salary</LEDGERNAME>
              <SVFROMDATE>20250201</SVFROMDATE>
              <SVTODATE>20250228</SVTODATE>
            </STATICVARIABLES>
          </REQUESTDESC>
        </EXPORTDATA>
      </BODY>
    </ENVELOPE>`;

    console.log('Finding existing Feb 2025 Parth payroll voucher...');
    const queryRes = await postToTally(queryXml);
    require('fs').writeFileSync('parth_feb_vouchers.xml', queryRes);
    console.log('Saved to parth_feb_vouchers.xml');

    // Extract voucher number
    const vchNos = queryRes.match(/<VCHNO>[^<]+<\/VCHNO>/g);
    const vchTypes = queryRes.match(/<VOUCHERTYPENAME>[^<]+<\/VOUCHERTYPENAME>/g);
    console.log('Voucher Numbers:', vchNos);
    console.log('Voucher Types:', vchTypes);

    // Step 2: Alter the voucher with correct amounts
    // OLD: Gross 276.00, Tax 55.20, Net 220.80
    // NEW: Gross 471.50, Tax 94.20, Net 377.30, Employer NICs: 0

    // Post a reversal of old entry + new correct entry
    const correctionXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
          <REQUESTDATA>

            <!-- REVERSAL of old wrong entry -->
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER VCHTYPE="Journal" ACTION="Create">
                <DATE>20250228</DATE>
                <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                <NARRATION>REVERSAL - Payroll - Parth Kumar Patoliya - Feb 2025 (Correction)</NARRATION>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>276.00</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-55.20</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-220.80</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
              </VOUCHER>
            </TALLYMESSAGE>

            <!-- CORRECT new entry -->
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER VCHTYPE="Journal" ACTION="Create">
                <DATE>20250228</DATE>
                <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                <NARRATION>Payroll - Parth Kumar Patoliya - Month 11 - Feb 2025 (CORRECTED)</NARRATION>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>-471.50</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>94.20</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Parth Kumar Salary Payable</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>377.30</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
              </VOUCHER>
            </TALLYMESSAGE>

          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>`;

    console.log('\nPosting reversal + correct entry for Feb 2025 Parth...');
    const corrRes = await postToTally(correctionXml);
    const summary = corrRes.match(/<(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join(' ');
    console.log('Result:', summary);

    if (corrRes.includes('<CREATED>2</CREATED>')) {
        console.log('\n✅ SUCCESS! Feb 2025 Parth entry updated.');
        console.log('   Old Entry Reversed: Dr 276.00 reversed');
        console.log('   New Correct Entry:');
        console.log('   Dr. Parth Kumar Salary      £471.50');
        console.log('   Cr. HMRC PAYE Tax Payable    £94.20');
        console.log('   Cr. Parth Salary Payable     £377.30');
    } else {
        console.log('\nFull Response:', corrRes);
    }
}

main().catch(console.error);
