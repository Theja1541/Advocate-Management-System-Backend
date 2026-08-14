const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const analysis = JSON.parse(fs.readFileSync('./schema_analysis.json', 'utf8'));
    const { cols, fkRows, tableCounts } = analysis;

    // Find all tables with tenant_id column
    const tenantTables = cols.filter(c => c.COLUMN_NAME === 'tenant_id').map(c => c.TABLE_NAME);
    
    // For each table, check how many rows are tenant_id <> 1 or tenant_id IS NULL (or check users without tenant_id)
    const breakdown = {};
    for (const tbl of Object.keys(tableCounts)) {
      const tblCols = cols.filter(c => c.TABLE_NAME === tbl).map(c => c.COLUMN_NAME);
      const hasTenantId = tblCols.includes('tenant_id');
      
      let total = tableCounts[tbl];
      let t1Rows = 0;
      let nonT1Rows = 0;
      let nullTenantRows = 0;

      if (hasTenantId) {
        const [[{ cnt1 }]] = await sequelize.query(`SELECT COUNT(*) as cnt1 FROM \`${tbl}\` WHERE tenant_id = 1`);
        const [[{ cntNon1 }]] = await sequelize.query(`SELECT COUNT(*) as cntNon1 FROM \`${tbl}\` WHERE tenant_id <> 1`);
        const [[{ cntNull }]] = await sequelize.query(`SELECT COUNT(*) as cntNull FROM \`${tbl}\` WHERE tenant_id IS NULL`);
        t1Rows = cnt1;
        nonT1Rows = cntNon1;
        nullTenantRows = cntNull;
      }

      breakdown[tbl] = {
        total,
        hasTenantId,
        t1Rows,
        nonT1Rows,
        nullTenantRows
      };
    }

    fs.writeFileSync('./table_breakdown.json', JSON.stringify(breakdown, null, 2));
    console.log('Breakdown complete');
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
})();
