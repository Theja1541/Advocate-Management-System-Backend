'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create state_court_fee_rules table
    try {
      await queryInterface.createTable('state_court_fee_rules', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        state_code: {
          type: Sequelize.STRING(10),
          allowNull: false,
        },
        state_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        rule_type: {
          type: Sequelize.ENUM('FIXED', 'PERCENTAGE', 'SLAB'),
          allowNull: false,
          defaultValue: 'PERCENTAGE',
        },
        calculation_mode: {
          type: Sequelize.ENUM('SINGLE_SLAB', 'MARGINAL_CUMULATIVE'),
          allowNull: false,
          defaultValue: 'MARGINAL_CUMULATIVE',
        },
        fixed_amount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0.00,
        },
        percentage_rate: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0.00,
        },
        min_fee: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0.00,
        },
        max_fee: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0.00,
        },
        effective_from: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        effective_to: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        act_name: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        act_version: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        notification_no: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        default_advocate_fee_pct: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 10.00,
        },
        process_fee: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 500.00,
        },
        filing_fee: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 1000.00,
        },
        misc_charges: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 3000.00,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_by: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
        },
        updated_by: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        },
      });
    } catch (e) {}

    try {
      await queryInterface.addIndex('state_court_fee_rules', ['state_code', 'is_active', 'effective_from'], {
        name: 'idx_state_fee_rules_code_active_from',
      });
    } catch (e) {}

    // 2. Create state_court_fee_slabs table
    try {
      await queryInterface.createTable('state_court_fee_slabs', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        rule_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: 'state_court_fee_rules',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        from_amount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0.00,
        },
        to_amount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        },
        fee_type: {
          type: Sequelize.ENUM('FIXED', 'PERCENTAGE'),
          allowNull: false,
          defaultValue: 'PERCENTAGE',
        },
        fee_value: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0.00,
        },
        min_fee: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0.00,
        },
        max_fee: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0.00,
        },
        display_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        },
      });
    } catch (e) {}

    try {
      await queryInterface.addIndex('state_court_fee_slabs', ['rule_id', 'display_order'], {
        name: 'idx_state_fee_slabs_rule_order',
      });
    } catch (e) {}
  },

  down: async (queryInterface, Sequelize) => {
    try { await queryInterface.dropTable('state_court_fee_slabs'); } catch (e) {}
    try { await queryInterface.dropTable('state_court_fee_rules'); } catch (e) {}
  },
};
