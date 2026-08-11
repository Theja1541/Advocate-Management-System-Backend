'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('land_title_searches', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      land_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'lands',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      search_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_from: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_to: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      ec_status: {
        type: Sequelize.ENUM('clear', 'noted', 'pending'),
        defaultValue: 'clear',
        allowNull: false,
      },
      ec_reference_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      revenue_records_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      registration_records_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      litigation_checked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      documents_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      conducted_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('land_title_searches', ['tenant_id']);
    await queryInterface.addIndex('land_title_searches', ['land_id']);
    await queryInterface.addIndex('land_title_searches', ['conducted_by']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('land_title_searches');
  },
};
