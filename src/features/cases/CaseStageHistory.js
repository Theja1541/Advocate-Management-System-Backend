const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class CaseStageHistory extends Model {}

CaseStageHistory.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    tenantId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'tenant_id',
    },
    caseId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'case_id',
    },
    oldStageId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'old_stage_id',
    },
    newStageId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'new_stage_id',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'changed_by',
    },
    changedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'changed_at',
    },
  },
  {
    sequelize,
    modelName: 'CaseStageHistory',
    tableName: 'case_stage_history',
    underscored: true,
    timestamps: false,
  }
);

module.exports = CaseStageHistory;
