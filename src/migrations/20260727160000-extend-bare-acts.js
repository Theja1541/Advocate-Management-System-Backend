'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('bare_acts');

    const newColumns = {
      pdf_original_name: { type: Sequelize.STRING(255), allowNull: true },
      pdf_storage_name: { type: Sequelize.STRING(255), allowNull: true },
      pdf_storage_path: { type: Sequelize.STRING(255), allowNull: true },
      pdf_size: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      mime_type: { type: Sequelize.STRING(100), allowNull: true },
      file_hash: { type: Sequelize.STRING(64), allowNull: true },
      version_number: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 1 },
      is_current: { type: Sequelize.BOOLEAN, defaultValue: true },
      uploaded_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      uploaded_at: { type: Sequelize.DATE, allowNull: true },
      created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    };

    for (const [colName, colConfig] of Object.entries(newColumns)) {
      if (!table[colName]) {
        await queryInterface.addColumn('bare_acts', colName, colConfig);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('bare_acts');
    const colsToRemove = [
      'pdf_original_name',
      'pdf_storage_name',
      'pdf_storage_path',
      'pdf_size',
      'mime_type',
      'file_hash',
      'version_number',
      'is_current',
      'uploaded_by',
      'uploaded_at',
      'created_by',
      'updated_by',
      'deleted_by',
      'deleted_at',
    ];

    for (const colName of colsToRemove) {
      if (table[colName]) {
        await queryInterface.removeColumn('bare_acts', colName);
      }
    }
  },
};
