const http = require('http');

const TALLY_URL = "http://localhost:9000";

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function sendToTally(xml) {
    return new Promise((resolve, reject) => {
        const req = http.request(TALLY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml',
                'Content-Length': Buffer.byteLength(xml)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.write(xml);
        req.end();
    });
}

async function main() {
    
    // 1. Rename existing generic ledgers to get them out of the way
    const oldLedgersToRename = [
        { old: 'Electricity & Gas Expenses', new: 'ZZZ_OLD_Electricity' },
        { old: 'Water Expenses', new: 'ZZZ_OLD_Water' },
        { old: 'Internet Expenses', new: 'ZZZ_OLD_Internet' },
        { old: 'Rent Paid', new: 'ZZZ_OLD_RentPaid' },
        { old: 'Rental Income', new: 'ZZZ_OLD_RentalIncome' }
    ];

    let renameXml = `
    <ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA>
    <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
    <REQUESTDATA>
    `;
    for (const l of oldLedgersToRename) {
        renameXml += `
            <TALLYMESSAGE>
                <LEDGER ACTION="Alter">
                    <OLDNAME>${escapeXml(l.old)}</OLDNAME>
                    <NAME>${escapeXml(l.new)}</NAME>
                </LEDGER>
            </TALLYMESSAGE>
        `;
    }
    renameXml += `</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;

    console.log("Renaming old ledgers...");
    const renameRes = await sendToTally(renameXml);
    console.log(renameRes.match(/<(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join('\\n') || renameRes.substring(0, 300));

    // 2. Create the new Groups
    const groups = [
        { name: 'Room Sales - OTA', parent: 'Sales Accounts' },
        { name: 'Room Sales - Direct', parent: 'Sales Accounts' },
        { name: 'Electricity & Gas Expenses', parent: 'Indirect Expenses' },
        { name: 'Water Expenses', parent: 'Indirect Expenses' },
        { name: 'Internet & Communications', parent: 'Indirect Expenses' },
        { name: 'Housekeeping & Laundry', parent: 'Indirect Expenses' },
        { name: 'Property Rent Paid', parent: 'Indirect Expenses' },
        { name: 'Repairs & Maintenance', parent: 'Indirect Expenses' },
        { name: 'Council Tax', parent: 'Indirect Expenses' },
        { name: 'Insurance', parent: 'Indirect Expenses' },
        { name: 'Management Fees', parent: 'Indirect Expenses' }
    ];

    let groupsXml = `
    <ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA>
    <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
    <REQUESTDATA>
    `;
    for (const g of groups) {
        groupsXml += `
            <TALLYMESSAGE>
                <GROUP ACTION="Create">
                    <NAME>${escapeXml(g.name)}</NAME>
                    <PARENT>${escapeXml(g.parent)}</PARENT>
                </GROUP>
            </TALLYMESSAGE>
        `;
    }
    groupsXml += `</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;

    console.log("\nCreating new Groups...");
    const groupsRes = await sendToTally(groupsXml);
    console.log(groupsRes.match(/<(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join('\\n') || groupsRes.substring(0, 300));


    // 3. Create the specific Vendor Ledgers under those groups
    const ledgers = [
        { name: 'Booking.com Income', parent: 'Room Sales - OTA' },
        { name: 'Airbnb Income', parent: 'Room Sales - OTA' },
        { name: 'Direct Guest Rent', parent: 'Room Sales - Direct' },
        { name: 'Tenant Rent Income', parent: 'Room Sales - Direct' },
        { name: 'Octopus Energy', parent: 'Electricity & Gas Expenses' },
        { name: 'E.ON Next', parent: 'Electricity & Gas Expenses' },
        { name: 'Southern Water', parent: 'Water Expenses' },
        { name: 'EE Ltd', parent: 'Internet & Communications' },
        { name: 'TOOB', parent: 'Internet & Communications' },
        { name: 'Virgin Media', parent: 'Internet & Communications' },
        { name: 'Stalbridge Laundry', parent: 'Housekeeping & Laundry' },
        { name: 'Cleaning Supplies', parent: 'Housekeeping & Laundry' },
        { name: 'Rent Paid to Landlords', parent: 'Property Rent Paid' }
    ];

    let ledgersXml = `
    <ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA>
    <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
    <REQUESTDATA>
    `;
    for (const l of ledgers) {
        ledgersXml += `
            <TALLYMESSAGE>
                <LEDGER ACTION="Create">
                    <NAME>${escapeXml(l.name)}</NAME>
                    <PARENT>${escapeXml(l.parent)}</PARENT>
                    <ISCOSTCENTRESON>Yes</ISCOSTCENTRESON>
                </LEDGER>
            </TALLYMESSAGE>
        `;
    }
    ledgersXml += `</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;

    console.log("\nCreating new Vendor Ledgers...");
    const ledgersRes = await sendToTally(ledgersXml);
    console.log(ledgersRes.match(/<(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>[^<]+<\/(CREATED|ALTERED|ERRORS|EXCEPTIONS|LINEERROR)>/g)?.join('\\n') || ledgersRes.substring(0, 300));
}

main().catch(console.error);
