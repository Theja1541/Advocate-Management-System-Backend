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
    referenceNo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
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
      allowNull: false,
      field: 'issue_date',
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
    findingsNote: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'findings_note',
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
