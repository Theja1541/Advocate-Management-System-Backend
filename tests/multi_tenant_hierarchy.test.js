const assert = require('assert');
const { sequelize, tenantContext } = require('../src/config/database');
const { Tenant, User, Role, Advocate, GroupAdminAdvocate } = require('../src/features/associations');
const tenantService = require('../src/features/tenants/tenantService');
const groupAdminService = require('../src/features/users/groupAdminService');
const advocateService = require('../src/features/advocates/advocateService');

async function runTests() {
  console.log('====================================================');
  console.log('Starting Multi-Tenant Hierarchy Integration Tests...');
  console.log('====================================================\n');

  try {
    await sequelize.authenticate();

    const superAdminUser = {
      id: 99999,
      role: 'Super Admin',
      tenantId: null,
    };

    // Step 1: Create Tenant A and Tenant B
    console.log('[TEST 1] Super Admin creates Tenant A and Tenant B...');
    const tenantA = await tenantService.createTenant(
      { name: 'Test Tenant A', code: 'TEN_A_' + Date.now() },
      { name: 'Admin A1', email: 'adminA1_' + Date.now() + '@tenantA.com', password: 'password' }
    );
    const tenantB = await tenantService.createTenant(
      { name: 'Test Tenant B', code: 'TEN_B_' + Date.now() },
      { name: 'Admin B1', email: 'adminB1_' + Date.now() + '@tenantB.com', password: 'password' }
    );
    assert.ok(tenantA.id, 'Tenant A should have ID');
    assert.ok(tenantB.id, 'Tenant B should have ID');
    console.log(`  └─ Success: Tenant A (ID: ${tenantA.id}), Tenant B (ID: ${tenantB.id})`);

    // Get Tenant Admin A1 user record
    const adminA1 = await User.findOne({ where: { tenantId: tenantA.id, email: { [sequelize.Sequelize.Op.like]: 'adminA1_%' } } });
    assert.ok(adminA1, 'Tenant Admin A1 should exist');
    const tenantAdminA1Context = { id: adminA1.id, role: 'Tenant Admin', tenantId: tenantA.id };

    // Step 2: Tenant Admin A1 creates Tenant Admin A2
    console.log('\n[TEST 2] Tenant Admin A1 creates Tenant Admin A2...');
    let adminA2;
    await tenantContext.run({ tenantId: tenantA.id, isSuperAdmin: false }, async () => {
      const gaRole = await Role.findOne({ where: { name: 'Tenant Admin', tenantId: tenantA.id } });
      const roleId = gaRole ? gaRole.id : adminA1.roleId;
      adminA2 = await User.create({
        name: 'Admin A2',
        email: 'adminA2_' + Date.now() + '@tenantA.com',
        passwordHash: 'hash',
        roleId,
        tenantId: tenantA.id,
        status: 'active',
      });
    });
    assert.strictEqual(adminA2.tenantId, tenantA.id, 'Admin A2 must belong to Tenant A');
    console.log(`  └─ Success: Tenant Admin A2 created (ID: ${adminA2.id}, Tenant: ${adminA2.tenantId})`);

    // Step 3: Tenant Admin A1 creates Group Admin 1 and Group Admin 2 in Tenant A
    console.log('\n[TEST 3] Tenant Admin A1 creates Group Admin 1 & Group Admin 2...');
    let groupAdmin1, groupAdmin2;
    await tenantContext.run({ tenantId: tenantA.id, isSuperAdmin: false }, async () => {
      groupAdmin1 = await groupAdminService.createGroupAdmin(
        { name: 'Group Admin 1', email: 'ga1_' + Date.now() + '@tenantA.com', password: 'password' },
        tenantAdminA1Context
      );
      groupAdmin2 = await groupAdminService.createGroupAdmin(
        { name: 'Group Admin 2', email: 'ga2_' + Date.now() + '@tenantA.com', password: 'password' },
        tenantAdminA1Context
      );
    });
    assert.strictEqual(groupAdmin1.tenantId, tenantA.id, 'Group Admin 1 must belong to Tenant A');
    assert.strictEqual(groupAdmin2.tenantId, tenantA.id, 'Group Admin 2 must belong to Tenant A');
    console.log(`  └─ Success: Group Admin 1 (ID: ${groupAdmin1.id}), Group Admin 2 (ID: ${groupAdmin2.id})`);

    const ga1Context = { id: groupAdmin1.id, role: 'Group Admin', tenantId: tenantA.id };
    const ga2Context = { id: groupAdmin2.id, role: 'Group Admin', tenantId: tenantA.id };

    // Step 4: Group Admin 1 Creates Advocate A, Advocate B, Advocate C
    console.log('\n[TEST 4] Group Admin 1 creates Advocates A, B, C...');
    let advocateA, advocateB, advocateC;
    await tenantContext.run({ tenantId: tenantA.id, isSuperAdmin: false }, async () => {
      advocateA = await advocateService.createAdvocate(
        { name: 'Advocate A', email: 'advA_' + Date.now() + '@tenantA.com', enrolment: 'BAR/A/001' },
        ga1Context
      );
      advocateB = await advocateService.createAdvocate(
        { name: 'Advocate B', email: 'advB_' + Date.now() + '@tenantA.com', enrolment: 'BAR/B/002' },
        ga1Context
      );
      advocateC = await advocateService.createAdvocate(
        { name: 'Advocate C', email: 'advC_' + Date.now() + '@tenantA.com', enrolment: 'BAR/C/003' },
        ga1Context
      );
    });
    assert.ok(advocateA.id && advocateB.id && advocateC.id, 'Advocates A, B, C created');
    console.log(`  └─ Success: Adv A (ID: ${advocateA.id}), Adv B (ID: ${advocateB.id}), Adv C (ID: ${advocateC.id})`);

    // Step 5: Group Admin 2 assigns existing Advocate A & Advocate C, and creates Advocate D
    console.log('\n[TEST 5] Group Admin 2 assigns Advocate A & C, creates Advocate D...');
    let advocateD;
    await tenantContext.run({ tenantId: tenantA.id, isSuperAdmin: false }, async () => {
      // Assign existing Advocate A
      await groupAdminService.assignAdvocateToGroupAdmin(groupAdmin2.id, advocateA.id, tenantAdminA1Context);
      // Assign existing Advocate C
      await groupAdminService.assignAdvocateToGroupAdmin(groupAdmin2.id, advocateC.id, tenantAdminA1Context);
      // Create Advocate D
      advocateD = await advocateService.createAdvocate(
        { name: 'Advocate D', email: 'advD_' + Date.now() + '@tenantA.com', enrolment: 'BAR/D/004' },
        ga2Context
      );
    });
    assert.ok(advocateD.id, 'Advocate D created');
    console.log(`  └─ Success: Adv D created (ID: ${advocateD.id}), Adv A & C assigned to GA2`);

    // Step 6: Verify Duplicate Advocate Prevention & Junction Records
    console.log('\n[TEST 6] Verifying Duplicate Prevention & Junction Relationships...');
    const ga1Advocates = await groupAdminService.getAssignedAdvocates(groupAdmin1.id, tenantAdminA1Context);
    const ga2Advocates = await groupAdminService.getAssignedAdvocates(groupAdmin2.id, tenantAdminA1Context);

    const ga1Ids = ga1Advocates.map((a) => a.id).sort();
    const ga2Ids = ga2Advocates.map((a) => a.id).sort();

    console.log(`  Group Admin 1 Advocates: [${ga1Ids.join(', ')}]`);
    console.log(`  Group Admin 2 Advocates: [${ga2Ids.join(', ')}]`);

    assert.deepStrictEqual(ga1Ids, [advocateA.id, advocateB.id, advocateC.id].sort(), 'GA1 should have A, B, C');
    assert.deepStrictEqual(ga2Ids, [advocateA.id, advocateC.id, advocateD.id].sort(), 'GA2 should have A, C, D');

    // Count Advocate rows with enrolment BAR/A/001
    const countAdvA = await Advocate.count({ where: { tenantId: tenantA.id, enrolment: advocateA.enrolment }, bypassTenant: true });
    assert.strictEqual(countAdvA, 1, 'There MUST be only ONE Advocate record for Advocate A');
    console.log('  └─ Success: Exactly 1 Advocate record exists for Advocate A (No Duplication!)');

    // Step 7: Security Tests - Cross Tenant Isolation
    console.log('\n[TEST 7] Security Test: Cross-Tenant Isolation...');
    // Create an Advocate in Tenant B
    const adminB1 = await User.findOne({ where: { tenantId: tenantB.id, email: { [sequelize.Sequelize.Op.like]: 'adminB1_%' } } });
    const tenantAdminB1Context = { id: adminB1.id, role: 'Tenant Admin', tenantId: tenantB.id };
    let advocateB_TenantB;
    await tenantContext.run({ tenantId: tenantB.id, isSuperAdmin: false }, async () => {
      advocateB_TenantB = await advocateService.createAdvocate(
        { name: 'Tenant B Advocate', email: 'adv_tb_' + Date.now() + '@tenantB.com' },
        tenantAdminB1Context
      );
    });

    // Group Admin 1 from Tenant A attempts to access Tenant B Advocate
    await tenantContext.run({ tenantId: tenantA.id, isSuperAdmin: false }, async () => {
      try {
        await advocateService.getAdvocateById(advocateB_TenantB.id, ga1Context);
        assert.fail('Should have blocked cross-tenant access to Advocate B');
      } catch (err) {
        assert.ok(err.statusCode === 403 || err.statusCode === 404, 'Cross-tenant access must return 403 or 404');
        console.log(`  └─ Success: Cross-tenant access blocked with status ${err.statusCode}`);
      }
    });


    // Step 8: Security Tests - Group Admin Isolation
    console.log('\n[TEST 8] Security Test: Group Admin Isolation...');
    // Group Admin 1 attempts to access Advocate D (assigned only to Group Admin 2)
    await tenantContext.run({ tenantId: tenantA.id, isSuperAdmin: false }, async () => {
      try {
        await advocateService.getAdvocateById(advocateD.id, ga1Context);
        assert.fail('Should have blocked Group Admin 1 from accessing unassigned Advocate D');
      } catch (err) {
        assert.strictEqual(err.statusCode, 403, 'Unassigned advocate access must return 403');
        console.log('  └─ Success: Unassigned advocate access blocked with 403 Forbidden');
      }
    });

    // Step 9: Super Admin Access
    console.log('\n[TEST 9] Super Admin Cross-Tenant Access...');
    const superAdminAdvA = await advocateService.getAdvocateById(advocateA.id, superAdminUser);
    const superAdminAdvB_TB = await advocateService.getAdvocateById(advocateB_TenantB.id, superAdminUser);
    assert.ok(superAdminAdvA.id && superAdminAdvB_TB.id, 'Super Admin accesses both Tenant A and Tenant B advocates');
    console.log('  └─ Success: Super Admin can access data across all tenants');

    console.log('\n====================================================');
    console.log('ALL MULTI-TENANT HIERARCHY TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\nTEST FAILED:', error);
    process.exit(1);
  }
}

runTests();
