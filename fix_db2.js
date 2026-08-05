const { sequelize } = require('./src/config/database');
async function run() {
  try {
    const tables = ['case_types', 'case_stages', 'courts', 'document_categories'];
    for (const table of tables) {
      for (let i = 2; i <= 10; i++) {
        try {
          await sequelize.query(`ALTER TABLE ${table} DROP INDEX code_${i}`);
          console.log(`Dropped index code_${i} from ${table}`);
        } catch (e) {}
      }
    }
  } catch(e) {
    console.log(e);
  } finally {
    process.exit();
  }
}
run();
