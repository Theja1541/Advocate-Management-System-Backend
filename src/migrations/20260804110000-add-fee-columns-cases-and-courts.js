'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const courtsTable = await queryInterface.describeTable('courts');
      if (!courtsTable.state_code) {
        await queryInterface.addColumn('courts', 'state_code', {
          type: Sequelize.STRING(10),
          allowNull: true,
          after: 'location'
        });
      }
    } catch (err) {
      // Table 'courts' does not exist yet
    }

    try {
      const casesTable = await queryInterface.describeTable('cases');
      if (!casesTable.suit_value) {
        await queryInterface.addColumn('cases', 'suit_value', {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        });
      }
      if (!casesTable.fee_percentage) {
        await queryInterface.addColumn('cases', 'fee_percentage', {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
        });
      }
      if (!casesTable.advocate_fee) {
        await queryInterface.addColumn('cases', 'advocate_fee', {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        });
      }
      if (!casesTable.court_fee) {
        await queryInterface.addColumn('cases', 'court_fee', {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        });
      }
      if (!casesTable.process_fee) {
        await queryInterface.addColumn('cases', 'process_fee', {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        });
      }
      if (!casesTable.filing_fee) {
        await queryInterface.addColumn('cases', 'filing_fee', {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        });
      }
      if (!casesTable.misc_charges) {
        await queryInterface.addColumn('cases', 'misc_charges', {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        });
      }
      if (!casesTable.total_payable) {
        await queryInterface.addColumn('cases', 'total_payable', {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        });
      }
      if (!casesTable.fee_calculation_status) {
        await queryInterface.addColumn('cases', 'fee_calculation_status', {
          type: Sequelize.STRING(20),
          allowNull: true,
        });
      }
    } catch (err) {
      // Table 'cases' does not exist yet
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const courtsTable = await queryInterface.describeTable('courts');
      if (courtsTable.state_code) {
        await queryInterface.removeColumn('courts', 'state_code');
      }
    } catch (err) {}

    try {
      const casesTable = await queryInterface.describeTable('cases');
      if (casesTable.suit_value) await queryInterface.removeColumn('cases', 'suit_value');
      if (casesTable.fee_percentage) await queryInterface.removeColumn('cases', 'fee_percentage');
      if (casesTable.advocate_fee) await queryInterface.removeColumn('cases', 'advocate_fee');
      if (casesTable.court_fee) await queryInterface.removeColumn('cases', 'court_fee');
      if (casesTable.process_fee) await queryInterface.removeColumn('cases', 'process_fee');
      if (casesTable.filing_fee) await queryInterface.removeColumn('cases', 'filing_fee');
      if (casesTable.misc_charges) await queryInterface.removeColumn('cases', 'misc_charges');
      if (casesTable.total_payable) await queryInterface.removeColumn('cases', 'total_payable');
      if (casesTable.fee_calculation_status) await queryInterface.removeColumn('cases', 'fee_calculation_status');
    } catch (err) {}
  }
};
