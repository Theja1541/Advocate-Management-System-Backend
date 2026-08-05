const fs = require('fs');
let content = fs.readFileSync('src/config/database.js', 'utf8');

const hookLogic = `sequelize.addHook('beforeCount', function(options) {
  const model = this;
  if (options.bypassTenant) return;
  const store = tenantContext.getStore();
  if (store && store.tenantId && model.rawAttributes.tenantId) {
    options.where = options.where || {};
    options.where.tenantId = store.tenantId;
  }
});

sequelize.addHook('beforeFind', function(options) {`;

content = content.replace("sequelize.addHook('beforeFind', function(options) {", hookLogic);
fs.writeFileSync('src/config/database.js', content);
console.log('Added beforeCount hook');
