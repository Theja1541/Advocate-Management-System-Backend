'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create Subscription Plans
    try {
      await queryInterface.createTable('subscription_plans', {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        name: { type: Sequelize.STRING(100), allowNull: false },
        code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
        price: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
        billing_cycle: { type: Sequelize.ENUM('monthly', 'yearly', 'lifetime'), allowNull: false, defaultValue: 'monthly' },
        max_users: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
        storage_limit_mb: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1024 },
        features: { type: Sequelize.JSON, allowNull: true },
        status: { type: Sequelize.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      });
    } catch (e) {}

    // 2. Create Tenants
    try {
      await queryInterface.createTable('tenants', {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        name: { type: Sequelize.STRING(255), allowNull: false },
        code: { type: Sequelize.STRING(100), allowNull: true, unique: true },
        email: { type: Sequelize.STRING(255), allowNull: true },
        phone: { type: Sequelize.STRING(50), allowNull: true },
        logo: { type: Sequelize.STRING(255), allowNull: true },
        status: { type: Sequelize.ENUM('active', 'inactive', 'suspended'), allowNull: false, defaultValue: 'active' },
        plan_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'subscription_plans', key: 'id' } },
        subscription_start: { type: Sequelize.DATE, allowNull: true },
        subscription_end: { type: Sequelize.DATE, allowNull: true },
        max_users: { type: Sequelize.INTEGER, allowNull: true },
        storage_limit: { type: Sequelize.INTEGER, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      });
    } catch (e) {}

    // 3. Create Tenant Settings
    try {
      await queryInterface.createTable('tenant_settings', {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        tenant_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'tenants', key: 'id' } },
        key: { type: Sequelize.STRING(100), allowNull: false },
        value: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      });
    } catch (e) {}

    try {
      await queryInterface.addIndex('tenant_settings', ['tenant_id', 'key'], { unique: true });
    } catch (e) {}

    // 4. Create Tenant Subscriptions
    try {
      await queryInterface.createTable('tenant_subscriptions', {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        tenant_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'tenants', key: 'id' } },
        plan_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'subscription_plans', key: 'id' } },
        start_date: { type: Sequelize.DATE, allowNull: false },
        end_date: { type: Sequelize.DATE, allowNull: true },
        amount_paid: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        status: { type: Sequelize.ENUM('active', 'expired', 'cancelled'), allowNull: false, defaultValue: 'active' },
        payment_reference: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      });
    } catch (e) {}

    // Insert Default Plan & Tenant
    try {
      await queryInterface.bulkInsert('subscription_plans', [{
        name: 'Legacy Free Plan',
        code: 'LEGACY_FREE',
        price: 0,
        billing_cycle: 'lifetime',
        max_users: 100,
        storage_limit_mb: 5000,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }]);
    } catch (e) {}

    try {
      await queryInterface.bulkInsert('tenants', [{
        name: 'Legacy Primary Firm',
        code: 'LEGACY',
        status: 'active',
        plan_id: 1,
        subscription_start: new Date(),
        max_users: 100,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    } catch (e) {}

    // 5. Add tenant_id to domain models
    const tables = [
      'amendments', 'bare_acts', 'advocates', 'alerts', 'cases', 'case_stage_history', 'clients', 'daybook',
      'case_diaries', 'documents', 'lands', 'case_stages', 'case_types', 'courts', 'document_categories',
      'state_court_fee_rules', 'state_court_fee_slabs', 'memberships', 'opinions', 'payments', 'references_library', 'tasks',
      'roles', 'users'
    ];

    for (const table of tables) {
      try {
        const tableInfo = await queryInterface.describeTable(table);
        if (!tableInfo.tenant_id) {
          await queryInterface.addColumn(table, 'tenant_id', {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: true,
            references: { model: 'tenants', key: 'id' }
          });
        }

        // Update existing records to the default tenant
        await queryInterface.sequelize.query(`UPDATE ${table} SET tenant_id = 1 WHERE tenant_id IS NULL;`);

        try {
          await queryInterface.addIndex(table, ['tenant_id']);
        } catch (e) {
          // Ignore if index already exists
        }
      } catch (err) {
        // Table does not exist in target database, skip
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tables = [
      'amendments', 'bare_acts', 'advocates', 'alerts', 'cases', 'case_stage_history', 'clients', 'daybook',
      'case_diaries', 'documents', 'lands', 'case_stages', 'case_types', 'courts', 'document_categories',
      'state_court_fee_rules', 'state_court_fee_slabs', 'memberships', 'opinions', 'payments', 'references_library', 'tasks',
      'roles', 'users'
    ];
    for (const table of tables) {
      await queryInterface.removeColumn(table, 'tenant_id');
    }

    await queryInterface.dropTable('tenant_subscriptions');
    await queryInterface.dropTable('tenant_settings');
    await queryInterface.dropTable('tenants');
    await queryInterface.dropTable('subscription_plans');
  }
};
