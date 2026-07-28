const fs = require('fs');
const PDFParser = require('pdf2json');

let pdfParser = new PDFParser();
pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    let page = pdfData.Pages[1]; // Page 2 has the transactions
    let lines = {};
    page.Texts.forEach(t => {
        const y = Math.round(t.y * 10) / 10;
        if (!lines[y]) lines[y] = [];
        lines[y].push({ x: t.x, text: decodeURIComponent(t.R[0].T) });
    });
    
    const yKeys = Object.keys(lines).map(Number).sort((a, b) => a - b);
    yKeys.forEach(y => {
        lines[y].sort((a, b) => a.x - b.x);
        console.log(`[Y=${y}] ${lines[y].map(t => t.text).join(' ')}`);
    });
});

pdfParser.loadPDF('C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\Documents\\Antigravity\\Wilmar\\CC\\14_Oct_2025_-_13_Nov_2025.pdf');
