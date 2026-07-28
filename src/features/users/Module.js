const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Module extends Model {}

Module.init(
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
    keyCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      field: 'key_code',
    },
  },
  {
    sequelize,
    modelName: 'Module',
    tableName: 'modules',
    underscored: true,
    timestamps: false,
  }
);

module.exports = Module;
