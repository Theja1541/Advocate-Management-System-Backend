const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const [fkRows] = await sequelize.query(`
      SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    // Build adjacency list of dependencies
    // REFERENCED_TABLE_NAME -> TABLE_NAME (Child depends on Parent)
    console.log('=== FOREIGN KEYS LIST ===');
    fkRows.forEach(fk => {
      console.log(`${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
