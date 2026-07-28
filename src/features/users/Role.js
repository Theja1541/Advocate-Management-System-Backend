const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Role extends Model {}

Role.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Role;
