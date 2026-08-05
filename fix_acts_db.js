const { sequelize } = require('./src/config/database');
async function run() {
  try {
    const table = 'bare_acts';
    
    // Drop possible variants of the old abbreviation index
    try {
      await sequelize.query(`ALTER TABLE ${table} DROP INDEX abbreviation`);
      console.log(`Dropped index abbreviation from ${table}`);
    } catch (e) {}
    for (let i = 2; i <= 10; i++) {
        try {
            await sequelize.query(`ALTER TABLE ${table} DROP INDEX abbreviation_${i}`);
            console.log(`Dropped index abbreviation_${i} from ${table}`);
        } catch (e) {}
    }
    
    // Add new composite index
    try {
      await sequelize.query(`ALTER TABLE ${table} ADD UNIQUE INDEX ${table}_tenant_abbreviation_unique (tenant_id, abbreviation)`);
      console.log(`Added composite index to ${table}`);
    } catch (e) {
      console.log(`Failed to add composite index to ${table}:`, e.message);
    }
    
  } catch(e) {
    console.log(e);
  } finally {
    process.exit();
  }
}
run();
