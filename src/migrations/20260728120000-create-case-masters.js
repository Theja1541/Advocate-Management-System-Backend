'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Create case_types table
      await queryInterface.createTable('case_types', {
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
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        display_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
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
      }, { transaction });

      // 2. Create case_stages table
      await queryInterface.createTable('case_stages', {
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
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        display_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        color: {
          type: Sequelize.STRING(50),
          allowNull: true,
          defaultValue: '#6B7280',
        },
        is_closed: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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
      }, { transaction });

      // 3. Create case_stage_history table
      await queryInterface.createTable('case_stage_history', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        case_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
        },
        old_stage_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
        },
        new_stage_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
        },
        remarks: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        changed_by: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
        },
        changed_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      }, { transaction });

      // 4. Seed initial case types
      const caseTypes = [
        { code: 'PTN', name: 'Partition Suit', display_order: 1 },
        { code: 'MRS', name: 'Money Recovery Suit', display_order: 2 },
        { code: 'PINJ', name: 'Permanent Injunction', display_order: 3 },
        { code: 'MINJ', name: 'Mandatory Injunction', display_order: 4 },
        { code: 'SPEC', name: 'Specific Performance', display_order: 5 },
        { code: 'DECL', name: 'Declaration Suit', display_order: 6 },
        { code: 'PROP', name: 'Property Dispute', display_order: 7 },
        { code: 'EVICT', name: 'Eviction Suit', display_order: 8 },
        { code: 'EXEC', name: 'Execution Petition', display_order: 9 },
        { code: 'APPL', name: 'Appeal', display_order: 10 },
        { code: 'REV', name: 'Revision Petition', display_order: 11 },
        { code: 'WRIT', name: 'Writ Petition', display_order: 12 },
        { code: 'CONS', name: 'Consumer Complaint', display_order: 13 },
        { code: 'MACT', name: 'Motor Accident Claim', display_order: 14 },
        { code: 'OTHER', name: 'Other', display_order: 15 },
      ].map(t => ({
        ...t,
        description: `${t.name} master data`,
        is_active: true,
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      }));

      await queryInterface.bulkInsert('case_types', caseTypes, { transaction });

      // 5. Seed initial case stages
      const caseStages = [
        { code: 'FIL', name: 'Filing', display_order: 1, color: 'c-baize', is_closed: false },
        { code: 'SCR', name: 'Scrutiny', display_order: 2, color: 'c-brass', is_closed: false },
        { code: 'REG', name: 'Registration', display_order: 3, color: 'c-brass', is_closed: false },
        { code: 'NOT', name: 'Notice Issued', display_order: 4, color: 'c-brass', is_closed: false },
        { code: 'APP', name: 'Appearance', display_order: 5, color: 'c-brass', is_closed: false },
        { code: 'WS', name: 'Written Statement', display_order: 6, color: 'c-brass', is_closed: false },
        { code: 'ISS', name: 'Issues Framed', display_order: 7, color: 'c-brass', is_closed: false },
        { code: 'PE', name: 'Plaintiff Evidence', display_order: 8, color: 'c-baize', is_closed: false },
        { code: 'DE', name: 'Defendant Evidence', display_order: 9, color: 'c-baize', is_closed: false },
        { code: 'ARG', name: 'Arguments', display_order: 10, color: 'c-baize', is_closed: false },
        { code: 'JR', name: 'Judgment Reserved', display_order: 11, color: 'c-brass', is_closed: false },
        { code: 'JP', name: 'Judgment Pronounced', display_order: 12, color: 'c-brass', is_closed: false },
        { code: 'DEC', name: 'Decree', display_order: 13, color: 'c-brass', is_closed: false },
        { code: 'EXE', name: 'Execution', display_order: 14, color: 'c-brass', is_closed: false },
        { code: 'APL', name: 'Appeal', display_order: 15, color: 'c-brass', is_closed: false },
        { code: 'DISP', name: 'Disposed', display_order: 16, color: 'c-grey', is_closed: true },
      ].map(s => ({
        ...s,
        is_active: true,
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      }));

      await queryInterface.bulkInsert('case_stages', caseStages, { transaction });

      // 6. Add case_type_id and case_stage_id to cases table
      await queryInterface.addColumn('cases', 'case_type_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('cases', 'case_stage_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      }, { transaction });

      // Add constraints
      await queryInterface.addConstraint('cases', {
        fields: ['case_type_id'],
        type: 'foreign key',
        name: 'fk_cases_case_type_id',
        references: {
          table: 'case_types',
          field: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }, { transaction });

      await queryInterface.addConstraint('cases', {
        fields: ['case_stage_id'],
        type: 'foreign key',
        name: 'fk_cases_case_stage_id',
        references: {
          table: 'case_stages',
          field: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }, { transaction });

      // 7. Migrate existing cases
      const [casesRecords] = await queryInterface.sequelize.query(
        `SELECT id, title FROM cases`,
        { transaction }
      );

      const [typesFromDb] = await queryInterface.sequelize.query(
        `SELECT id, name FROM case_types`,
        { transaction }
      );

      const [stagesFromDb] = await queryInterface.sequelize.query(
        `SELECT id, name FROM case_stages`,
        { transaction }
      );

      const typeMap = {};
      typesFromDb.forEach(t => {
        typeMap[t.name.toLowerCase().trim()] = t.id;
      });

      const stageMap = {};
      stagesFromDb.forEach(s => {
        stageMap[s.name.toLowerCase().trim()] = s.id;
      });

      // Default backup stages
      const defaultStageId = stageMap['filing'] || stagesFromDb[0]?.id;
      const defaultTypeId = typeMap['other'] || typesFromDb[typesFromDb.length - 1]?.id;

      for (const caseRec of casesRecords) {
        const title = caseRec.title || '';
        const parts = title.split(' :: ');
        const firstPart = parts[0] || '';
        
        let caseTypeName = '';
        const vsIdx = firstPart.indexOf(' — vs ');
        if (vsIdx >= 0) {
          caseTypeName = firstPart.slice(0, vsIdx).trim();
        } else {
          caseTypeName = firstPart.trim();
        }

        const stageName = (parts[1] || 'Filing').trim();

        const typeId = typeMap[caseTypeName.toLowerCase()] || defaultTypeId;
        const stageId = stageMap[stageName.toLowerCase()] || defaultStageId;

        await queryInterface.sequelize.query(
          `UPDATE cases SET case_type_id = :typeId, case_stage_id = :stageId WHERE id = :caseId`,
          {
            replacements: { typeId, stageId, caseId: caseRec.id },
            transaction
          }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeConstraint('cases', 'fk_cases_case_type_id', { transaction });
      await queryInterface.removeConstraint('cases', 'fk_cases_case_stage_id', { transaction });
      await queryInterface.removeColumn('cases', 'case_type_id', { transaction });
      await queryInterface.removeColumn('cases', 'case_stage_id', { transaction });
      await queryInterface.dropTable('case_stage_history', { transaction });
      await queryInterface.dropTable('case_stages', { transaction });
      await queryInterface.dropTable('case_types', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
