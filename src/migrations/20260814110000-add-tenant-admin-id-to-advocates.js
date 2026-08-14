'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('advocates');
    if (!tableInfo.tenant_admin_id) {
      await queryInterface.addColumn('advocates', 'tenant_admin_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('advocates');
    if (tableInfo.tenant_admin_id) {
      await queryInterface.removeColumn('advocates', 'tenant_admin_id');
    }
  }
};
