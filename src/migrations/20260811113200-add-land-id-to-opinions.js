'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const table = await queryInterface.describeTable('opinions');
      if (!table.land_id) {
        await queryInterface.addColumn('opinions', 'land_id', {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: 'lands',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
      }
    } catch (err) {}
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const table = await queryInterface.describeTable('opinions');
      if (table.land_id) {
        await queryInterface.removeColumn('opinions', 'land_id');
      }
    } catch (err) {}
  }
};
