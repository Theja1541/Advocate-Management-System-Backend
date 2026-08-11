'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Drop old tables if they exist
    await queryInterface.dropTable('legal_text_keywords').catch(() => {});
    await queryInterface.dropTable('keywords').catch(() => {});

    // 2. Create phrase_groups table
    await queryInterface.createTable('phrase_groups', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      tenant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      phrase: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('phrase_groups', ['tenant_id', 'phrase'], {
      unique: true,
      name: 'idx_phrase_groups_tenant_phrase'
    });

    // 3. Create phrase_occurrences table
    await queryInterface.createTable('phrase_occurrences', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      tenant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      phrase_group_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'phrase_groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      source_type: {
        type: Sequelize.ENUM('LegalText', 'Document', 'CaseDiary', 'Opinion'),
        allowNull: false
      },
      source_id: {
        type: Sequelize.BIGINT, // Using BIGINT to support Document, CaseDiary, Opinion which use BIGINT. LegalText is INT, but BIGINT fits all.
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('phrase_occurrences', ['phrase_group_id', 'source_type', 'source_id'], {
      unique: true,
      name: 'idx_phrase_occurrences_group_source'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('phrase_occurrences');
    await queryInterface.dropTable('phrase_groups');
  }
};
