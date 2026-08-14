'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // 1. Modify case_id to allow NULL with foreign key checks temporarily disabled
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
      await queryInterface.sequelize.query('ALTER TABLE documents MODIFY case_id INT UNSIGNED NULL;');
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    } catch (e) {}

    try {
      const table = await queryInterface.describeTable('documents');
      if (!table.land_id) {
        await queryInterface.addColumn('documents', 'land_id', {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: 'lands',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        });
      }
    } catch (e) {}

    try {
      await queryInterface.addIndex('documents', ['land_id']);
    } catch (e) {}
  },

  down: async (queryInterface, Sequelize) => {
    try { await queryInterface.removeIndex('documents', ['land_id']); } catch (e) {}
    try { await queryInterface.removeColumn('documents', 'land_id'); } catch (e) {}
    try {
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
      await queryInterface.sequelize.query('ALTER TABLE documents MODIFY case_id INT UNSIGNED NOT NULL;');
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    } catch (e) {}
  },
};
