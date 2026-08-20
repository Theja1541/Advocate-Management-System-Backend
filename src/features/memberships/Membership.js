const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Membership extends Model {}

Membership.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    tenantId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'tenant_id',
    },
    groupAdminId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      field: 'group_admin_id',
    },
    planName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'plan_name',
    },
    feeAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'fee_amount',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date',
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'expiry_date',
    },
    status: {
      type: DataTypes.ENUM('active', 'expiring', 'expired'),
      defaultValue: 'active',
      allowNull: false,
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
    modelName: 'Membership',
    tableName: 'memberships',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Membership;
