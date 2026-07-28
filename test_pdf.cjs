const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\Documents\\Antigravity\\Wilmar\\CC\\14_Oct_2025_-_13_Nov_2025.pdf');

pdf(dataBuffer).then(function(data) {
    console.log(data.text.substring(0, 2000));
});
