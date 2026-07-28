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
    // Create ledgers for new employee Pinal Nayankumar Godhani
    const ledgersXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC><REQUESTDATA>
        <TALLYMESSAGE>
          <LEDGER ACTION="Create">
            <NAME>Pinal Godhani Salary</NAME>
            <PARENT>Indirect Expenses</PARENT>
          </LEDGER>
        </TALLYMESSAGE>
        <TALLYMESSAGE>
          <LEDGER ACTION="Create">
            <NAME>Pinal Godhani Salary Payable</NAME>
            <PARENT>Current Liabilities</PARENT>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;

    console.log('Creating ledgers for Pinal Godhani...');
    const ledRes = await postToTally(ledgersXml);
    const ledSummary = ledRes.match(/<(CREATED|ERRORS|EXCEPTIONS)>[^<]+<\/(CREATED|ERRORS|EXCEPTIONS)>/g)?.join(' ');
    console.log('Ledgers:', ledSummary);

    // Month 6 - Ending 30 September 2025 - 4 Employees
    const vouchersXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
      <BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC><REQUESTDATA>

        <!-- 1. Nayankumar Arvind Godhani - Sep 2025 -->
        <!-- Gross: 219.78 | Tax: 0 | NICs: 0 | Net: 219.78 -->
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Journal" ACTION="Create">
            <DATE>20250930</DATE><VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
            <NARRATION>Payroll - Nayankumar Arvind Godhani - Month 6 - Sep 2025</NARRATION>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Nayankumar Godhani Salary</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-219.78</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Nayankumar Godhani Salary Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>219.78</AMOUNT></ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>

        <!-- 2. Parth Kumar Patoliya - Sep 2025 -->
        <!-- Gross: 2,490.84 | Tax: 288.40 | Emp NICs: 115.43 | Emp'r NICs: 311.08 | Net: 2,087.01 -->
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Journal" ACTION="Create">
            <DATE>20250930</DATE><VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
            <NARRATION>Payroll - Parth Kumar Patoliya - Month 6 - Sep 2025</NARRATION>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Parth Kumar Salary</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-2490.84</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Employer NICs</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-311.08</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>288.40</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Employee NICs Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>115.43</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Employer NICs Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>311.08</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Parth Kumar Salary Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>2087.01</AMOUNT></ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>

        <!-- 3. Pinal Nayankumar Godhani - Sep 2025 (NEW EMPLOYEE) -->
        <!-- Gross: 219.78 | Tax: 0 | NICs: 0 | Net: 219.78 -->
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Journal" ACTION="Create">
            <DATE>20250930</DATE><VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
            <NARRATION>Payroll - Pinal Nayankumar Godhani - Month 6 - Sep 2025</NARRATION>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Pinal Godhani Salary</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-219.78</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Pinal Godhani Salary Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>219.78</AMOUNT></ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>

        <!-- 4. Salil Anand - Sep 2025 -->
        <!-- Gross: 1,666.67 | Tax: 123.60 | Emp NICs: 0 | Emp'r NICs: 250.00 | Net: 1,543.07 -->
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Journal" ACTION="Create">
            <DATE>20250930</DATE><VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
            <NARRATION>Payroll - Salil Anand - Month 6 - Sep 2025</NARRATION>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Salil Anand Salary</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-1666.67</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Employer NICs</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-250.00</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>HMRC PAYE Tax Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>123.60</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Employer NICs Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>250.00</AMOUNT></ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST><LEDGERNAME>Salil Anand Salary Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>1543.07</AMOUNT></ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>

      </REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;

    console.log('\nPosting 4 payroll entries for Sep 2025...');
    const res = await postToTally(vouchersXml);
    const summary = res.match(/<(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join(' ');
    console.log('Result:', summary);

    if (res.includes('<CREATED>4</CREATED>')) {
        console.log('\n✅ SUCCESS! All 4 payroll entries posted for September 2025.');
        console.log('   1. Nayankumar Godhani   - £219.78');
        console.log('   2. Parth Kumar Patoliya  - £2,490.84 gross / £2,087.01 net');
        console.log('   3. Pinal Godhani         - £219.78');
        console.log('   4. Salil Anand           - £1,666.67 gross / £1,543.07 net');
    } else {
        console.log('\nFull Response:', res);
    }
}

main().catch(console.error);
