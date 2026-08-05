const fs = require('fs');

let content = fs.readFileSync('src/app.js', 'utf8');
const importStr = "const tenantRoutes = require('./features/tenants/tenantRoutes');";

if (!content.includes(importStr)) {
  content = content.replace(/const userRoutes = require\('\.\/features\/users\/userRoutes'\);/, "const userRoutes = require('./features/users/userRoutes');\n" + importStr);
  content = content.replace(/app\.use\('\/api\/v1\/users', userRoutes\);/, "app.use('/api/v1/users', userRoutes);\napp.use('/api/v1/tenants', tenantRoutes);");
  fs.writeFileSync('src/app.js', content);
  console.log('Added tenantRoutes');
}
