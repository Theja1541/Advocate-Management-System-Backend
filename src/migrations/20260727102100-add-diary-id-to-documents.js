'use strict';

/** Adds documents.diary_id to link files directly to case diary entries. */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const table = await queryInterface.describeTable('documents');
      if (!table.diary_id) {
        await queryInterface.addColumn('documents', 'diary_id', {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: 'case_diaries',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        });
      }
    } catch (err) {
      // Table does not exist in target database, skip
    }
  },

  async down(queryInterface) {
    try {
      const table = await queryInterface.describeTable('documents');
      if (table.diary_id) {
        await queryInterface.removeColumn('documents', 'diary_id');
      }
    } catch (err) {
      // Table does not exist in target database, skip
    }
  },
};



