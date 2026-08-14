const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const [fkRows] = await sequelize.query(`
      SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    const [cols] = await sequelize.query(`
      SELECT TABLE_NAME, COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
    `);

    // Count rows per table
    const [tables] = await sequelize.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    const tableCounts = {};
    for (const tbl of tableNames) {
      const [[{ cnt }]] = await sequelize.query(`SELECT COUNT(*) as cnt FROM \`${tbl}\``);
      tableCounts[tbl] = cnt;
    }

    // Inspect Super Admin users / roles
    const [users] = await sequelize.query(`SELECT id, username, email, role_id, tenant_id, is_active FROM users`);
    const [roles] = await sequelize.query(`SELECT id, name, tenant_id FROM roles`);

    fs.writeFileSync('schema_analysis.json', JSON.stringify({ fkRows, cols, tableCounts, users, roles }, null, 2));
    console.log('Schema analysis written successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
})();
