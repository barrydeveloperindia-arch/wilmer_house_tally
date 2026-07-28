const fs = require('fs');

const data = fs.readFileSync('tally_groups.xml', 'utf8'); // Read as UTF-8!
const groups = [];

const regex = /<GROUP NAME="([^"]+)"[^>]*>[\s\S]*?<PARENT>([^<]*)<\/PARENT>/g;
let match;
while ((match = regex.exec(data)) !== null) {
    groups.push({ name: match[1], parent: match[2] });
}

const topLevel = groups.filter(g => g.parent.trim() === '');
console.log("Top Level Groups (Blank Parent):");
console.dir(topLevel);

console.log("\nSpecific Groups:");
console.log("Indirect Exp:", groups.find(g => g.name.toLowerCase().includes('indirect exp')));
console.log("Bank OCC:", groups.find(g => g.name.toLowerCase().includes('bank occ')));
console.log("Bank OD:", groups.find(g => g.name.toLowerCase().includes('bank od')));
console.log("Bank Ac:", groups.find(g => g.name.toLowerCase().includes('bank ac')));

fs.writeFileSync('groups_summary.json', JSON.stringify(groups, null, 2));
