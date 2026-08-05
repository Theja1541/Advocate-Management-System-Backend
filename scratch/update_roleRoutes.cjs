const fs = require('fs');
let content = fs.readFileSync('src/features/users/roleRoutes.js', 'utf8');

content = content.replace(
  "const { protect, restrictTo } = require('../../middleware/auth');",
  "const { protect, restrictTo } = require('../../middleware/auth');\nconst { tenantImpersonator } = require('../../middleware/tenantImpersonator');"
);

content = content.replace(
  "router.use(protect);",
  "router.use(protect);\n\n// Apply tenant impersonation for Super Admins\nrouter.use(tenantImpersonator);"
);

fs.writeFileSync('src/features/users/roleRoutes.js', content);
console.log('Updated roleRoutes.js');
