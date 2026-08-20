'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('smtp_settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      provider: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'custom'
      },
      sender_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      from_email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      reply_to_email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      smtp_host: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      smtp_port: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 587
      },
      encryption_type: {
        type: Sequelize.ENUM('none', 'ssl', 'tls'),
        allowNull: false,
        defaultValue: 'tls'
      },
      smtp_auth_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      smtp_username: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      smtp_password_encrypted: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      test_status: {
        type: Sequelize.ENUM('pending', 'success', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      last_tested_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_test_result: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      updated_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Enforce only one global SMTP setting
    await queryInterface.addConstraint('smtp_settings', {
      fields: ['is_active'],
      type: 'unique',
      name: 'unique_active_smtp_setting',
      where: {
        is_active: true
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('smtp_settings');
  }
};
