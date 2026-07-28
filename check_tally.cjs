const fs = require('fs');

const data = fs.readFileSync('Transactions.csv', 'utf8');
const lines = data.split('\n').filter(l => l.trim() !== '');

let totalIn = 0;
let totalOut = 0;

// Skip header
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  // Depending on commas in fields, this could be tricky, but assuming basic CSV:
  // Date,Details,Transaction Type,In,Out,Balance
  // If there are quoted commas, it's safer to just do a regex.
  // Actually, we can use a quick regex to parse CSV line by line.
  
  const line = lines[i];
  let inQuotes = false;
  let cols = [];
  let current = '';
  for(let char of line) {
      if(char === '"') inQuotes = !inQuotes;
      else if(char === ',' && !inQuotes) { cols.push(current); current = ''; }
      else current += char;
  }
  cols.push(current);

  if (cols.length >= 6) {
    const valIn = parseFloat(cols[3]);
    const valOut = parseFloat(cols[4]);
    
    if (!isNaN(valIn)) totalIn += valIn;
    if (!isNaN(valOut)) totalOut += valOut;
  }
}

console.log(`Total In: ${totalIn.toFixed(2)}`);
console.log(`Total Out: ${totalOut.toFixed(2)}`);
console.log(`Net: ${(totalIn - totalOut).toFixed(2)}`);
console.log(`Total rows processed: ${lines.length - 1}`);
