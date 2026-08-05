const { sequelize } = require('./src/config/database');
async function run() {
  try {
    const table = 'bare_acts';
    
    // Drop the specific index
    try {
      await sequelize.query(`ALTER TABLE ${table} DROP INDEX bare_acts_abbreviation`);
      console.log(`Dropped index bare_acts_abbreviation from ${table}`);
    } catch (e) {
      console.log('Failed to drop bare_acts_abbreviation', e.message);
    }
    
    // Check if there are other duplicates like bare_acts_abbreviation_2 etc. just in case
    for (let i = 2; i <= 5; i++) {
        try {
            await sequelize.query(`ALTER TABLE ${table} DROP INDEX bare_acts_abbreviation_${i}`);
            console.log(`Dropped index bare_acts_abbreviation_${i} from ${table}`);
        } catch (e) {}
    }
  } catch(e) {
    console.log(e);
  } finally {
    process.exit();
  }
}
run();
