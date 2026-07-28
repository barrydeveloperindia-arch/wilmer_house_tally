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
    // ============================================================
    // PART 1: Correction for Jun 2025 - Parth Kumar Patoliya
    // OLD: Gross 976.80, Tax -293.00, Emp NICs 0, Emp'r NICs 83.97, Net 1,269.80
    // NEW: Gross 1,196.58, Tax -293.00, Emp NICs 11.89, Emp'r NICs 116.94, Net 1,477.69
    // ============================================================
    const junCorrXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC><REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Journal" ACTION="Create">
            <DATE>20250630</DATE><VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
            <NARRATION>REVERSAL - Payroll - Parth Jun 2025 (Correction)</NARRATION>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Parth Kumar Salary</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>976.80</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Employer NICs</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>83.97</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>293.00</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Employer NICs Payable</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-83.97</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Parth Kumar Salary Payable</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-1269.80</AMOUNT></ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Journal" ACTION="Create">
            <DATE>20250630</DATE><VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
            <NARRATION>Payroll - Parth Kumar Patoliya - Month 3 - Jun 2025 (CORRECTED)</NARRATION>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Parth Kumar Salary</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-1196.58</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Employer NICs</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-116.94</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-293.00</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Employee NICs Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>11.89</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Employer NICs Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>116.94</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Parth Kumar Salary Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>1477.69</AMOUNT></ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;

    console.log('1. Posting Jun 2025 Parth correction...');
    const junRes = await postToTally(junCorrXml);
    const junSummary = junRes.match(/<(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join(' ');
    console.log('Jun correction:', junSummary);

    // ============================================================
    // PART 2: Month 4 - Ending 31 July 2025
    // Parth: Gross 1,098.90, Tax 0, Emp NICs 4.07, Emp'r NICs 102.28, Net 1,094.83
    // Salil: Gross 1,666.67, Tax 123.60, Emp NICs 0, Emp'r NICs 250.00, Net 1,543.07
    // ============================================================
    const julXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC><REQUESTDATA>

        <!-- Parth Kumar Patoliya - Jul 2025 -->
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Journal" ACTION="Create">
            <DATE>20250731</DATE><VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
            <NARRATION>Payroll - Parth Kumar Patoliya - Month 4 - Jul 2025</NARRATION>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Parth Kumar Salary</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-1098.90</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Employer NICs</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-102.28</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Employee NICs Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>4.07</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Employer NICs Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>102.28</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Parth Kumar Salary Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>1094.83</AMOUNT></ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>

        <!-- Salil Anand - Jul 2025 -->
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Journal" ACTION="Create">
            <DATE>20250731</DATE><VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
            <NARRATION>Payroll - Salil Anand - Month 4 - Jul 2025</NARRATION>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Salil Anand Salary</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-1666.67</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Employer NICs</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-250.00</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>123.60</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Employer NICs Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>250.00</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Salil Anand Salary Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>1543.07</AMOUNT></ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>

      </REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;

    console.log('\n2. Posting Month 4 - Jul 2025...');
    const julRes = await postToTally(julXml);
    const julSummary = julRes.match(/<(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join(' ');
    console.log('Jul result:', julSummary);

    if (julRes.includes('<CREATED>2</CREATED>')) {
        console.log('\n✅ SUCCESS! Month 4 (July 2025) posted.');
        console.log('\n--- Parth Kumar Patoliya ---');
        console.log('   Dr. Parth Kumar Salary      £1,098.90');
        console.log('   Dr. Employer NICs            £102.28');
        console.log('   Cr. Employee NICs Payable    £4.07');
        console.log('   Cr. Employer NICs Payable    £102.28');
        console.log('   Cr. Parth Salary Payable     £1,094.83');
        console.log('\n--- Salil Anand ---');
        console.log('   Dr. Salil Anand Salary       £1,666.67');
        console.log('   Dr. Employer NICs            £250.00');
        console.log('   Cr. HMRC PAYE Tax Payable    £123.60');
        console.log('   Cr. Employer NICs Payable    £250.00');
        console.log('   Cr. Salil Salary Payable     £1,543.07');
    } else {
        console.log('\nFull Jul response:', julRes);
    }
}

main().catch(console.error);
