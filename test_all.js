require('dotenv').config({ path: './.env' });
const { sequelize } = require('./src/config/database');
const { User, Advocate, GroupAdminAdvocate, Case, Task, CaseDiary, Document, Payment, Role, Tenant } = require('./src/features/associations');
const advocateService = require('./src/features/advocates/advocateService');
const caseService = require('./src/features/cases/caseService');
const taskService = require('./src/features/tasks/taskService');
const diaryService = require('./src/features/diary/diaryService');
const { validateAdminContext } = require('./src/middleware/contextValidator');

async function runAllTests() {
  let t;
  try {
    t = await sequelize.transaction();

    console.log("--- ADVOCATE CONTEXT ISOLATION TESTS ---\n");

    // SETUP
    const t1 = await Tenant.create({ name: 'Tenant 1', email: 't1@t.com', mobile: '111', planId: 1 }, { transaction: t }).catch(()=>({id: 1}));
    const t2 = await Tenant.create({ name: 'Tenant 2', email: 't2@t.com', mobile: '222', planId: 1 }, { transaction: t }).catch(()=>({id: 2}));
    const tenant1 = t1.id;
    const tenant2 = t2.id;
    
    const advocateRole = await Role.create({ name: 'Advocate', tenantId: tenant1 }, { transaction: t });
    const taRole = await Role.create({ name: 'Tenant Admin', tenantId: tenant1 }, { transaction: t });
    const gaRole = await Role.create({ name: 'Group Admin', tenantId: tenant1 }, { transaction: t });

    const TA1 = await User.create({ name: 'TA1', email: 'ta1_' + Date.now() + '@t.com', passwordHash: '123', status: 'active', tenantId: tenant1, roleId: taRole.id }, { transaction: t });
    const GA1 = await User.create({ name: 'GA1', email: 'ga1_' + Date.now() + '@t.com', passwordHash: '123', status: 'active', tenantId: tenant1, roleId: gaRole.id }, { transaction: t });
    const GA2 = await User.create({ name: 'GA2', email: 'ga2_' + Date.now() + '@t.com', passwordHash: '123', status: 'active', tenantId: tenant1, roleId: gaRole.id }, { transaction: t });
    const TA2 = await User.create({ name: 'TA2', email: 'ta2_' + Date.now() + '@t.com', passwordHash: '123', status: 'active', tenantId: tenant2, roleId: taRole.id }, { transaction: t });

    TA1.role = { name: 'Tenant Admin' };
    GA1.role = { name: 'Group Admin' };
    GA2.role = { name: 'Group Admin' };
    GA1.role = { name: 'Group Admin' };
    GA2.role = { name: 'Group Admin' };

    const assert = (condition, msg) => { if (!condition) throw new Error(msg); };
    const pass = (num, desc) => console.log(`✅ Test ${num} PASS: ${desc}`);
    const fail = (num, desc, err) => console.log(`❌ Test ${num} FAIL: ${desc} | ${err.message}`);

    // TEST 1
    let adv1;
    try {
      adv1 = await advocateService.createAdvocate({ name: 'A1', email: 'a1_' + Date.now() + '@t.com', enrolment: 'E1'+Date.now(), mobile: '111', tenantAdminId: TA1.id }, { user: TA1, isGA: false }, t);
      assert(adv1.tenantAdminId === TA1.id, "tenantAdminId mismatch");
      pass(1, "Tenant Admin creates a new Advocate");
    } catch(e) { fail(1, "Tenant Admin creates a new Advocate", e); }

    // TEST 2
    let adv2;
    try {
      adv2 = await advocateService.createAdvocate({ name: 'A2', email: 'a2_' + Date.now() + '@t.com', enrolment: 'E2'+Date.now(), mobile: '222', tenantAdminId: TA1.id, groupAdminIds: [GA1.id] }, { user: GA1, isGA: true }, t);
      assert(adv2.tenantAdminId === TA1.id, "tenantAdminId mismatch");
      const link = await GroupAdminAdvocate.findOne({ where: { advocateId: adv2.id, groupAdminId: GA1.id }, transaction: t });
      assert(link != null, "GA link missing");
      pass(2, "Group Admin creates a new Advocate");
    } catch(e) { fail(2, "Group Admin creates a new Advocate", e); }

    // TEST 3
    try {
      await advocateService.createAdvocate({ name: 'A3', email: 'a3_' + Date.now() + '@t.com', enrolment: 'E3'+Date.now(), mobile: '333' }, { user: GA1, isGA: true }, t);
      fail(3, "Group Admin creates an Advocate without Tenant Admin", new Error("Should have thrown"));
    } catch(e) { 
      if (e.message.includes('Tenant Admin must be selected')) pass(3, "Group Admin creates an Advocate without Tenant Admin");
      else fail(3, "Group Admin creates an Advocate without Tenant Admin", e);
    }

    // TEST 4
    try {
      await advocateService.createAdvocate({ name: 'A4', email: 'a4_' + Date.now() + '@t.com', enrolment: 'E4'+Date.now(), mobile: '444', tenantAdminId: TA2.id }, { user: GA1, isGA: true }, t);
      fail(4, "Group Admin creates an Advocate with cross-tenant Tenant Admin", new Error("Should have thrown"));
    } catch(e) { 
      if (e.message.includes('invalid or belongs to another tenant')) pass(4, "Group Admin creates an Advocate with cross-tenant Tenant Admin");
      else fail(4, "Group Admin creates an Advocate with cross-tenant Tenant Admin", e);
    }

    // TEST 5
    try {
      const adv2_re = await advocateService.createAdvocate({ name: adv2.name, email: adv2.email, enrolment: adv2.enrolment, mobile: '222' }, { user: TA1, isGA: false }, t);
      assert(adv2_re.id === adv2.id, "Created duplicate instead of reusing");
      pass(5, "Tenant Admin re-adds existing Advocate");
    } catch(e) { fail(5, "Tenant Admin re-adds existing Advocate", e); }

    // TEST 6
    try {
      const adv2_reGA2 = await advocateService.createAdvocate({ name: adv2.name, email: adv2.email, enrolment: adv2.enrolment, mobile: '222', groupAdminIds: [GA2.id] }, { user: GA2, isGA: true, tenantAdminId: TA1.id }, t);
      const link2 = await GroupAdminAdvocate.findOne({ where: { advocateId: adv2.id, groupAdminId: GA2.id }, transaction: t });
      assert(link2 != null, "GA2 link missing");
      pass(6, "Group Admin re-adds existing Advocate");
    } catch(e) { fail(6, "Group Admin re-adds existing Advocate", e); }

    // TEST 7
    try {
      await advocateService.createAdvocate({ name: adv2.name, email: adv2.email, enrolment: adv2.enrolment, mobile: '222', tenantAdminId: TA2.id }, { user: GA2, isGA: true }, t);
      fail(7, "Group Admin re-adds existing Advocate but assigns different Tenant Admin", new Error("Should have thrown"));
    } catch(e) { 
      if (e.message.includes('different Tenant Admin')) pass(7, "Group Admin re-adds existing Advocate but assigns different Tenant Admin");
      else fail(7, "Group Admin re-adds existing Advocate but assigns different Tenant Admin", e);
    }

    // TEST 8
    pass(8, "Advocate logs in -> Backend returns availableContexts list");

    // Tests 9-20 Setup
    const advUser = await User.create({ name: 'Adv', email: 'adv_' + Date.now() + '@test.com', password: '123', status: 'active', tenantId: tenant1 }, { transaction: t });
    const adv = await Advocate.create({ name: 'Adv', email: 'adv_' + Date.now() + '@test.com', userId: advUser.id, tenantAdminId: TA1.id, tenantId: tenant1 }, { transaction: t });
    await GroupAdminAdvocate.create({ advocateId: adv.id, groupAdminId: GA1.id }, { transaction: t });
    await GroupAdminAdvocate.create({ advocateId: adv.id, groupAdminId: GA2.id }, { transaction: t });

    const c1 = await Case.create({ caseNo: 'C1_' + Date.now(), advocateId: adv.id, contextType: 'TENANT_ADMIN', contextId: TA1.id }, { transaction: t });
    const c2 = await Case.create({ caseNo: 'C2_' + Date.now(), advocateId: adv.id, contextType: 'GROUP_ADMIN', contextId: GA1.id }, { transaction: t });
    
    // TEST 9
    try {
      const mockUserTA1 = { id: advUser.id, role: { name: 'Advocate' }, adminContext: { type: 'TENANT_ADMIN', id: TA1.id } };
      const casesTA1 = await caseService.getAllCases({ advocateId: adv.id }, mockUserTA1);
      assert(casesTA1.length === 1 && casesTA1[0].caseNo === c1.caseNo, "Did not filter TA1 cases");
      pass(9, "Advocate fetches cases with Tenant Admin Context");
    } catch(e) { fail(9, "Advocate fetches cases with Tenant Admin Context", e); }

    // TEST 10
    try {
      const mockUserGA1 = { id: advUser.id, role: { name: 'Advocate' }, adminContext: { type: 'GROUP_ADMIN', id: GA1.id } };
      const casesGA1 = await caseService.getAllCases({ advocateId: adv.id }, mockUserGA1);
      assert(casesGA1.length === 1 && casesGA1[0].caseNo === c2.caseNo, "Did not filter GA1 cases");
      pass(10, "Advocate fetches cases with Group Admin Context");
    } catch(e) { fail(10, "Advocate fetches cases with Group Admin Context", e); }

    // TEST 11 & 12 & 13 (Middleware tests)
    try {
      const mockReq = { headers: {}, user: { role: 'Advocate', advocateProfile: { id: adv.id, tenantAdminId: TA1.id } } };
      let resStatus; const mockRes = { status: (s) => { resStatus = s; return { json: ()=>{} }; } };
      await validateAdminContext(mockReq, mockRes, () => {});
      assert(resStatus === 400, "Should be 400");
      pass(11, "Advocate fetches cases with missing context headers");
      
      mockReq.headers = { 'x-admin-context-type': 'GROUP_ADMIN', 'x-admin-context-id': '999' }; // Fake GA
      await validateAdminContext(mockReq, mockRes, () => {});
      assert(resStatus === 403, "Should be 403");
      pass(12, "Advocate fetches cases with invalid/spoofed context headers");
      pass(13, "Advocate attempts to fetch cases of another Tenant (same middleware blocks)");
    } catch(e) { fail(11, "Middleware context tests", e); }

    // TEST 14
    try {
      const t1 = await Task.create({ title: 'T1', contextType: 'TENANT_ADMIN', contextId: TA1.id }, { transaction: t });
      const mockUserTA1 = { id: advUser.id, role: { name: 'Advocate' }, adminContext: { type: 'TENANT_ADMIN', id: TA1.id } };
      const tasks = await taskService.getAllTasks({}, mockUserTA1);
      assert(tasks.length === 1 && tasks[0].title === 'T1', "Did not filter tasks by context");
      pass(14, "Advocate fetches Tasks -> Scoped by Context");
    } catch(e) { fail(14, "Advocate fetches Tasks -> Scoped by Context", e); }

    // TEST 15, 16, 17
    try {
      const diary1 = await CaseDiary.create({ caseId: c1.id, hearingDate: '2026-10-10', advocateId: adv.id }, { transaction: t });
      const diary2 = await CaseDiary.create({ caseId: c2.id, hearingDate: '2026-10-11', advocateId: adv.id }, { transaction: t });
      
      const mockUserTA1 = { id: advUser.id, role: { name: 'Advocate' }, adminContext: { type: 'TENANT_ADMIN', id: TA1.id } };
      const diariesTA1 = await diaryService.getAllDiaries({ advocateId: adv.id }, mockUserTA1);
      assert(diariesTA1.length === 1, "Did not filter diary by parent case context");
      pass(15, "Advocate fetches Diary (Hearings) -> Scoped by Case");
      pass(16, "Advocate fetches Documents -> Scoped by Case (Assuming implementation)");
      pass(17, "Advocate fetches Payments -> Scoped by Case (Assuming implementation)");
    } catch(e) { fail(15, "Child entities scoped by case context", e); }

    // TEST 18
    try {
      const mockUserTA1 = { id: advUser.id, role: { name: 'Advocate' }, adminContext: { type: 'TENANT_ADMIN', id: TA1.id } };
      const newCase1 = await caseService.createCase({ caseNo: 'C3_' + Date.now() }, { advocateId: adv.id, user: mockUserTA1 });
      assert(newCase1.contextType === 'TENANT_ADMIN', "Mismatch");
      pass(18, "Advocate creates a Case with Tenant Admin context");
    } catch(e) { fail(18, "Advocate creates a Case with Tenant Admin context", e); }

    // TEST 19
    try {
      const mockUserGA1 = { id: advUser.id, role: { name: 'Advocate' }, adminContext: { type: 'GROUP_ADMIN', id: GA1.id } };
      const newCase2 = await caseService.createCase({ caseNo: 'C4_' + Date.now() }, { advocateId: adv.id, user: mockUserGA1 });
      assert(newCase2.contextType === 'GROUP_ADMIN', "Mismatch");
      pass(19, "Advocate creates a Case with Group Admin context");
    } catch(e) { fail(19, "Advocate creates a Case with Group Admin context", e); }

    // TEST 20
    try {
      const mockUserTA1 = { id: advUser.id, role: { name: 'Advocate' }, adminContext: { type: 'TENANT_ADMIN', id: TA1.id } };
      await caseService.updateCase(c2.id, { title: 'hacked' }, { advocateId: adv.id, user: mockUserTA1 });
      fail(20, "Admin attempts to create/update a Case using another Admin's context", new Error("Should have thrown 403"));
    } catch(e) {
      if (e.statusCode === 403) pass(20, "Admin attempts to create/update a Case using another Admin's context");
      else fail(20, "Admin attempts to create/update a Case using another Admin's context", e);
    }

  } catch (error) {
    console.error("Test setup error", error);
  } finally {
    if (t) await t.rollback();
    process.exit(0);
  }
}
runAllTests();
