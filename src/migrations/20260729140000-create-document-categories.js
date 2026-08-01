'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Create document_categories table
      await queryInterface.createTable('document_categories', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        code: {
          type: Sequelize.STRING(30),
          allowNull: false,
          unique: true,
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        display_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        created_by: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
        },
        updated_by: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      }, { transaction });

      // 2. Seed initial categories (28 default legal categories)
      const categories = [
        { code: 'PETN', name: 'Petitions', display_order: 1 },
        { code: 'AFFD', name: 'Affidavits', display_order: 2 },
        { code: 'ORDR', name: 'Orders', display_order: 3 },
        { code: 'JDGM', name: 'Judgments', display_order: 4 },
        { code: 'EVID', name: 'Evidence', display_order: 5 },
        { code: 'CLDOC', name: 'Client Documents', display_order: 6 },
        { code: 'AGRE', name: 'Agreements', display_order: 7 },
        { code: 'NOTC', name: 'Notices', display_order: 8 },
        { code: 'SUMN', name: 'Summons', display_order: 9 },
        { code: 'VKLN', name: 'Vakalatnama', display_order: 10 },
        { code: 'WS', name: 'Written Statements', display_order: 11 },
        { code: 'CAFF', name: 'Counter Affidavits', display_order: 12 },
        { code: 'REJ', name: 'Rejoinders', display_order: 13 },
        { code: 'MEMO', name: 'Memo', display_order: 14 },
        { code: 'APPL', name: 'Applications', display_order: 15 },
        { code: 'IA', name: 'Interlocutory Applications (IA)', display_order: 16 },
        { code: 'EXHB', name: 'Exhibits', display_order: 17 },
        { code: 'FIR', name: 'FIR', display_order: 18 },
        { code: 'CSHT', name: 'Charge Sheet', display_order: 19 },
        { code: 'WSTMT', name: 'Witness Statements', display_order: 20 },
        { code: 'LNOTC', name: 'Legal Notices', display_order: 21 },
        { code: 'SDEED', name: 'Sale Deeds', display_order: 22 },
        { code: 'GDEED', name: 'Gift Deeds', display_order: 23 },
        { code: 'POA', name: 'Power of Attorney', display_order: 24 },
        { code: 'CCOPY', name: 'Certified Copies', display_order: 25 },
        { code: 'CREC', name: 'Court Receipts', display_order: 26 },
        { code: 'FREC', name: 'Fee Receipts', display_order: 27 },
        { code: 'MISC', name: 'Miscellaneous', display_order: 28 },
      ].map((cat) => ({
        ...cat,
        is_active: true,
        is_system: true,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      await queryInterface.bulkInsert('document_categories', categories, { transaction });

      // 3. Add document_category_id to documents table
      await queryInterface.addColumn('documents', 'document_category_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      }, { transaction });

      // 4. Add Foreign Key Constraint mapping documents -> document_categories
      await queryInterface.addConstraint('documents', {
        fields: ['document_category_id'],
        type: 'foreign key',
        name: 'fk_documents_document_category_id',
        references: {
          table: 'document_categories',
          field: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }, { transaction });

      // 5. Migrate existing documents' text category values to document_category_id mapping
      const [existingDocs] = await queryInterface.sequelize.query(
        `SELECT id, category FROM documents`,
        { transaction }
      );

      const [dbCategories] = await queryInterface.sequelize.query(
        `SELECT id, name FROM document_categories`,
        { transaction }
      );

      for (const doc of existingDocs) {
        if (!doc.category) continue;
        const matchedCategory = dbCategories.find(
          (c) => c.name.toLowerCase().trim() === doc.category.toLowerCase().trim()
        );
        if (matchedCategory) {
          await queryInterface.sequelize.query(
            `UPDATE documents SET document_category_id = :catId WHERE id = :docId`,
            {
              replacements: { catId: matchedCategory.id, docId: doc.id },
              transaction,
            }
          );
        } else {
          // Default to Miscellaneous if not matched
          const miscCat = dbCategories.find((c) => c.name === 'Miscellaneous');
          if (miscCat) {
            await queryInterface.sequelize.query(
              `UPDATE documents SET document_category_id = :catId WHERE id = :docId`,
              {
                replacements: { catId: miscCat.id, docId: doc.id },
                transaction,
              }
            );
          }
        }
      }

      // 6. Remove old category text column from documents table
      await queryInterface.removeColumn('documents', 'category', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Re-add category column to documents table
      await queryInterface.addColumn('documents', 'category', {
        type: Sequelize.STRING(50),
        allowNull: true,
      }, { transaction });

      // Map back
      const [existingDocs] = await queryInterface.sequelize.query(
        `SELECT id, document_category_id FROM documents`,
        { transaction }
      );

      const [dbCategories] = await queryInterface.sequelize.query(
        `SELECT id, name FROM document_categories`,
        { transaction }
      );

      for (const doc of existingDocs) {
        if (!doc.document_category_id) continue;
        const matchedCategory = dbCategories.find(
          (c) => c.id === doc.document_category_id
        );
        if (matchedCategory) {
          await queryInterface.sequelize.query(
            `UPDATE documents SET category = :catName WHERE id = :docId`,
            {
              replacements: { catName: matchedCategory.name, docId: doc.id },
              transaction,
            }
          );
        }
      }

      await queryInterface.removeConstraint('documents', 'fk_documents_document_category_id', { transaction });
      await queryInterface.removeColumn('documents', 'document_category_id', { transaction });
      await queryInterface.dropTable('document_categories', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
