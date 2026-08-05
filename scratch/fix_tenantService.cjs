const fs = require('fs');
let content = fs.readFileSync('src/features/tenants/tenantService.js', 'utf8');
content = content.replace(/settingKey: 'theme',/g, "key: 'theme',");
content = content.replace(/settingValue: 'light'/g, "value: 'light'");
fs.writeFileSync('src/features/tenants/tenantService.js', content);
console.log('Fixed tenantService');
