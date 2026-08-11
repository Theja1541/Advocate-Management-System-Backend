'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('opinions');

    // 1. Make issue_date nullable
    if (table.issue_date) {
      await queryInterface.changeColumn('opinions', 'issue_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }

    // 2. Add status column
    if (!table.status) {
      await queryInterface.addColumn('opinions', 'status', {
        type: Sequelize.ENUM('draft', 'pending_review', 'approved', 'rejected', 'issued'),
        allowNull: false,
        defaultValue: 'draft',
      });
    }

    // 3. Add approved_by column pointing to users.id (which is INTEGER.UNSIGNED)
    if (!table.approved_by) {
      await queryInterface.addColumn('opinions', 'approved_by', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    // 4. Add approval_date column
    if (!table.approval_date) {
      await queryInterface.addColumn('opinions', 'approval_date', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    // 5. Add issued_by column pointing to users.id (which is INTEGER.UNSIGNED)
    if (!table.issued_by) {
      await queryInterface.addColumn('opinions', 'issued_by', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    // 6. Add reject_reason column
    if (!table.reject_reason) {
      await queryInterface.addColumn('opinions', 'reject_reason', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // 7. Add index on status
    try {
      await queryInterface.addIndex('opinions', ['status']);
    } catch (e) {
      // ignore if index already exists
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('opinions');

    // Remove index
    try {
      await queryInterface.removeIndex('opinions', ['status']);
    } catch (e) {
      // ignore
    }

    // Remove columns
    if (table.reject_reason) await queryInterface.removeColumn('opinions', 'reject_reason');
    if (table.issued_by) await queryInterface.removeColumn('opinions', 'issued_by');
    if (table.approval_date) await queryInterface.removeColumn('opinions', 'approval_date');
    if (table.approved_by) await queryInterface.removeColumn('opinions', 'approved_by');
    if (table.status) await queryInterface.removeColumn('opinions', 'status');

    // Make issue_date NOT NULL again
    if (table.issue_date) {
      await queryInterface.changeColumn('opinions', 'issue_date', {
        type: Sequelize.DATEONLY,
        allowNull: false,
      });
    }
  },
};
