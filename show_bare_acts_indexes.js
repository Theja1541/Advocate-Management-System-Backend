const { sequelize } = require('./src/config/database');
async function run() {
  try {
    const [results] = await sequelize.query(`SHOW INDEX FROM bare_acts`);
    console.log(results);
  } catch(e) {
    console.log(e);
  } finally {
    process.exit();
  }
}
run();
