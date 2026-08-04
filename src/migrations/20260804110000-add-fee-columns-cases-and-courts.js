'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add state_code to courts table
    await queryInterface.addColumn('courts', 'state_code', {
      type: Sequelize.STRING(10),
      allowNull: true,
      after: 'location'
    });

    // 2. Add fee columns to cases table
    await queryInterface.addColumn('cases', 'suit_value', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('cases', 'fee_percentage', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('cases', 'advocate_fee', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('cases', 'court_fee', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('cases', 'process_fee', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('cases', 'filing_fee', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('cases', 'misc_charges', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('cases', 'total_payable', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('cases', 'fee_calculation_status', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Remove state_code from courts
    await queryInterface.removeColumn('courts', 'state_code');

    // 2. Remove fee columns from cases
    await queryInterface.removeColumn('cases', 'suit_value');
    await queryInterface.removeColumn('cases', 'fee_percentage');
    await queryInterface.removeColumn('cases', 'advocate_fee');
    await queryInterface.removeColumn('cases', 'court_fee');
    await queryInterface.removeColumn('cases', 'process_fee');
    await queryInterface.removeColumn('cases', 'filing_fee');
    await queryInterface.removeColumn('cases', 'misc_charges');
    await queryInterface.removeColumn('cases', 'total_payable');
    await queryInterface.removeColumn('cases', 'fee_calculation_status');
  }
};
