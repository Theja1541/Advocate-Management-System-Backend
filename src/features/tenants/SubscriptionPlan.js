const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class SubscriptionPlan extends Model {}

SubscriptionPlan.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    billingCycle: {
      type: DataTypes.ENUM('monthly', 'yearly', 'lifetime'),
      allowNull: false,
      field: 'billing_cycle',
      defaultValue: 'monthly',
    },
    maxUsers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'max_users',
      defaultValue: 5,
    },
    storageLimitMb: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'storage_limit_mb',
      defaultValue: 1024, // 1GB
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isTrial: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'is_trial',
      defaultValue: false,
    },
    trialDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'trial_days',
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'display_order',
      defaultValue: 0,
    },
    features: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    modelName: 'SubscriptionPlan',
    tableName: 'subscription_plans',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = SubscriptionPlan;
