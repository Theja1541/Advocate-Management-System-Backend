'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create courts table
    try {
      await queryInterface.createTable('courts', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        code: {
          type: Sequelize.STRING(30),
          allowNull: false,
          unique: true,
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        location: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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

    // 2. Seed initial courts data
    try {
      const defaultCourts = [
        { code: 'SCJ_MDP', name: 'Sr. Civil Judge Court, Madanapalle', location: 'Madanapalle' },
        { code: 'JCJ_PLR', name: 'Jr. Civil Judge Court, Pileru', location: 'Pileru' },
        { code: 'PDC_TPT', name: 'Principal District Court, Tirupati', location: 'Tirupati' },
        { code: 'DC_CTR', name: 'District Court, Chittoor', location: 'Chittoor' },
        { code: 'HC_AP', name: 'High Court of A.P., Amaravati', location: 'Amaravati' },
      ].map(c => ({
        ...c,
        is_active: true,
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      }));

      await queryInterface.bulkInsert('courts', defaultCourts);
    } catch (e) {}

    // 3. Add court_id column to cases table
    try {
      const casesTable = await queryInterface.describeTable('cases');
      if (!casesTable.court_id) {
        await queryInterface.addColumn('cases', 'court_id', {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
        });
      }
    } catch (e) {}

    // Add constraint
    try {
      await queryInterface.addConstraint('cases', {
        fields: ['court_id'],
        type: 'foreign key',
        name: 'fk_cases_court_id',
        references: {
          table: 'courts',
          field: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    } catch (e) {}

    // 4. Migrate existing case record court strings to court_id mapping
    try {
      const [cases] = await queryInterface.sequelize.query(
        `SELECT id, court FROM cases`
      );

      const [dbCourts] = await queryInterface.sequelize.query(
        `SELECT id, name FROM courts`
      );

      for (const caseRec of cases) {
        if (!caseRec.court) continue;
        const matchedCourt = dbCourts.find(
          c => c.name.toLowerCase().trim() === caseRec.court.toLowerCase().trim()
        );
        if (matchedCourt) {
          await queryInterface.sequelize.query(
            `UPDATE cases SET court_id = :courtId WHERE id = :caseId`,
            {
              replacements: { courtId: matchedCourt.id, caseId: caseRec.id }
            }
          );
        }
      }
    } catch (e) {}
  },

  down: async (queryInterface, Sequelize) => {
    try { await queryInterface.removeConstraint('cases', 'fk_cases_court_id'); } catch (e) {}
    try { await queryInterface.removeColumn('cases', 'court_id'); } catch (e) {}
    try { await queryInterface.dropTable('courts'); } catch (e) {}
  }
};
