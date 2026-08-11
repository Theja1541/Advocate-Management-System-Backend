'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('opinions', 'land_id');
  }
};
