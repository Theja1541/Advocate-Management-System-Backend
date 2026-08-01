'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('documents');
    if (!table.search_content) {
      await queryInterface.addColumn('documents', 'search_content', {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('documents');
    if (table.search_content) {
      await queryInterface.removeColumn('documents', 'search_content');
    }
  },
};
