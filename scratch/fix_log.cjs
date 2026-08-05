const fs = require('fs');
let content = fs.readFileSync('src/config/database.js', 'utf8');
content = content.replace(
  /instance\.tenantId = store\.tenantId;/g,
  "console.log('Hook check -> store:', store, 'attributes:', Object.keys(instance.rawAttributes));\n    instance.tenantId = store.tenantId;"
);
fs.writeFileSync('src/config/database.js', content);
console.log('Added log');
