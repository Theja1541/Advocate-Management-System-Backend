const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class LandTitleSearch extends Model {}

LandTitleSearch.init(
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
    landId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'land_id',
    },
    searchDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'search_date',
    },
    periodFrom: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'period_from',
    },
    periodTo: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'period_to',
    },
    ecStatus: {
      type: DataTypes.ENUM('clear', 'noted', 'pending'),
      defaultValue: 'clear',
      allowNull: false,
      field: 'ec_status',
    },
    ecReferenceNo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'ec_reference_no',
    },
    revenueRecordsVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'revenue_records_verified',
    },
    registrationRecordsVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'registration_records_verified',
    },
    litigationChecked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'litigation_checked',
    },
    documentsVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'documents_verified',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    conductedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'conducted_by',
    },
  },
  {
    sequelize,
    modelName: 'LandTitleSearch',
    tableName: 'land_title_searches',
    underscored: true,
    timestamps: true,
  }
);

module.exports = LandTitleSearch;
