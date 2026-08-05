const fs = require('fs');
let content = fs.readFileSync('src/config/database.js', 'utf8');

// Add beforeValidate hook
const beforeValidateHook = `
sequelize.addHook('beforeValidate', (instance, options) => {
  if (options.bypassTenant) return;
  const store = tenantContext.getStore();
  if (store && store.tenantId && instance.rawAttributes.tenantId) {
    instance.tenantId = store.tenantId;
  }
});
`;

content = content.replace(/sequelize\.addHook\('beforeCreate'/g, beforeValidateHook + "\nsequelize.addHook('beforeCreate'");

fs.writeFileSync('src/config/database.js', content);
console.log('Added beforeValidate hook');
