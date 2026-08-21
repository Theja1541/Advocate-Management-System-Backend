'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'mfa_otp_hash', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    
    await queryInterface.addColumn('users', 'mfa_otp_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    
    await queryInterface.addColumn('users', 'mfa_otp_attempts', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    
    await queryInterface.addColumn('users', 'mfa_otp_last_sent_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'mfa_otp_hash');
    await queryInterface.removeColumn('users', 'mfa_otp_expires_at');
    await queryInterface.removeColumn('users', 'mfa_otp_attempts');
    await queryInterface.removeColumn('users', 'mfa_otp_last_sent_at');
  }
};