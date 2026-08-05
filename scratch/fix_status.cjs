const fs = require('fs');
let content = fs.readFileSync('scratch/test_isolation.js', 'utf8');
content = content.replace(/status: 'open'/g, 'status: "Active"');
content = content.replace(/caseNo: 'CA-001'/g, 'caseNo: "CA-001" + Date.now()');
fs.writeFileSync('scratch/test_isolation.js', content);
console.log('Fixed test_isolation');
