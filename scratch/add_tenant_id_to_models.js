const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, '../src/features');
const skipModels = ['Tenant.js', 'TenantSetting.js', 'SubscriptionPlan.js', 'TenantSubscription.js', 'Module.js', 'Permission.js'];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.js') && file[0] === file[0].toUpperCase() && !skipModels.includes(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('extends Model') && !content.includes('tenant_id')) {
        // match any primary key id block up to the closing brace and comma
        // e.g. id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        // or id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        const idRegex = /(id:\s*\{[\s\S]*?primaryKey:\s*true[\s\S]*?\},)/;
        if (idRegex.test(content)) {
          const replacement = `$1\n    tenantId: {\n      type: DataTypes.INTEGER.UNSIGNED,\n      allowNull: true,\n      field: 'tenant_id',\n    },`;
          content = content.replace(idRegex, replacement);
          fs.writeFileSync(fullPath, content);
          console.log(`Updated ${file}`);
        } else {
          console.log(`Failed to match id regex in ${file}`);
        }
      }
    }
  }
}

processDir(featuresDir);
console.log('Done');
