'use strict';

const hasIndex = async (queryInterface, tableName, indexName) => {
  const indexes = await queryInterface.showIndex(tableName);
  return indexes.some((idx) => idx.name === indexName);
};

module.exports = {
  async up(queryInterface) {
    try {
      if (!(await hasIndex(queryInterface, 'documents', 'idx_documents_case_id_id'))) {
        await queryInterface.addIndex('documents', ['case_id', 'id'], {
          name: 'idx_documents_case_id_id',
        });
      }
    } catch (e) {}

    try {
      if (!(await hasIndex(queryInterface, 'case_diaries', 'idx_case_diaries_case_id_id'))) {
        await queryInterface.addIndex('case_diaries', ['case_id', 'id'], {
          name: 'idx_case_diaries_case_id_id',
        });
      }
    } catch (e) {}

    try {
      if (!(await hasIndex(queryInterface, 'documents', 'ft_documents_search_content'))) {
        await queryInterface.sequelize.query(
          'ALTER TABLE documents ADD FULLTEXT INDEX ft_documents_search_content (search_content)'
        );
      }
    } catch (e) {}

    try {
      if (!(await hasIndex(queryInterface, 'case_diaries', 'ft_case_diaries_note'))) {
        await queryInterface.sequelize.query(
          'ALTER TABLE case_diaries ADD FULLTEXT INDEX ft_case_diaries_note (note)'
        );
      }
    } catch (e) {}
  },

  async down(queryInterface) {
    try {
      if (await hasIndex(queryInterface, 'case_diaries', 'ft_case_diaries_note')) {
        await queryInterface.sequelize.query(
          'ALTER TABLE case_diaries DROP INDEX ft_case_diaries_note'
        );
      }
    } catch (e) {}

    try {
      if (await hasIndex(queryInterface, 'documents', 'ft_documents_search_content')) {
        await queryInterface.sequelize.query(
          'ALTER TABLE documents DROP INDEX ft_documents_search_content'
        );
      }
    } catch (e) {}

    try {
      if (await hasIndex(queryInterface, 'case_diaries', 'idx_case_diaries_case_id_id')) {
        await queryInterface.removeIndex('case_diaries', 'idx_case_diaries_case_id_id');
      }
    } catch (e) {}

    try {
      if (await hasIndex(queryInterface, 'documents', 'idx_documents_case_id_id')) {
        await queryInterface.removeIndex('documents', 'idx_documents_case_id_id');
      }
    } catch (e) {}
  },
};
