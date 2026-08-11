'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Modify case_id to allow NULL with foreign key checks temporarily disabled, matching database type (INT UNSIGNED)
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await queryInterface.sequelize.query('ALTER TABLE documents MODIFY case_id INT UNSIGNED NULL;');
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    // 2. Add land_id column pointing to lands.id (which is BIGINT)
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

    // 3. Add index on land_id
    await queryInterface.addIndex('documents', ['land_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Remove index
    await queryInterface.removeIndex('documents', ['land_id']);

    // 2. Remove land_id column
    await queryInterface.removeColumn('documents', 'land_id');

    // 3. Re-constrain case_id to NOT NULL
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await queryInterface.sequelize.query('ALTER TABLE documents MODIFY case_id INT UNSIGNED NOT NULL;');
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
  },
};
