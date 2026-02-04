const fs = require('fs');
const path = require('path');

// 1x1 PNG (Blue pixel)
// You should verify if this is valid.
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwL5r3elOAAAAABJRU5ErkJggg==';
const buffer = Buffer.from(pngBase64, 'base64');

console.log('Writing temporary valid PNG icons...');
fs.writeFileSync(path.join(__dirname, 'assets', 'icon.png'), buffer);
fs.writeFileSync(path.join(__dirname, 'assets', 'adaptive-icon.png'), buffer);
console.log('Done.');
