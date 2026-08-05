const fs = require('fs');
let content = fs.readFileSync('src/features/tenants/tenantService.js', 'utf8');
content = content.replace(/accessLevel: 'VECD'/g, "accessLevel: 'VEA'");
fs.writeFileSync('src/features/tenants/tenantService.js', content);
console.log('Fixed tenantService accessLevel');
