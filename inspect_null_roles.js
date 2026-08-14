const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const [perms8] = await sequelize.query(`SELECT COUNT(*) as cnt FROM permissions WHERE role_id = 8`);
    const [perms50] = await sequelize.query(`SELECT COUNT(*) as cnt FROM permissions WHERE role_id = 50`);
    const [perms51] = await sequelize.query(`SELECT COUNT(*) as cnt FROM permissions WHERE role_id = 51`);
    const [perms52] = await sequelize.query(`SELECT COUNT(*) as cnt FROM permissions WHERE role_id = 52`);
    console.log({ perms8, perms50, perms51, perms52 });
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
