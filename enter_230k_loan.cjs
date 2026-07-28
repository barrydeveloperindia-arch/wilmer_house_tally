const http = require('http');

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
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Journal" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>20250731</DATE>
            <NARRATION>Being loan amount 230k received directly by owner for property buy 37 high street</NARRATION>
            <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>property buy 37 highstreet</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-230000</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>NWB BUSINESS LOAN</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>230000</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
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
req.on('error', console.error); 
req.write(xml); 
req.end();
