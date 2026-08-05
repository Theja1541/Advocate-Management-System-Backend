const fs = require('fs');
let content = fs.readFileSync('src/features/tenants/tenantService.js', 'utf8');

const oldStr = `    // 5. Assign all modules to Tenant Admin role with full access
    const modules = await Module.findAll({ transaction, bypassTenant: true });
    const perms = modules.map(m => ({
      roleId: adminRole.id,
      moduleId: m.id,
      accessLevel: 'VEA', // View, Edit, Create, Delete
      tenantId: tenant.id
    }));
    await Permission.bulkCreate(perms, { transaction, bypassTenant: true });`;

const newStr = `    // 5. Create other default roles
    const defaultRoles = [
      { name: 'Sub Admin', description: 'Limited administrative access', tenantId: tenant.id },
      { name: 'Advocate', description: 'Standard advocate access', tenantId: tenant.id },
      { name: 'Staff/Bearer', description: 'Basic staff access', tenantId: tenant.id }
    ];
    const createdDefaultRoles = await Role.bulkCreate(defaultRoles, { transaction, bypassTenant: true });

    // 6. Assign modules to roles
    const modules = await Module.findAll({ transaction, bypassTenant: true });
    const allRoleIds = [adminRole.id, ...createdDefaultRoles.map(r => r.id)];
    const perms = [];
    allRoleIds.forEach(roleId => {
      modules.forEach(m => {
        perms.push({
          roleId: roleId,
          moduleId: m.id,
          accessLevel: roleId === adminRole.id ? 'VEA' : '---',
          tenantId: tenant.id
        });
      });
    });
    await Permission.bulkCreate(perms, { transaction, bypassTenant: true });`;

if (content.includes(oldStr)) {
  content = content.replace(oldStr, newStr);
  content = content.replace('// 6. Create Admin User', '// 7. Create Admin User');
  fs.writeFileSync('src/features/tenants/tenantService.js', content);
  console.log('Updated tenantService.js');
} else {
  console.log('Could not find oldStr in tenantService.js');
}
