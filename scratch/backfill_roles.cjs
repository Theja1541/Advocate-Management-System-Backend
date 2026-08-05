const { sequelize } = require('../src/config/database');
const { Role, Permission, Module, Tenant } = require('../src/features/associations');
const fs = require('fs');

async function run() {
  await sequelize.authenticate();
  
  // Extract the defaultValue from Permission.js programmatically to avoid encoding issues
  const permissionCode = fs.readFileSync('./src/features/users/Permission.js', 'utf8');
  const match = permissionCode.match(/defaultValue: '(.*?)'/);
  const noneAccessLevel = match ? match[1] : '---';
  
  const tenants = await Tenant.findAll({ bypassTenant: true });
  const modules = await Module.findAll({ bypassTenant: true });
  for (const t of tenants) {
    const existingRoles = await Role.findAll({ where: { tenantId: t.id }, bypassTenant: true });
    const roleNames = existingRoles.map(r => r.name);
    const missing = [];
    if (!roleNames.includes('Sub Admin')) missing.push({ name: 'Sub Admin', description: 'Limited administrative access', tenantId: t.id });
    if (!roleNames.includes('Advocate')) missing.push({ name: 'Advocate', description: 'Standard advocate access', tenantId: t.id });
    if (!roleNames.includes('Staff/Bearer')) missing.push({ name: 'Staff/Bearer', description: 'Basic staff access', tenantId: t.id });
    
    if (missing.length > 0) {
      const created = await Role.bulkCreate(missing, { bypassTenant: true });
      const perms = [];
      created.forEach(r => {
        modules.forEach(m => {
          perms.push({ roleId: r.id, moduleId: m.id, accessLevel: noneAccessLevel, tenantId: t.id });
        });
      });
      await Permission.bulkCreate(perms, { bypassTenant: true });
      console.log(`Backfilled roles for tenant ${t.id}`);
    }
  }
}

run();
