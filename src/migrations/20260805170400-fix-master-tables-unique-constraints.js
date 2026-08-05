'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = ['case_types', 'case_stages', 'courts', 'document_categories'];

    for (const table of tables) {
      // Sequelize by default creates unique constraints with the column name or a specific format
      // We will try a few common names
      const constraintNames = [
        'code',
        `${table}_code_uk`,
        `${table}_code_unique`
      ];

      for (const name of constraintNames) {
        try {
          await queryInterface.removeConstraint(table, name);
        } catch (e) {
          // Ignore if it doesn't exist
        }
        try {
          await queryInterface.removeIndex(table, name);
        } catch (e) {
          // Ignore
        }
      }

      // Add the new composite unique index
      try {
        await queryInterface.addIndex(table, ['tenant_id', 'code'], {
          unique: true,
          name: `${table}_tenant_code_unique`
        });
      } catch (e) {
        console.error(`Error adding index to ${table}:`, e.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tables = ['case_types', 'case_stages', 'courts', 'document_categories'];
    for (const table of tables) {
      try {
        await queryInterface.removeIndex(table, `${table}_tenant_code_unique`);
      } catch (e) {
        // Ignore
      }
    }
  }
};
