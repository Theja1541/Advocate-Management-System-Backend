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
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM('tape', 'brass', 'ink'),
      allowNull: false,
    },
    dueInfo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'due_info',
    },
    isResolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_resolved',
    },
  },
  {
    sequelize,
    modelName: 'Alert',
    tableName: 'alerts',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Alert;
