require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize } = require('../src/config/database');
async function checkDB() {
  let [r] = await sequelize.query('SELECT COUNT(*) AS c FROM cases WHERE suit_value IS NULL;');
  console.log('suit_value null:', r[0].c);
  [r] = await sequelize.query('SELECT COUNT(*) AS c FROM cases WHERE advocate_fee IS NULL;');
  console.log('advocate_fee null:', r[0].c);
  [r] = await sequelize.query('SELECT COUNT(*) AS c FROM cases WHERE total_payable IS NULL;');
  console.log('total_payable null:', r[0].c);
  [r] = await sequelize.query('SELECT COUNT(*) AS c FROM cases WHERE fee_calculation_status IS NULL;');
  console.log('fee_calculation_status null:', r[0].c);
  [r] = await sequelize.query('SELECT COUNT(*) AS c FROM cases WHERE title LIKE "%::%";');
  console.log('title has ::', r[0].c);
  process.exit(0);
}
checkDB();
