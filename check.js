const { sequelize } = require('./src/config/database');
async function run() {
  try {
    const [tenants] = await sequelize.query(`SELECT * FROM tenants`);
    console.log(tenants);
    const [users] = await sequelize.query(`SELECT id, name, role_id, tenant_id FROM users LIMIT 10`);
    console.log(users);
  } catch(e) {
    console.log(e);
  } finally {
    process.exit();
  }
}
run();
