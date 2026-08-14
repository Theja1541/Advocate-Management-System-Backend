const fs = require('fs');
const { sequelize } = require('./src/config/database');

async function executeCleanupAndVerify() {
  const transaction = await sequelize.transaction();
  try {
    console.log('=== STARTING TRANSACTION CLEANUP ===');

    // Snapshot Super Admin state before cleanup for verification
    const [superAdminBefore] = await sequelize.query(
      `SELECT id, name, email, password_hash, role_id, tenant_id FROM users WHERE id = 1`,
      { transaction }
    );
    console.log('Super Admin snapshot before cleanup:', superAdminBefore[0]);

    // 0. Create temporary table of target case IDs (tenant_id IS NOT NULL AND tenant_id <> 1)
    await sequelize.query(`
      CREATE TEMPORARY TABLE temp_target_cases AS
      SELECT id FROM cases WHERE tenant_id IS NOT NULL AND tenant_id <> 1
    `, { transaction });

    const [targetCases] = await sequelize.query(`SELECT id FROM temp_target_cases`, { transaction });
    console.log('Target cases captured in temp table:', targetCases.map(c => c.id));

    // 0b. Create temporary table of target case_diaries
    await sequelize.query(`
      CREATE TEMPORARY TABLE temp_target_case_diaries AS
      SELECT id FROM case_diaries WHERE case_id IN (SELECT id FROM temp_target_cases)
    `, { transaction });

    // 0c. Create temporary table of target lands
    await sequelize.query(`
      CREATE TEMPORARY TABLE temp_target_lands AS
      SELECT id FROM lands WHERE case_id IN (SELECT id FROM temp_target_cases)
    `, { transaction });

    // 1. OPINIONS: Delete opinions referencing target documents OR target lands
    await sequelize.query(`
      DELETE FROM opinions 
      WHERE document_id IN (
        SELECT id FROM documents 
        WHERE case_id IN (SELECT id FROM temp_target_cases)
           OR diary_id IN (SELECT id FROM temp_target_case_diaries)
      )
      OR land_id IN (SELECT id FROM temp_target_lands)
      OR (tenant_id IS NOT NULL AND tenant_id <> 1)
    `, { transaction });
    console.log('Deleted target opinions.');

    // 2. LAND TITLE SEARCHES: Delete title searches referencing target lands
    await sequelize.query(`
      DELETE FROM land_title_searches 
      WHERE land_id IN (SELECT id FROM temp_target_lands)
      OR (tenant_id IS NOT NULL AND tenant_id <> 1)
    `, { transaction });
    console.log('Deleted target land_title_searches.');

    // 3. LANDS: Delete lands referencing target cases
    await sequelize.query(`
      DELETE FROM lands 
      WHERE case_id IN (SELECT id FROM temp_target_cases)
      OR (tenant_id IS NOT NULL AND tenant_id <> 1)
    `, { transaction });
    console.log('Deleted target lands.');

    // 4. DOCUMENTS: Delete documents referencing target cases OR target case_diaries
    await sequelize.query(`
      DELETE FROM documents 
      WHERE case_id IN (SELECT id FROM temp_target_cases)
         OR diary_id IN (SELECT id FROM temp_target_case_diaries)
         OR (tenant_id IS NOT NULL AND tenant_id <> 1)
    `, { transaction });
    console.log('Deleted target documents.');

    // 5. CASE DIARIES: Delete case_diaries referencing target cases
    await sequelize.query(`
      DELETE FROM case_diaries 
      WHERE case_id IN (SELECT id FROM temp_target_cases)
      OR (tenant_id IS NOT NULL AND tenant_id <> 1)
    `, { transaction });
    console.log('Deleted target case_diaries.');

    // 6. DIARY ENTRIES: Delete diary_entries referencing target cases
    await sequelize.query(`
      DELETE FROM diary_entries 
      WHERE case_id IN (SELECT id FROM temp_target_cases)
    `, { transaction });

    // 7. CASE STAGE HISTORY & APPROVAL HISTORY: Delete history entries referencing target cases
    await sequelize.query(`
      DELETE FROM case_stage_history 
      WHERE case_id IN (SELECT id FROM temp_target_cases)
      OR (tenant_id IS NOT NULL AND tenant_id <> 1)
    `, { transaction });

    await sequelize.query(`
      DELETE FROM case_approval_history 
      WHERE case_id IN (SELECT id FROM temp_target_cases)
    `, { transaction });

    // 8. PAYMENTS: Delete payments referencing target cases
    await sequelize.query(`
      DELETE FROM payments 
      WHERE case_id IN (SELECT id FROM temp_target_cases)
      OR (tenant_id IS NOT NULL AND tenant_id <> 1)
    `, { transaction });

    // 9. CASES: Delete target non-tenant-1 cases
    const [caseDeleteRes] = await sequelize.query(`
      DELETE FROM cases WHERE id IN (SELECT id FROM temp_target_cases)
    `, { transaction });
    console.log(`Deleted non-tenant-1 cases. Count: ${caseDeleteRes.affectedRows}`);

    // 10. CLEANUP ALL OTHER TABLES with tenant_id <> 1 (excluding NULL tenant)
    const tenantTables = [
      'advocates', 'alerts', 'amendments', 'bare_acts', 'case_stages', 'case_types',
      'clients', 'courts', 'daybook', 'document_categories', 'legal_texts', 'memberships',
      'phrase_groups', 'phrase_occurrences', 'references_library', 'state_court_fee_rules',
      'state_court_fee_slabs', 'tasks', 'tenant_settings', 'tenant_subscriptions'
    ];

    for (const tbl of tenantTables) {
      await sequelize.query(`
        DELETE FROM \`${tbl}\` WHERE tenant_id IS NOT NULL AND tenant_id <> 1
      `, { transaction });
    }

    // 11. USERS, ROLES, TENANTS with tenant_id <> 1 (explicitly leaving NULL tenant records alone)
    await sequelize.query(`DELETE FROM users WHERE tenant_id IS NOT NULL AND tenant_id <> 1`, { transaction });
    await sequelize.query(`DELETE FROM roles WHERE tenant_id IS NOT NULL AND tenant_id <> 1`, { transaction });
    await sequelize.query(`DELETE FROM tenants WHERE id <> 1`, { transaction });

    // Commit transaction
    await transaction.commit();
    console.log('=== CLEANUP TRANSACTION COMMITTED SUCCESSFULLY ===');

    // ==========================================
    // VERIFICATIONS
    // ==========================================
    console.log('\n=== RUNNING POST-CLEANUP VERIFICATIONS ===');

    // 1. Tenants table contains exactly id = 1
    const [tenants] = await sequelize.query(`SELECT id, name FROM tenants`);
    console.log('1. Tenants table contents:', tenants);
    if (tenants.length !== 1 || tenants[0].id !== 1) {
      throw new Error(`Tenant verification failed! Expected only id=1, found: ${JSON.stringify(tenants)}`);
    }

    // 2. Cases table contains exactly 13 tenant-1 cases
    const [remainingCases] = await sequelize.query(`SELECT id, title, tenant_id FROM cases`);
    console.log(`2. Remaining cases count: ${remainingCases.length}`);
    const nonT1Cases = remainingCases.filter(c => c.tenant_id !== 1);
    if (remainingCases.length !== 13 || nonT1Cases.length > 0) {
      throw new Error(`Cases verification failed! Expected 13 cases with tenant_id=1, found non-T1: ${nonT1Cases.length}`);
    }

    // 3. Check for any remaining non-primary tenant records across all tables
    const [cols] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'tenant_id'
    `);
    let nonT1Found = false;
    for (const c of cols) {
      const tbl = c.TABLE_NAME;
      const [[{ cnt }]] = await sequelize.query(`
        SELECT COUNT(*) as cnt FROM \`${tbl}\` WHERE tenant_id IS NOT NULL AND tenant_id <> 1
      `);
      if (cnt > 0) {
        console.error(`ERROR: Found ${cnt} non-tenant-1 rows in table ${tbl}`);
        nonT1Found = true;
      }
    }
    if (!nonT1Found) {
      console.log('3. Verified 0 rows with tenant_id IS NOT NULL AND tenant_id <> 1 across ALL tables.');
    }

    // 4. Super Admin user verification
    const [superAdminAfter] = await sequelize.query(
      `SELECT id, name, email, password_hash, role_id, tenant_id FROM users WHERE id = 1`
    );
    console.log('4. Super Admin state after cleanup:', superAdminAfter[0]);
    if (
      !superAdminAfter[0] ||
      superAdminAfter[0].email !== 'amasatheja1541@gmail.com' ||
      superAdminAfter[0].role_id !== 1 ||
      superAdminAfter[0].password_hash !== superAdminBefore[0].password_hash
    ) {
      throw new Error('Super Admin verification failed!');
    }

    // 5. Super Admin role verification
    const [superAdminRole] = await sequelize.query(`SELECT id, name FROM roles WHERE id = 1`);
    console.log('5. Super Admin role after cleanup:', superAdminRole[0]);
    if (!superAdminRole[0] || superAdminRole[0].name !== 'Super Admin') {
      throw new Error('Super Admin role verification failed!');
    }

    // 6. NULL-tenant user & roles verification
    const [nullUser] = await sequelize.query(`SELECT id, name, email FROM users WHERE id = 7`);
    console.log('6a. NULL-tenant user id=7:', nullUser[0]);
    if (!nullUser[0]) throw new Error('NULL-tenant user id=7 missing!');

    const [nullRoles] = await sequelize.query(`SELECT id, name FROM roles WHERE id IN (8, 50, 51, 52)`);
    console.log('6b. NULL-tenant roles 8, 50, 51, 52:', nullRoles);
    if (nullRoles.length !== 4) throw new Error('NULL-tenant roles missing!');

    console.log('\n=== ALL VERIFICATIONS PASSED SUCCESSFULLY ===');

  } catch (err) {
    if (!transaction.finished) {
      await transaction.rollback();
      console.error('Transaction rolled back.');
    }
    console.error('Execution / Verification Error:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

executeCleanupAndVerify();
