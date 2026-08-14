const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    // 1. Check all tables with tenant_id column
    const [cols] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'tenant_id'
    `);
    const tablesWithTenantId = cols.map(c => c.TABLE_NAME);
    console.log('Tables with tenant_id column:\n', tablesWithTenantId);

    // 2. Query distinct tenant_id values per table
    const tenantIdCounts = {};
    for (const table of tablesWithTenantId) {
      const [rows] = await sequelize.query(`SELECT tenant_id, COUNT(*) as count FROM \`${table}\` GROUP BY tenant_id`);
      tenantIdCounts[table] = rows;
    }
    console.log('\nTenant ID Distribution per table:\n', JSON.stringify(tenantIdCounts, null, 2));

    // 3. Inspect null-tenant users and roles to determine if they are system/test records
    const [nullUsers] = await sequelize.query(`
      SELECT u.id, u.name, u.email, u.role_id, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.tenant_id IS NULL
    `);
    console.log('\nUsers with NULL tenant_id:\n', nullUsers);

    const [nullRoles] = await sequelize.query(`
      SELECT r.id, r.name, r.description, r.tenant_id, COUNT(u.id) as user_count 
      FROM roles r 
      LEFT JOIN users u ON u.role_id = r.id 
      WHERE r.tenant_id IS NULL 
      GROUP BY r.id
    `);
    console.log('\nRoles with NULL tenant_id:\n', nullRoles);

  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
