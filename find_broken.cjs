const fs = require('fs');

const data = fs.readFileSync('tally_groups_fixed.xml', 'utf8');

// Find the exact text block for Bank OCC A/c
const idx = data.indexOf('Bank OCC');
if (idx !== -1) {
    const start = data.lastIndexOf('<GROUP', idx);
    const end = data.indexOf('</GROUP>', idx);
    console.log("Found Bank OCC Group XML block:");
    console.log(data.substring(start, end + 8));
} else {
    console.log("Bank OCC A/c NOT found anywhere in XML!");
}

const idx2 = data.indexOf('Credit Card');
if (idx2 !== -1) {
    console.log("Found Credit Card!");
}
