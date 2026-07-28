const http = require('http'); 
const fs = require('fs');

const xml = `<ENVELOPE>
  <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>List of Accounts</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <ACCOUNTTYPE>Groups</ACCOUNTTYPE>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

const req = http.request('http://localhost:9000', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml', 'Content-Length': Buffer.byteLength(xml) }
}, (res) => {
    let chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const text = buffer.toString('utf16le'); // Tally uses UTF-16LE
        fs.writeFileSync('tally_groups_fixed.xml', text, 'utf8');
        console.log("Groups exported and converted to UTF-8 in tally_groups_fixed.xml");
    });
});
req.on('error', console.error);
req.write(xml);
req.end();
