const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const [cols] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cases'
    `);
    console.log('=== CASES COLUMNS ===');
    console.log(cols);

    const [cases] = await sequelize.query(`SELECT * FROM cases WHERE id IN (14,15,16,17,18,19,20)`);
    console.log('=== CASES 14-20 FULL DATA ===');
    console.log(JSON.stringify(cases, null, 2));

    const [sampleT1Cases] = await sequelize.query(`SELECT * FROM cases WHERE id NOT IN (14,15,16,17,18,19,20) LIMIT 3`);
    console.log('=== SAMPLE T1 CASES FULL DATA ===');
    console.log(JSON.stringify(sampleT1Cases, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
