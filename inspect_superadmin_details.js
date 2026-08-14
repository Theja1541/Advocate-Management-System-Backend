const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const [superAdminUser] = await sequelize.query(`SELECT * FROM users WHERE id = 1`);
    const [superAdminRole] = await sequelize.query(`SELECT * FROM roles WHERE id = 1`);
    const [superAdminPerms] = await sequelize.query(`SELECT * FROM permissions WHERE role_id = 1`);
    console.log('Super Admin User:', superAdminUser[0]);
    console.log('Super Admin Role:', superAdminRole[0]);
    console.log('Super Admin Permissions Count:', superAdminPerms.length);
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
