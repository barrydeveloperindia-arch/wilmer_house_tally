const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

const ccDir = path.join(__dirname, 'CC');
const files = fs.readdirSync(ccDir).filter(f => f.endsWith('.pdf'));

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
                            // Update average Y
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
                        
                        // Look for a date at the start (e.g., Nov 10 Nov 10 or 10 Nov 10 Nov)
                        // This regex looks for basic date patterns
                        if (/^[A-Za-z]{3}\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{1,2}/.test(lineText) || /^\d{1,2}\s+[A-Za-z]{3}\s+\d{1,2}\s+[A-Za-z]{3}/.test(lineText) || /^[A-Za-z]{3}\s+\d{1,2}\s+/.test(lineText)) {
                            
                            // Check if line ends with an amount
                            const hasAmount = /[\d,]+\.\d{2}(\s*CR)?$/.test(lineText);
                            
                            if (hasAmount) {
                                // Extract the amount and the CR
                                let isCredit = /CR$/.test(lineText);
                                let strToParse = lineText.replace(/\s*CR$/, '');
                                
                                const amountMatch = strToParse.match(/([\d,]+\.\d{2})$/);
                                let amount = 0;
                                let description = lineText;
                                
                                if (amountMatch) {
                                    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
                                    if (isCredit) amount = -amount;
                                    description = strToParse.replace(amountMatch[1], '').trim();
                                    
                                    // Remove the dates from the description to clean it up
                                    description = description.replace(/^[A-Za-z]{3}\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{1,2}\s+/, '');
                                    description = description.replace(/^\d{1,2}\s+[A-Za-z]{3}\s+\d{1,2}\s+[A-Za-z]{3}\s+/, '');
                                    description = description.replace(/^[A-Za-z]{3}\s+\d{1,2}\s+/, '');
                                    
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
    console.log(`Processing ${files.length} files...`);
    for (const file of files) {
        const filePath = path.join(ccDir, file);
        try {
            const trans = await parsePdf(filePath);
            allTransactions = allTransactions.concat(trans);
            console.log(`Extracted ${trans.length} transactions from ${file}`);
        } catch (e) {
            console.error(`Error parsing ${file}:`, e);
        }
    }
    
    // Write to CSV
    let csvStr = "File,Description,Amount\n";
    allTransactions.forEach(t => {
        // Escape quotes
        let desc = (t.description || '').replace(/"/g, '""');
        csvStr += `"${t.file}","${desc}",${t.amount !== null ? t.amount : ''}\n`;
    });
    
    fs.writeFileSync('Extracted_CC_Transactions.csv', csvStr);
    console.log(`Successfully wrote ${allTransactions.length} transactions to Extracted_CC_Transactions.csv`);
}

main();
