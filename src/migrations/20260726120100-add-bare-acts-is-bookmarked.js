'use strict';

/** Adds bare_acts.is_bookmarked for library bookmark toggles. */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('bare_acts');
    if (!table.is_bookmarked) {
      await queryInterface.addColumn('bare_acts', 'is_bookmarked', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('bare_acts');
    if (table.is_bookmarked) {
      await queryInterface.removeColumn('bare_acts', 'is_bookmarked');
    }
  },
};
