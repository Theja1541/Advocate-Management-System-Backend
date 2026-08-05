const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Tenant extends Model {}

Tenant.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    logo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    contactPerson: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'contact_person',
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    gstNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'gst_number',
    },
    planId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'plan_id',
      references: {
        model: 'subscription_plans',
        key: 'id',
      },
    },
    subscriptionStart: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'subscription_start',
    },
    subscriptionEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'subscription_end',
    },
    maxUsers: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_users',
    },
    storageLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'storage_limit',
      comment: 'Storage limit in MB, overrides plan limit if set',
    },
  },
  {
    sequelize,
    modelName: 'Tenant',
    tableName: 'tenants',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Tenant;
