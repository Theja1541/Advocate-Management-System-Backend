const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const [roles] = await sequelize.query(`
      SELECT r.id as role_id, r.name as role_name, r.tenant_id as role_tenant_id,
             u.id as user_id, u.name as user_name, u.email as user_email, u.tenant_id as user_tenant_id
      FROM roles r
      LEFT JOIN users u ON u.role_id = r.id
    `);
    console.log('Roles and Users mapping:\n', JSON.stringify(roles, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
