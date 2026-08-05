const { sequelize } = require('./src/config/database');
async function run() {
  try {
    const tables = ['case_types', 'case_stages', 'courts', 'document_categories'];
    for (const table of tables) {
      try {
        await sequelize.query(`ALTER TABLE ${table} DROP INDEX code`);
        console.log(`Dropped index 'code' from ${table}`);
      } catch (e) { }
      try {
        await sequelize.query(`ALTER TABLE ${table} DROP INDEX code_unique`);
        console.log(`Dropped index 'code_unique' from ${table}`);
      } catch (e) {}
      try {
        await sequelize.query(`ALTER TABLE ${table} DROP INDEX ${table}_code_uk`);
        console.log(`Dropped index '${table}_code_uk' from ${table}`);
      } catch (e) {}
      
      try {
        await sequelize.query(`ALTER TABLE ${table} ADD UNIQUE INDEX ${table}_tenant_code_unique (tenant_id, code)`);
        console.log(`Added composite index to ${table}`);
      } catch (e) {
        console.log(`Failed to add composite index to ${table}:`, e.message);
      }
    }
  } catch(e) {
    console.log(e);
  } finally {
    process.exit();
  }
}
run();
