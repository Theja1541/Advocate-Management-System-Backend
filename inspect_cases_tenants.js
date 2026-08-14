const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const [c14_20] = await sequelize.query(`
      SELECT c.id, c.title, c.tenant_id, c.client_id, cl.tenant_id as client_tenant_id, 
             c.advocate_id, c.case_type_id, c.case_stage_id, c.court_id 
      FROM cases c
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE c.id IN (14,15,16,17,18,19,20)
    `);
    console.log('Cases 14-20 details:', c14_20);

    const [tenants] = await sequelize.query(`SELECT id, name, code FROM tenants`);
    console.log('All tenants in DB:', tenants);

  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
