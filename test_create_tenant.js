const { createTenant } = require('./src/features/tenants/tenantService');
const SubscriptionPlan = require('./src/features/tenants/SubscriptionPlan');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const testTenantData = {
      name: 'Test Law Firm 2',
      code: 'TESTFIRM2',
      email: 'test2@lawfirm.com',
      planId: 1
    };
    const testAdminData = {
      name: 'Test Firm Admin 2',
      email: 'admin2@testfirm.com',
      password: 'password123'
    };

    const newTenant = await createTenant(testTenantData, testAdminData);
    console.log('Successfully created tenant:', newTenant.id, newTenant.name);

    // Clean up test tenant
    const tId = newTenant.id;
    await sequelize.query(`DELETE FROM users WHERE tenant_id = ${tId}`);
    await sequelize.query(`DELETE FROM permissions WHERE role_id IN (SELECT id FROM roles WHERE tenant_id = ${tId})`);
    await sequelize.query(`DELETE FROM roles WHERE tenant_id = ${tId}`);
    await sequelize.query(`DELETE FROM tenant_settings WHERE tenant_id = ${tId}`);
    await sequelize.query(`DELETE FROM tenant_subscriptions WHERE tenant_id = ${tId}`);
    await sequelize.query(`DELETE FROM tenants WHERE id = ${tId}`);
    console.log('Cleaned up test tenant.');

  } catch(e) {
    console.error('Error during test:', e);
  } finally {
    await sequelize.close();
  }
})();
