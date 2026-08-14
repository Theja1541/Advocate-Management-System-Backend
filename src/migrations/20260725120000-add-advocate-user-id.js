'use strict';

/** Adds advocates.user_id so roster records can link to login users. */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const table = await queryInterface.describeTable('advocates');
      if (!table.user_id) {
        await queryInterface.addColumn('advocates', 'user_id', {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          unique: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        });
      }
    } catch (err) {
      // Table does not exist in target database, skip
    }
  },

  async down(queryInterface) {
    try {
      const table = await queryInterface.describeTable('advocates');
      if (table.user_id) {
        await queryInterface.removeColumn('advocates', 'user_id');
      }
    } catch (err) {
      // Table does not exist in target database, skip
    }
  },
};



