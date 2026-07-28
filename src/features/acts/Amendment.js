const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Amendment extends Model {}

Amendment.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    sourceAct: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'source_act',
    },
    targetAct: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'target_act',
    },
    oldSection: {
      type: DataTypes.STRING(40),
      allowNull: false,
      field: 'old_section',
    },
    oldTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'old_title',
    },
    newSection: {
      type: DataTypes.STRING(40),
      allowNull: false,
      field: 'new_section',
    },
    newTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'new_title',
    },
    effectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'effective_date',
    },
  },
  {
    sequelize,
    modelName: 'Amendment',
    tableName: 'amendments',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['source_act'],
      },
      {
        fields: ['target_act'],
      },
      {
        fields: ['old_section'],
      },
      {
        fields: ['new_section'],
      },
      {
        fields: ['effective_date'],
      },
    ],
  }
);

module.exports = Amendment;
