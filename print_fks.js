const fs = require('fs');
const path = require('path');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const analysis = JSON.parse(fs.readFileSync('./schema_analysis.json', 'utf8'));
    const { fkRows } = analysis;

    console.log('=== FOREIGN KEY RELATIONSHIPS IN DATABASE ===');
    fkRows.forEach(fk => {
      console.log(`${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME} (${fk.CONSTRAINT_NAME})`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
