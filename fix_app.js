const fs = require('fs');

let data = fs.readFileSync('src/app.js', 'utf8');

data = data.replace(
  "const tenantRoutes = require('./features/tenants/tenantRoutes');",
  "const tenantRoutes = require('./features/tenants/tenantRoutes');\nconst subscriptionPlanRoutes = require('./features/tenants/subscriptionPlanRoutes');"
);

data = data.replace(
  "app.use('/api/v1/tenants', tenantRoutes);",
  "app.use('/api/v1/tenants', tenantRoutes);\napp.use('/api/v1/plans', subscriptionPlanRoutes);"
);

fs.writeFileSync('src/app.js', data);
console.log('Fixed app.js');
