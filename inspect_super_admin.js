const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const [superAdminUser] = await sequelize.query(`
      SELECT u.id, u.name, u.email, u.role_id, u.tenant_id, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name = 'Super Admin' OR u.id = 1
    `);
    console.log('Super Admin User:', superAdminUser);
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
