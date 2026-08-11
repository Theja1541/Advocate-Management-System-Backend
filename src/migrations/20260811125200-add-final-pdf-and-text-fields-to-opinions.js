'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('opinions');

    // 1. Add recommendation column
    if (!table.recommendation) {
      await queryInterface.addColumn('opinions', 'recommendation', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // 2. Add limitations column
    if (!table.limitations) {
      await queryInterface.addColumn('opinions', 'limitations', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // 3. Add document_id column pointing to documents.id
    if (!table.document_id) {
      await queryInterface.addColumn('opinions', 'document_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'documents',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    // 4. Add index on document_id
    try {
      await queryInterface.addIndex('opinions', ['document_id']);
    } catch (e) {
      // ignore if index already exists
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('opinions');

    // Remove index
    try {
      await queryInterface.removeIndex('opinions', ['document_id']);
    } catch (e) {
      // ignore
    }

    // Remove columns
    if (table.document_id) await queryInterface.removeColumn('opinions', 'document_id');
    if (table.limitations) await queryInterface.removeColumn('opinions', 'limitations');
    if (table.recommendation) await queryInterface.removeColumn('opinions', 'recommendation');
  },
};
