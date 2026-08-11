const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Opinion extends Model {}

Opinion.init(
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
    referenceNo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'reference_no',
    },
    clientId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'client_id',
    },
    surveyNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'survey_no',
    },
    village: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    opinionType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'opinion_type',
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'issue_date',
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_review', 'approved', 'rejected', 'issued'),
      allowNull: false,
      defaultValue: 'draft',
    },
    approvedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'approved_by',
    },
    approvalDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approval_date',
    },
    issuedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'issued_by',
    },
    rejectReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reject_reason',
    },
    titleStatus: {
      type: DataTypes.ENUM('clear', 'disputed', 'under_scrutiny'),
      defaultValue: 'clear',
      field: 'title_status',
    },
    advocateId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'advocate_id',
    },
    landId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'land_id',
    },
    findingsNote: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'findings_note',
    },
    recommendation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    limitations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    documentId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'document_id',
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
    modelName: 'Opinion',
    tableName: 'opinions',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Opinion;
