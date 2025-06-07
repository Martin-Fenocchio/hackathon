const fs = require('fs');
const path = require('path');

// Create templates directory in dist if it doesn't exist
const distTemplatesDir = path.join(__dirname, '../dist/voucher/templates');
if (!fs.existsSync(distTemplatesDir)) {
    fs.mkdirSync(distTemplatesDir, { recursive: true });
}

// Copy template file
const sourceTemplate = path.join(__dirname, '../src/voucher/templates/voucher.hbs');
const destTemplate = path.join(distTemplatesDir, 'voucher.hbs');

fs.copyFileSync(sourceTemplate, destTemplate);
console.log('Template files copied successfully!'); 