const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Alert extends Model {}

Alert.init(
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
    referenceType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'reference_type',
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'reference_id',
    },
    alertType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'alert_type',
    },
    priority: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'active',
    },
    assignedTo: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'assigned_to',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_read',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Alert',
    tableName: 'alerts',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['tenant_id', 'reference_type', 'reference_id', 'alert_type'],
        name: 'idx_alert_unique_ref',
      },
    ],
  }
);

module.exports = Alert;
