const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    // 1. Inspect users table schema (specifically tenant_id column nullability)
    const [userCols] = await sequelize.query(`
      SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE, COLUMN_DEFAULT, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    `);
    console.log('=== USERS TABLE COLUMNS ===\n', userCols);

    // 2. Inspect users table foreign keys
    const [userFKs] = await sequelize.query(`
      SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.log('=== USERS TABLE FOREIGN KEYS ===\n', userFKs);

    // 3. Inspect Super Admin user record (id=1)
    const [superAdminUser] = await sequelize.query(`SELECT * FROM users WHERE id = 1`);
    console.log('=== SUPER ADMIN USER RECORD (id=1) ===\n', superAdminUser);

    // 4. Inspect Super Admin role record (id=1) and its tenant_id
    const [superAdminRole] = await sequelize.query(`SELECT * FROM roles WHERE id = 1`);
    console.log('=== SUPER ADMIN ROLE RECORD (id=1) ===\n', superAdminRole);

    // 5. Inspect roles table schema (tenant_id nullability)
    const [roleCols] = await sequelize.query(`
      SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE, COLUMN_DEFAULT, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles'
    `);
    console.log('=== ROLES TABLE COLUMNS ===\n', roleCols);

    // 6. Inspect permissions for Super Admin role (role_id = 1)
    const [superAdminPerms] = await sequelize.query(`SELECT COUNT(*) as cnt FROM permissions WHERE role_id = 1`);
    console.log('=== SUPER ADMIN PERMISSIONS COUNT (role_id=1) ===\n', superAdminPerms[0].cnt);

  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
