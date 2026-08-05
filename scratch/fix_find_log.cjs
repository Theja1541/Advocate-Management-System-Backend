const fs = require('fs');
let content = fs.readFileSync('src/config/database.js', 'utf8');
content = content.replace(
  /options\.where\.tenantId = store\.tenantId;/g,
  "options.where.tenantId = store.tenantId;\n    console.log('Injecting tenantId', store.tenantId, 'into beforeFind for model:', options.model ? options.model.name : 'Unknown');"
);
fs.writeFileSync('src/config/database.js', content);
console.log('Fixed hook for beforeFind logging');
