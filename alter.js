const { sequelize } = require('./src/config/database');
const logger = require('./src/config/logger');

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.query('ALTER TABLE bare_acts ADD COLUMN state VARCHAR(100) NULL AFTER type;');
    console.log('Successfully altered bare_acts table.');
  } catch (err) {
    console.error('Error altering table:', err);
  } finally {
    await sequelize.close();
  }
}
run();
