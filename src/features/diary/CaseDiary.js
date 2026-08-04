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
    courtId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'court_id',
    },
    status: {
      type: DataTypes.ENUM('Scheduled', 'In Progress', 'Completed', 'Adjourned', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Scheduled',
    },
    hearingType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'hearing_type',
    },
    judge: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    outcome: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nextAction: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'next_action',
    },
    conductedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'conducted_by',
    },
    actualStartTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'actual_start_time',
    },
    actualEndTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'actual_end_time',
    },
    adjournmentReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'adjournment_reason',
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
