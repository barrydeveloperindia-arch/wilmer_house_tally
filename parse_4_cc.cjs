const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

const ccDir = path.join(__dirname, 'CC');
const targetFiles = [
    '14_Jan_2025_-_13_Feb_2025.pdf',
    '14_Feb_2025_-_13_Mar_2025.pdf',
    '14_Mar_2025_-_13_Apr_2025.pdf',
    '14_Apr_2025_-_13_May_2025.pdf'
];

let allTransactions = [];

function parsePdf(filePath) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();
        pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", pdfData => {
            const pages = pdfData.Pages;
            let transactions = [];
            
            pages.forEach(page => {
                const texts = page.Texts.map(t => ({
                    y: t.y,
                    x: t.x,
                    text: decodeURIComponent(t.R[0].T)
                })).sort((a, b) => a.y - b.y);
                
                // Fuzzy group by Y
                let lines = [];
                let currentLine = null;
                
                texts.forEach(t => {
                    if (!currentLine) {
                        currentLine = { y: t.y, items: [t] };
                        lines.push(currentLine);
                    } else {
                        if (Math.abs(t.y - currentLine.y) < 0.6) {
                            currentLine.items.push(t);
                            currentLine.y = currentLine.items.reduce((sum, item) => sum + item.y, 0) / currentLine.items.length;
                        } else {
                            currentLine = { y: t.y, items: [t] };
                            lines.push(currentLine);
                        }
                    }
                });
                
                let isTransactionSection = false;
                let lastTransaction = null;
                
                lines.forEach(line => {
                    line.items.sort((a, b) => a.x - b.x);
                    const lineText = line.items.map(t => t.text).join(' ').trim();
                    
                    if (lineText.includes('Transaction Details') && lineText.includes('Amount')) {
                        isTransactionSection = true;
                        return;
                    }
                    if (lineText.includes('Total new spend transactions') || lineText.includes('Statement Period')) {
                        isTransactionSection = false;
                    }
                    
                    if (isTransactionSection) {
                        if (lineText === 'CR' && lastTransaction) {
                            lastTransaction.amount = -Math.abs(lastTransaction.amount); // Make sure it's negative
                            lastTransaction.originalLine += ' CR';
                            return;
                        }
                        
                        if (/^[A-Za-z]{3}\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{1,2}/.test(lineText) || /^\d{1,2}\s+[A-Za-z]{3}\s+\d{1,2}\s+[A-Za-z]{3}/.test(lineText) || /^[A-Za-z]{3}\s+\d{1,2}\s+/.test(lineText)) {
                            
                            const hasAmount = /[\d,]+\.\d{2}(\s*CR)?$/.test(lineText);
                            
                            if (hasAmount) {
                                let isCredit = /CR$/.test(lineText);
                                let strToParse = lineText.replace(/\s*CR$/, '');
                                
                                const amountMatch = strToParse.match(/([\d,]+\.\d{2})$/);
                                let amount = 0;
                                let description = lineText;
                                
                                if (amountMatch) {
                                    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
                                    if (isCredit) amount = -amount;
                                    description = strToParse.replace(amountMatch[1], '').trim();
                                    
                                    description = description.replace(/^[A-Za-z]{3}\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{1,2}\s+/, '');
                                    description = description.replace(/^\d{1,2}\s+[A-Za-z]{3}\s+\d{1,2}\s+[A-Za-z]{3}\s+/, '');
                                    description = description.replace(/^[A-Za-z]{3}\s+\d{1,2}\s+/, '');
                                    
                                    // Also strip the foreign currency amounts sometimes at the end
                                    description = description.replace(/\s*[A-Z]{3}\s+[\d,]+\.\d{2}$/, '');
                                    
                                    lastTransaction = {
                                        originalLine: lineText,
                                        description: description,
                                        amount: amount,
                                        file: path.basename(filePath)
                                    };
                                    transactions.push(lastTransaction);
                                }
                            }
                        }
                    }
                });
            });
            resolve(transactions);
        });
        pdfParser.loadPDF(filePath);
    });
}

async function main() {
    console.log(`Processing ${targetFiles.length} files...`);
    for (const file of targetFiles) {
        const filePath = path.join(ccDir, file);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }
        try {
            const trans = await parsePdf(filePath);
            allTransactions = allTransactions.concat(trans);
            console.log(`Extracted ${trans.length} transactions from ${file}`);
        } catch (e) {
            console.error(`Error parsing ${file}:`, e);
        }
    }
    
    // Group by description
    let merchants = new Map();
    allTransactions.forEach(t => {
        let desc = t.description.trim();
        // Clean up common merchant names to avoid duplicates with different store IDs
        if (desc.includes('TESCO STORE') || desc.includes('TESCO STORES') || desc.includes('TESCO PFS')) desc = 'TESCO';
        if (desc.includes('MCDONALDS')) desc = 'MCDONALDS';
        if (desc.includes('AMAZON') || desc.includes('AMZN')) desc = 'AMAZON';
        if (desc.includes('POUNDLAND')) desc = 'POUNDLAND';
        if (desc.includes('TOOLSTATION')) desc = 'TOOLSTATION';
        if (desc.includes('PAYMENT RECEIVED')) desc = 'PAYMENT RECEIVED - THANK YOU';
        
        if (!merchants.has(desc)) {
            merchants.set(desc, { amount: 0, count: 0 });
        }
        let m = merchants.get(desc);
        m.amount += t.amount;
        m.count++;
    });
    
    const sorted = [...merchants.entries()].sort((a, b) => b[1].count - a[1].count);
    console.log('\n--- Unique Merchants Summary ---');
    sorted.forEach(([desc, stat]) => {
        console.log(`${desc.padEnd(40)} | Count: ${stat.count.toString().padStart(3)} | Total: £${stat.amount.toFixed(2)}`);
    });
    
    // Write CSV
    let csvStr = "File,Description,CleanMerchant,Amount\n";
    allTransactions.forEach(t => {
        let cleanDesc = t.description.trim();
        if (cleanDesc.includes('TESCO STORE') || cleanDesc.includes('TESCO STORES') || cleanDesc.includes('TESCO PFS')) cleanDesc = 'TESCO';
        if (cleanDesc.includes('MCDONALDS')) cleanDesc = 'MCDONALDS';
        if (cleanDesc.includes('AMAZON') || cleanDesc.includes('AMZN')) cleanDesc = 'AMAZON';
        if (cleanDesc.includes('POUNDLAND')) cleanDesc = 'POUNDLAND';
        if (cleanDesc.includes('TOOLSTATION')) cleanDesc = 'TOOLSTATION';
        if (cleanDesc.includes('PAYMENT RECEIVED')) cleanDesc = 'PAYMENT RECEIVED - THANK YOU';
        
        csvStr += `"${t.file}","${t.description.replace(/"/g, '""')}","${cleanDesc.replace(/"/g, '""')}",${t.amount !== null ? t.amount : ''}\n`;
    });
    
    fs.writeFileSync('Extracted_CC_Jan_May_2025.csv', csvStr);
    console.log(`\nSuccessfully wrote ${allTransactions.length} transactions to Extracted_CC_Jan_May_2025.csv`);
}

main();
