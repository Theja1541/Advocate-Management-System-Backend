'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('lands', 'sub_division_no', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn('lands', 'sro', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('lands', 'registration_district', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('lands', 'document_no', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn('lands', 'document_year', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('lands', 'registration_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('lands', 'acquisition_type', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn('lands', 'current_owner_name', {
      type: Sequelize.STRING(150),
      allowNull: true,
    });
    await queryInterface.addColumn('lands', 'remarks', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('lands', 'sub_division_no');
    await queryInterface.removeColumn('lands', 'sro');
    await queryInterface.removeColumn('lands', 'registration_district');
    await queryInterface.removeColumn('lands', 'document_no');
    await queryInterface.removeColumn('lands', 'document_year');
    await queryInterface.removeColumn('lands', 'registration_date');
    await queryInterface.removeColumn('lands', 'acquisition_type');
    await queryInterface.removeColumn('lands', 'current_owner_name');
    await queryInterface.removeColumn('lands', 'remarks');
  }
};
