const { sequelize } = require('./src/config/database');
async function run() {
  try {
    const dbName = sequelize.config.database;
    const [indexes] = await sequelize.query(`
      SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = '${dbName}'
        AND NON_UNIQUE = 0
        AND INDEX_NAME != 'PRIMARY'
    `);
    console.log(indexes);
  } catch(e) {
    console.log(e);
  } finally {
    process.exit();
  }
}
run();
