const fs = require('fs');
let content = fs.readFileSync('src/features/tenants/tenantService.js', 'utf8');
content = content.replace(/name: 'Tenant Admin',/g, "name: `Tenant Admin ${tenant.id}`,");
fs.writeFileSync('src/features/tenants/tenantService.js', content);
console.log('Fixed Role name to bypass unique constraint');
