const fs = require('fs');
const path = require('path');
const featuresDir = path.join(__dirname, '../src/features');
function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.js') && file[0] === file[0].toUpperCase()) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('allowNull: true') && content.includes('field: \'tenant_id\'')) {
        content = content.replace(/allowNull: true,(\s*)field: 'tenant_id'/, "allowNull: false,$1field: 'tenant_id'");
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}
processDir(featuresDir);
