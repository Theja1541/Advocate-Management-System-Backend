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
    tenantId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'tenant_id',
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
    subDivisionNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'sub_division_no',
    },
    sro: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'sro',
    },
    registrationDistrict: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'registration_district',
    },
    documentNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'document_no',
    },
    documentYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'document_year',
    },
    registrationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'registration_date',
    },
    acquisitionType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'acquisition_type',
    },
    currentOwnerName: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: 'current_owner_name',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'remarks',
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
