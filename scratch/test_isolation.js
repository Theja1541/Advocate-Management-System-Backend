const { connectDB, sequelize } = require('../src/config/database');
const tenantService = require('../src/features/tenants/tenantService');
const { User, Tenant, Case } = require('../src/features/associations');

async function testIsolation() {
  await connectDB();
  try {
    console.log('Creating Tenant A...');
    const tenantA = await tenantService.createTenant(
      { name: 'Alpha Law', code: "ALP" + Date.now(), email: "admin_alpha" + Date.now() + "@test.com", maxUsers: 10 },
      { name: 'Alpha Admin', email: "admin_alpha" + Date.now() + "@test.com", password: 'password123' }
    );
    
    console.log('Creating Tenant B...');
    const tenantB = await tenantService.createTenant(
      { name: 'Beta Legal', code: "BET" + Date.now(), email: "admin_beta" + Date.now() + "@test.com", maxUsers: 10 },
      { name: 'Beta Admin', email: "admin_beta" + Date.now() + "@test.com", password: 'password123' }
    );

    console.log(`Created: Tenant A (${tenantA.id}), Tenant B (${tenantB.id})`);
    
    const adminA = await User.findOne({ where: { tenantId: tenantA.id }, bypassTenant: true });
    const adminB = await User.findOne({ where: { tenantId: tenantB.id }, bypassTenant: true });

    console.log(`Created Users: Admin A (${adminA.id}), Admin B (${adminB.id})`);
    
    // Simulate Context for Tenant A
    const { tenantContext } = require('../src/config/database');
    await tenantContext.run({ tenantId: tenantA.id }, async () => {
      console.log('--- Inside Tenant A Context ---');
      await Case.create({
        caseNo: "CA-001" + Date.now(),
        title: 'Alpha Case',
        clientId: 1, // Doesn't exist but for testing
        status: "Active"
      });
      const casesA = await Case.findAll();
      console.log(`Cases visible to A: ${casesA.length}`);
    });

    // Simulate Context for Tenant B
    await tenantContext.run({ tenantId: tenantB.id }, async () => {
      console.log('--- Inside Tenant B Context ---');
      const casesB = await Case.findAll();
      console.log(`Cases visible to B: ${casesB.length} (should be 0)`);
    });

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testIsolation();
