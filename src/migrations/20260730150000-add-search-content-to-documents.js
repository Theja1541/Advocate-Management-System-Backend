'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const table = await queryInterface.describeTable('documents');
      if (!table.search_content) {
        await queryInterface.addColumn('documents', 'search_content', {
          type: Sequelize.TEXT('long'),
          allowNull: true,
        });
      }
    } catch (err) {
      // Table does not exist in target database, skip
    }
  },

  async down(queryInterface) {
    try {
      const table = await queryInterface.describeTable('documents');
      if (table.search_content) {
        await queryInterface.removeColumn('documents', 'search_content');
      }
    } catch (err) {
      // Table does not exist in target database, skip
    }
  },
};
