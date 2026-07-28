const http = require('http');

let balance = 230000;
const rate = 6.5 / 100 / 12; // monthly rate
const emi = 1661.86;

const months = [
  '20250831', // Aug 2025
  '20250930', // Sep 2025
  '20251031', // Oct 2025
  '20251130', // Nov 2025
  '20251231', // Dec 2025
  '20260131', // Jan 2026
  '20260228', // Feb 2026
  '20260331', // Mar 2026
  '20260430', // Apr 2026
  '20260531', // May 2026
  '20260630'  // Jun 2026
];

let tallyMessageList = '';

// Create Ledger first
tallyMessageList += `
<TALLYMESSAGE xmlns:UDF="TallyUDF">
  <LEDGER ACTION="Create">
    <NAME>Interest on Loan</NAME>
    <PARENT>Indirect Expenses</PARENT>
  </LEDGER>
</TALLYMESSAGE>
`;

months.forEach((dateStr, i) => {
    let interest = balance * rate;
    interest = Math.round(interest * 100) / 100;
    
    tallyMessageList += `
    <TALLYMESSAGE xmlns:UDF="TallyUDF">
      <VOUCHER VCHTYPE="Journal" ACTION="Create" OBJVIEW="Accounting Voucher View">
        <DATE>${dateStr}</DATE>
        <NARRATION>Being interest charged on NWB BUSINESS LOAN @ 6.5%</NARRATION>
        <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Interest on Loan</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${interest}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>NWB BUSINESS LOAN</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${interest}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
      </VOUCHER>
    </TALLYMESSAGE>
    `;
    
    let principalPaid = emi - interest;
    balance -= principalPaid;
});

const xml = `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>WILMER HOUSE LTD</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        ${tallyMessageList}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
`;

const req = http.request('http://localhost:9000', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml', 'Content-Length': Buffer.byteLength(xml) }
}, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => console.log('Response:', d));
});
req.on('error', console.error); req.write(xml); req.end();
