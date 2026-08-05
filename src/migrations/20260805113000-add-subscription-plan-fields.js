'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('subscription_plans', 'description', {
        type: Sequelize.TEXT,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('subscription_plans', 'is_trial', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }, { transaction });

      await queryInterface.addColumn('subscription_plans', 'trial_days', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('subscription_plans', 'display_order', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      console.log('Columns might already exist:', err.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('subscription_plans', 'description', { transaction });
      await queryInterface.removeColumn('subscription_plans', 'is_trial', { transaction });
      await queryInterface.removeColumn('subscription_plans', 'trial_days', { transaction });
      await queryInterface.removeColumn('subscription_plans', 'display_order', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
    }
  }
};
