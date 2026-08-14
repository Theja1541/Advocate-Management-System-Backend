const fs = require('fs');
const path = require('path');
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

    // Inspect users & roles & tenants table structure and data
    const [users] = await sequelize.query(`SELECT * FROM users`);
    const [roles] = await sequelize.query(`SELECT * FROM roles`);
    const [tenants] = await sequelize.query(`SELECT * FROM tenants`);

    const outPath = path.join(__dirname, 'schema_analysis.json');
    fs.writeFileSync(outPath, JSON.stringify({ fkRows, cols, tableCounts, users, roles, tenants }, null, 2));
    console.log('Schema analysis written successfully to ' + outPath);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
})();
