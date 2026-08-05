const fs = require('fs');
let content = fs.readFileSync('src/config/database.js', 'utf8');

content = content.replace(
  /sequelize\.addHook\('beforeFind', \(options\) => \{/g,
  "sequelize.addHook('beforeFind', function(options) {\n  const model = this;\n  console.log('beforeFind run for model:', model.name);"
);

content = content.replace(
  /options\.model\.rawAttributes/g,
  "model.rawAttributes"
);

fs.writeFileSync('src/config/database.js', content);
console.log('Fixed beforeFind hook');
