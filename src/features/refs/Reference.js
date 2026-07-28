const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Reference extends Model {}

Reference.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    citation: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    court: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    judge: {
      type: DataTypes.STRING(100),
      defaultValue: '—',
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    tag: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'created_by',
    },
  },
  {
    sequelize,
    modelName: 'Reference',
    tableName: 'references_library',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = Reference;
