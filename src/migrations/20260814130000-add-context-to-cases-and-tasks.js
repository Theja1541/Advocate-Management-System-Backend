'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('cases', 'context_type', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn('cases', 'context_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    await queryInterface.addColumn('tasks', 'context_type', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn('tasks', 'context_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('cases', 'context_type');
    await queryInterface.removeColumn('cases', 'context_id');
    await queryInterface.removeColumn('tasks', 'context_type');
    await queryInterface.removeColumn('tasks', 'context_id');
  }
};
