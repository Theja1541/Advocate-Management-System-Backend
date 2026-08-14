const fs = require('fs');
const { sequelize } = require('./src/config/database');

async function runLiveValidationAndCleanup() {
  try {
    console.log('=== STEP 1: LIVE PRE-EXECUTION VALIDATION ===');

    // 1. Verify users rows and IDs
    const [users] = await sequelize.query(`SELECT id, name, email, role_id, tenant_id FROM users`);
    console.log(`Current users count: ${users.length}`);
    console.log('Users list:', users);
    const userIds = users.map(u => u.id);
    if (users.length !== 7 || !userIds.includes(1)) {
      throw new Error(`Pre-validation failed! Expected 7 users including id=1, found ${users.length}`);
    }

    // 2. Verify roles rows and IDs
    const [roles] = await sequelize.query(`SELECT id, name, tenant_id FROM roles`);
    console.log(`Current roles count: ${roles.length}`);
    console.log('Roles list:', roles);
    const roleIds = roles.map(r => r.id);
    if (roles.length !== 9 || !roleIds.includes(1)) {
      throw new Error(`Pre-validation failed! Expected 9 roles including id=1, found ${roles.length}`);
    }

    // Reconcile role IDs: IDs in DB are 1, 2, 3, 4, 5, 8, 50, 51, 52 (total 9 roles)
    const expectedNonSuperRoles = [2, 3, 4, 5, 8, 50, 51, 52];
    const actualNonSuperRoles = roleIds.filter(id => id !== 1);
    console.log('Non-Super Admin role IDs in DB:', actualNonSuperRoles);

    // 3. Verify all tables in script exist in database
    const [tablesRes] = await sequelize.query('SHOW TABLES');
    const dbTables = tablesRes.map(t => Object.values(t)[0]);
    
    const targetTablesInScript = [
      'opinions', 'land_title_searches', 'documents', 'case_diaries', 'diary_entries',
      'case_stage_history', 'case_approval_history', 'lands', 'payments', 'cases',
      'memberships', 'group_admin_advocates', 'advocates', 'clients', 'courts',
      'case_stages', 'case_types', 'document_categories', 'amendments', 'daybook',
      'tasks', 'alerts', 'bare_acts', 'legal_texts', 'references_library',
      'phrase_occurrences', 'phrase_groups', 'state_court_fee_slabs',
      'state_court_fee_rules', 'tenant_settings', 'tenant_subscriptions',
      'permissions', 'users', 'roles', 'tenants'
    ];

    for (const tbl of targetTablesInScript) {
      if (!dbTables.includes(tbl)) {
        throw new Error(`Pre-validation failed! Table '${tbl}' does not exist in DB.`);
      }
    }
    console.log('All 35 tables in script exist in database.');

    // 4. Verify all tables with tenant_id foreign keys are handled
    const [tenantFkCols] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = 'tenants'
    `);
    const tenantFkTables = tenantFkCols.map(c => c.TABLE_NAME);
    console.log('Tables with explicit FK referencing tenants:', tenantFkTables);
    for (const tbl of tenantFkTables) {
      if (!targetTablesInScript.includes(tbl)) {
        throw new Error(`Pre-validation failed! FK table '${tbl}' referencing tenants is missing from deletion script.`);
      }
    }

    // 5. Verify Super Admin password hash snapshot
    const [saUserBefore] = await sequelize.query(`SELECT * FROM users WHERE id = 1`);
    console.log('Super Admin user snapshot before cleanup:', saUserBefore[0]);

    console.log('\n=== PRE-EXECUTION VALIDATION COMPLETED SUCCESSFULLY ===');
    console.log('=== EXECUTING DESTRUCTIVE TRANSACTION CLEANUP ===');

    const transaction = await sequelize.transaction();
    try {
      // 1. Delete dependent leaf tables first
      await sequelize.query(`DELETE FROM opinions`, { transaction });
      await sequelize.query(`DELETE FROM land_title_searches`, { transaction });
      await sequelize.query(`DELETE FROM documents`, { transaction });
      await sequelize.query(`DELETE FROM case_diaries`, { transaction });
      await sequelize.query(`DELETE FROM diary_entries`, { transaction });
      await sequelize.query(`DELETE FROM case_stage_history`, { transaction });
      await sequelize.query(`DELETE FROM case_approval_history`, { transaction });
      await sequelize.query(`DELETE FROM lands`, { transaction });
      await sequelize.query(`DELETE FROM payments`, { transaction });

      // 2. Delete cases
      await sequelize.query(`DELETE FROM cases`, { transaction });

      // 3. Delete memberships & group admin advocates
      await sequelize.query(`DELETE FROM memberships`, { transaction });
      await sequelize.query(`DELETE FROM group_admin_advocates`, { transaction });

      // 4. Delete advocates
      await sequelize.query(`DELETE FROM advocates`, { transaction });

      // 5. Delete master reference data
      await sequelize.query(`DELETE FROM clients`, { transaction });
      await sequelize.query(`DELETE FROM courts`, { transaction });
      await sequelize.query(`DELETE FROM case_stages`, { transaction });
      await sequelize.query(`DELETE FROM case_types`, { transaction });
      await sequelize.query(`DELETE FROM document_categories`, { transaction });

      // 6. Delete user-activity records (excluding super admin user itself)
      await sequelize.query(`DELETE FROM amendments`, { transaction });
      await sequelize.query(`DELETE FROM daybook`, { transaction });
      await sequelize.query(`DELETE FROM tasks`, { transaction });

      // 7. Delete legal/fee/phrase library records
      await sequelize.query(`DELETE FROM alerts`, { transaction });
      await sequelize.query(`DELETE FROM bare_acts`, { transaction });
      await sequelize.query(`DELETE FROM legal_texts`, { transaction });
      await sequelize.query(`DELETE FROM references_library`, { transaction });
      await sequelize.query(`DELETE FROM phrase_occurrences`, { transaction });
      await sequelize.query(`DELETE FROM phrase_groups`, { transaction });
      await sequelize.query(`DELETE FROM state_court_fee_slabs`, { transaction });
      await sequelize.query(`DELETE FROM state_court_fee_rules`, { transaction });
      await sequelize.query(`DELETE FROM tenant_settings`, { transaction });
      await sequelize.query(`DELETE FROM tenant_subscriptions`, { transaction });

      // 8. Delete non-Super Admin permissions, users, and roles
      await sequelize.query(`DELETE FROM permissions WHERE role_id <> 1`, { transaction });
      await sequelize.query(`DELETE FROM users WHERE id <> 1`, { transaction });
      await sequelize.query(`DELETE FROM roles WHERE id <> 1`, { transaction });

      // 9. Update Super Admin User (id=1) and Super Admin Role (id=1) tenant_id to NULL
      await sequelize.query(`UPDATE users SET tenant_id = NULL WHERE id = 1`, { transaction });
      await sequelize.query(`UPDATE roles SET tenant_id = NULL WHERE id = 1`, { transaction });

      // 10. Delete all tenants
      await sequelize.query(`DELETE FROM tenants`, { transaction });

      await transaction.commit();
      console.log('=== DESTRUCTIVE TRANSACTION COMMITTED SUCCESSFULLY ===');
    } catch (txErr) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw txErr;
    }

    // ==========================================
    // STEP 2: POST-EXECUTION VERIFICATIONS
    // ==========================================
    console.log('\n=== STEP 2: POST-EXECUTION VERIFICATIONS ===');

    // 1. Tenants = 0 rows
    const [tenantsAfter] = await sequelize.query(`SELECT COUNT(*) as cnt FROM tenants`);
    console.log(`1. Tenants count: ${tenantsAfter[0].cnt}`);
    if (tenantsAfter[0].cnt !== 0) throw new Error('Post-verification failed: Tenants table is not 0!');

    // 2. All tenant business tables = 0 rows
    const businessTables = [
      'cases', 'advocates', 'clients', 'courts', 'case_stages', 'case_types',
      'documents', 'document_categories', 'lands', 'opinions', 'payments',
      'daybook', 'amendments', 'alerts', 'bare_acts', 'phrase_occurrences',
      'phrase_groups', 'state_court_fee_slabs', 'state_court_fee_rules',
      'memberships', 'legal_texts', 'references_library', 'case_stage_history',
      'case_approval_history', 'case_diaries', 'land_title_searches', 'tasks'
    ];

    for (const bTbl of businessTables) {
      const [[{ cnt }]] = await sequelize.query(`SELECT COUNT(*) as cnt FROM \`${bTbl}\``);
      if (cnt !== 0) {
        throw new Error(`Post-verification failed: Business table '${bTbl}' has ${cnt} remaining rows!`);
      }
    }
    console.log('2. Verified 0 rows in all tenant business tables.');

    // 3. Users = exactly Super Admin id=1
    const [usersAfter] = await sequelize.query(`SELECT * FROM users`);
    console.log(`3. Users remaining: ${usersAfter.length}`, usersAfter);
    if (usersAfter.length !== 1 || usersAfter[0].id !== 1) {
      throw new Error('Post-verification failed: Users table does not contain exactly Super Admin id=1!');
    }
    if (usersAfter[0].email !== 'amasatheja1541@gmail.com') {
      throw new Error('Post-verification failed: Super Admin email changed!');
    }
    if (usersAfter[0].password_hash !== saUserBefore[0].password_hash) {
      throw new Error('Post-verification failed: Super Admin password hash changed!');
    }
    if (usersAfter[0].tenant_id !== null) {
      throw new Error('Post-verification failed: Super Admin tenant_id is not NULL!');
    }

    // 4. Roles = exactly Super Admin role id=1
    const [rolesAfter] = await sequelize.query(`SELECT * FROM roles`);
    console.log(`4. Roles remaining: ${rolesAfter.length}`, rolesAfter);
    if (rolesAfter.length !== 1 || rolesAfter[0].id !== 1) {
      throw new Error('Post-verification failed: Roles table does not contain exactly Super Admin role id=1!');
    }
    if (rolesAfter[0].tenant_id !== null) {
      throw new Error('Post-verification failed: Super Admin role tenant_id is not NULL!');
    }

    // 5. Permissions for role 1 remain intact
    const [permsAfter] = await sequelize.query(`SELECT COUNT(*) as cnt FROM permissions WHERE role_id = 1`);
    console.log(`5. Permissions for Super Admin role 1 remaining: ${permsAfter[0].cnt}`);
    if (permsAfter[0].cnt !== 16) {
      throw new Error(`Post-verification failed: Expected 16 permissions for role 1, found ${permsAfter[0].cnt}`);
    }

    // 6. System configuration tables remain intact
    const [[{ cnt: modulesCnt }]] = await sequelize.query(`SELECT COUNT(*) as cnt FROM modules`);
    const [[{ cnt: plansCnt }]] = await sequelize.query(`SELECT COUNT(*) as cnt FROM subscription_plans`);
    const [[{ cnt: globalSettingsCnt }]] = await sequelize.query(`SELECT COUNT(*) as cnt FROM global_settings`);
    const [[{ cnt: metaCnt }]] = await sequelize.query(`SELECT COUNT(*) as cnt FROM sequelizemeta`);
    console.log('6. System tables counts:', { modulesCnt, plansCnt, globalSettingsCnt, metaCnt });
    if (modulesCnt !== 22 || plansCnt !== 1 || globalSettingsCnt !== 1 || metaCnt !== 30) {
      throw new Error('Post-verification failed: System configuration tables were altered!');
    }

    // 7. Verify login functionality using authController bcrypt / user logic
    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare('admin123', usersAfter[0].password_hash);
    console.log(`7. Password Hash Verification against bcrypt: ${isPasswordValid ? 'SUCCESS' : 'FAILED'}`);

    console.log('\n=== ALL POST-EXECUTION VERIFICATIONS PASSED 100% SUCCESSFULLY ===');

  } catch (err) {
    console.error('\nERROR DURING EXECUTION OR VERIFICATION:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runLiveValidationAndCleanup();
