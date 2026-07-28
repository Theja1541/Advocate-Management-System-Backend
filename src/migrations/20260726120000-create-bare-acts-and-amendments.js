'use strict';

/** Creates bare_acts and amendments tables for the legal library. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bare_acts', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      abbreviation: {
        type: Sequelize.STRING(40),
        allowNull: false,
        unique: true,
      },
      effective_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      type: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sections_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      is_bookmarked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pdf_file: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('bare_acts', ['name']);
    await queryInterface.addIndex('bare_acts', ['type']);

    await queryInterface.createTable('amendments', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      source_act: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      target_act: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      old_section: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      old_title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      new_section: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      new_title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      effective_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('amendments', ['source_act']);
    await queryInterface.addIndex('amendments', ['target_act']);
    await queryInterface.addIndex('amendments', ['old_section']);
    await queryInterface.addIndex('amendments', ['new_section']);
    await queryInterface.addIndex('amendments', ['effective_date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('amendments');
    await queryInterface.dropTable('bare_acts');
  },
};
