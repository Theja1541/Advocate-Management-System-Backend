const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const [tables] = await sequelize.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    const counts = {};
    for (const tbl of tableNames) {
      const [[{ cnt }]] = await sequelize.query(`SELECT COUNT(*) as cnt FROM \`${tbl}\``);
      counts[tbl] = cnt;
    }

    const [cols] = await sequelize.query(`
      SELECT TABLE_NAME, COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'tenant_id'
    `);
    const tenantTables = cols.map(c => c.TABLE_NAME);

    console.log('=== CURRENT ALL TABLES ROW COUNTS ===');
    console.log(JSON.stringify(counts, null, 2));

    console.log('\n=== TABLES CONTAINING tenant_id COLUMN ===');
    console.log(tenantTables);

    // Breakdown per tenant
    const tenantBreakdown = {};
    for (const tbl of tenantTables) {
      const [rows] = await sequelize.query(`SELECT tenant_id, COUNT(*) as count FROM \`${tbl}\` GROUP BY tenant_id`);
      tenantBreakdown[tbl] = rows;
    }
    console.log('\n=== TENANT BREAKDOWN FOR TENANT TABLES ===');
    console.log(JSON.stringify(tenantBreakdown, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
