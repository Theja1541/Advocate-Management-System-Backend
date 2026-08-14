'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.createTable('legal_texts', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        tenant_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        content: {
          type: Sequelize.TEXT('long'),
          allowNull: false,
        },
        category: {
          type: Sequelize.STRING(50),
          allowNull: false,
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
      });
    } catch (e) {}

    try { await queryInterface.addIndex('legal_texts', ['tenant_id']); } catch (e) {}
    try { await queryInterface.addIndex('legal_texts', ['category']); } catch (e) {}
  },

  down: async (queryInterface, Sequelize) => {
    try { await queryInterface.dropTable('legal_texts'); } catch (e) {}
  }
};
