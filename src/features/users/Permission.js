const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Permission extends Model {}

Permission.init(
  {
    roleId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      field: 'role_id',
    },
    moduleId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      field: 'module_id',
    },
    accessLevel: {
      type: DataTypes.ENUM('—', 'V', 'VE', 'VA', 'VEA'),
      defaultValue: '—',
      allowNull: false,
      field: 'access_level',
    },
  },
  {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Permission;
