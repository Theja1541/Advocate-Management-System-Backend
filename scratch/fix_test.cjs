const fs = require('fs');
let content = fs.readFileSync('scratch/test_isolation.js', 'utf8');
content = content.replace(/code: 'ALP'/g, 'code: "ALP" + Date.now()');
content = content.replace(/code: 'BET'/g, 'code: "BET" + Date.now()');
content = content.replace(/email: 'admin@alpha.com'/g, 'email: "admin@alpha" + Date.now() + "@test.com"');
content = content.replace(/email: 'admin@beta.com'/g, 'email: "admin@beta" + Date.now() + "@test.com"');
fs.writeFileSync('scratch/test_isolation.js', content);
console.log('Fixed test_isolation');
