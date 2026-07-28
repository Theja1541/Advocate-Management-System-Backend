const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Land extends Model {}

Land.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    surveyNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'survey_no',
    },
    clientId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'client_id',
    },
    village: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    mandal: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    district: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    extent: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    classification: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    pattaNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'patta_no',
    },
    encumbranceStatus: {
      type: DataTypes.ENUM('clear', 'noted', 'pending'),
      defaultValue: 'clear',
      field: 'encumbrance_status',
    },
    titleStatus: {
      type: DataTypes.ENUM('clear', 'disputed', 'under_scrutiny'),
      defaultValue: 'clear',
      field: 'title_status',
    },
    caseId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'case_id',
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
    modelName: 'Land',
    tableName: 'lands',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['client_id'],
      },
    ],
  }
);

module.exports = Land;
