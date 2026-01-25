const pdf = require('pdf-parse');
console.log('Type of pdf:', typeof pdf);
console.log('Is function?', typeof pdf === 'function');

try {
    const fs = require('fs');
    // Create dummy PDF buffer
    const buffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    
    pdf(buffer).then(data => {
        console.log('PDF Text:', data.text);
    }).catch(err => {
        console.error('PDF Error:', err);
    });
} catch (e) {
    console.error('Test Error:', e);
}
