const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../config/database');

class StateCourtFeeRule extends Model {}

StateCourtFeeRule.init(
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
    stateCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'state_code',
    },
    stateName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'state_name',
    },
    ruleType: {
      type: DataTypes.ENUM('FIXED', 'PERCENTAGE', 'SLAB'),
      allowNull: false,
      defaultValue: 'PERCENTAGE',
      field: 'rule_type',
    },
    calculationMode: {
      type: DataTypes.ENUM('SINGLE_SLAB', 'MARGINAL_CUMULATIVE'),
      allowNull: false,
      defaultValue: 'MARGINAL_CUMULATIVE',
      field: 'calculation_mode',
    },
    fixedAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'fixed_amount',
    },
    percentageRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'percentage_rate',
    },
    minFee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'min_fee',
    },
    maxFee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'max_fee',
    },
    effectiveFrom: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'effective_from',
    },
    effectiveTo: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'effective_to',
    },
    actName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'act_name',
    },
    actVersion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'act_version',
    },
    notificationNo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'notification_no',
    },
    defaultAdvocateFeePct: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 10.00,
      field: 'default_advocate_fee_pct',
    },
    processFee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 500.00,
      field: 'process_fee',
    },
    filingFee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 1000.00,
      field: 'filing_fee',
    },
    miscCharges: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 3000.00,
      field: 'misc_charges',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'created_by',
    },
    updatedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'updated_by',
    },
  },
  {
    sequelize,
    modelName: 'StateCourtFeeRule',
    tableName: 'state_court_fee_rules',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = StateCourtFeeRule;
