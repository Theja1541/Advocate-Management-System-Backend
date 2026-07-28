const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class CaseDiary extends Model {}

CaseDiary.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    caseId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'case_id',
    },
    hearingDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'hearing_date',
    },
    hearingTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'hearing_time',
    },
    advocateId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'advocate_id',
    },
    courtIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'court_index',
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    nextHearingDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'next_hearing_date',
    },
    attachmentsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'attachments_count',
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'created_by',
    },
    updatedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'updated_by',
    },
  },
  {
    sequelize,
    modelName: 'CaseDiary',
    tableName: 'case_diaries',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['case_id'],
      },
      {
        fields: ['advocate_id'],
      },
    ],
  }
);

module.exports = CaseDiary;
