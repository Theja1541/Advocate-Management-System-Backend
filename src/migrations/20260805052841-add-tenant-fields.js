'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('tenants');
    const transaction = await queryInterface.sequelize.transaction();
    try {
      if (!tableInfo.address) {
        await queryInterface.addColumn('tenants', 'address', {
          type: Sequelize.STRING(500),
          allowNull: true,
        }, { transaction });
      }
      if (!tableInfo.city) {
        await queryInterface.addColumn('tenants', 'city', {
          type: Sequelize.STRING(100),
          allowNull: true,
        }, { transaction });
      }
      if (!tableInfo.state) {
        await queryInterface.addColumn('tenants', 'state', {
          type: Sequelize.STRING(100),
          allowNull: true,
        }, { transaction });
      }
      if (!tableInfo.country) {
        await queryInterface.addColumn('tenants', 'country', {
          type: Sequelize.STRING(100),
          allowNull: true,
        }, { transaction });
      }
      if (!tableInfo.pincode) {
        await queryInterface.addColumn('tenants', 'pincode', {
          type: Sequelize.STRING(20),
          allowNull: true,
        }, { transaction });
      }
      if (!tableInfo.contact_person) {
        await queryInterface.addColumn('tenants', 'contact_person', {
          type: Sequelize.STRING(255),
          allowNull: true,
        }, { transaction });
      }
      if (!tableInfo.website) {
        await queryInterface.addColumn('tenants', 'website', {
          type: Sequelize.STRING(255),
          allowNull: true,
        }, { transaction });
      }
      if (!tableInfo.gst_number) {
        await queryInterface.addColumn('tenants', 'gst_number', {
          type: Sequelize.STRING(100),
          allowNull: true,
        }, { transaction });
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('tenants', 'address', { transaction });
      await queryInterface.removeColumn('tenants', 'city', { transaction });
      await queryInterface.removeColumn('tenants', 'state', { transaction });
      await queryInterface.removeColumn('tenants', 'country', { transaction });
      await queryInterface.removeColumn('tenants', 'pincode', { transaction });
      await queryInterface.removeColumn('tenants', 'contact_person', { transaction });
      await queryInterface.removeColumn('tenants', 'website', { transaction });
      await queryInterface.removeColumn('tenants', 'gst_number', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
