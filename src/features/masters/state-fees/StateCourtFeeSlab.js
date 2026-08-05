const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../config/database');

class StateCourtFeeSlab extends Model {}

StateCourtFeeSlab.init(
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
    ruleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'rule_id',
      references: {
        model: 'state_court_fee_rules',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    fromAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'from_amount',
    },
    toAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true, // NULL means unlimited / upper bound infinity
      field: 'to_amount',
    },
    feeType: {
      type: DataTypes.ENUM('FIXED', 'PERCENTAGE'),
      allowNull: false,
      defaultValue: 'PERCENTAGE',
      field: 'fee_type',
    },
    feeValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'fee_value', // value as fixed rupees or percentage
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
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'display_order',
    },
  },
  {
    sequelize,
    modelName: 'StateCourtFeeSlab',
    tableName: 'state_court_fee_slabs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = StateCourtFeeSlab;
