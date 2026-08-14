'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const table = await queryInterface.describeTable('lands');
      const cols = [
        ['sub_division_no', Sequelize.STRING(50)],
        ['sro', Sequelize.STRING(100)],
        ['registration_district', Sequelize.STRING(100)],
        ['document_no', Sequelize.STRING(50)],
        ['document_year', Sequelize.INTEGER],
        ['registration_date', Sequelize.DATEONLY],
        ['acquisition_type', Sequelize.STRING(50)],
        ['current_owner_name', Sequelize.STRING(150)],
        ['remarks', Sequelize.TEXT],
      ];

      for (const [colName, colType] of cols) {
        if (!table[colName]) {
          await queryInterface.addColumn('lands', colName, {
            type: colType,
            allowNull: true,
          });
        }
      }
    } catch (err) {}
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const table = await queryInterface.describeTable('lands');
      const colNames = [
        'sub_division_no', 'sro', 'registration_district', 'document_no',
        'document_year', 'registration_date', 'acquisition_type',
        'current_owner_name', 'remarks'
      ];
      for (const colName of colNames) {
        if (table[colName]) {
          await queryInterface.removeColumn('lands', colName);
        }
      }
    } catch (err) {}
  }
};
