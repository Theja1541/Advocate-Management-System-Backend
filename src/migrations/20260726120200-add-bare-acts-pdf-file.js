'use strict';

/** Adds bare_acts.pdf_file for static library PDF filenames. */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('bare_acts');
    if (!table.pdf_file) {
      await queryInterface.addColumn('bare_acts', 'pdf_file', {
        type: Sequelize.STRING(120),
        allowNull: true,
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE bare_acts
      SET pdf_file = CONCAT(abbreviation, '.pdf')
      WHERE pdf_file IS NULL OR pdf_file = ''
    `);
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('bare_acts');
    if (table.pdf_file) {
      await queryInterface.removeColumn('bare_acts', 'pdf_file');
    }
  },
};
