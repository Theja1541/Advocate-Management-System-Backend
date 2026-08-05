const fs = require('fs');
let content = fs.readFileSync('src/features/users/authController.js', 'utf8');

content = content.replace(
  /const \{ User, Role, Advocate \} = require\('\.\.\/associations'\);/,
  'const { User, Role, Advocate, Tenant } = require(\'../associations\');'
);

const tenantInclude = `\nconst tenantInclude = { model: Tenant, as: 'tenant', attributes: ['name', 'logo'] };\n`;
content = content.replace(/const advocateInclude = \{/, tenantInclude + 'const advocateInclude = {');

content = content.replace(/include: \[roleInclude, advocateInclude\],/g, 'include: [roleInclude, advocateInclude, tenantInclude],');

content = content.replace(
  /tenantId: user\.tenantId,/g,
  'tenantId: user.tenantId,\n  tenant: user.tenant ? { name: user.tenant.name, logo: user.tenant.logo } : null,'
);

fs.writeFileSync('src/features/users/authController.js', content);
console.log('Fixed authController.js');
