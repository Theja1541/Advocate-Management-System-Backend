const fs = require('fs');
let content = fs.readFileSync('scratch/test_isolation.js', 'utf8');
content = content.replace(/email: "admin@alpha" \+ Date\.now\(\) \+ "@test\.com"/g, 'email: "admin_alpha" + Date.now() + "@test.com"');
content = content.replace(/email: "admin@beta" \+ Date\.now\(\) \+ "@test\.com"/g, 'email: "admin_beta" + Date.now() + "@test.com"');
fs.writeFileSync('scratch/test_isolation.js', content);
console.log('Fixed test_isolation email');
