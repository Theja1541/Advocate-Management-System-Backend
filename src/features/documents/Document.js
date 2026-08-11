const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Document extends Model {}

Document.init(
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
    documentCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'document_code',
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    documentCategoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'document_category_id',
    },
    caseId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'case_id',
    },
    landId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'land_id',
    },
    fileType: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'file_type',
    },
    fileSize: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'file_size',
    },
    filePath: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'file_path',
    },
    searchContent: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'search_content',
    },
    uploadedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'uploaded_by',
    },
    uploadDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'upload_date',
    },
    diaryId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'diary_id',
    },
  },
  {
    sequelize,
    modelName: 'Document',
    tableName: 'documents',
    underscored: true,
    timestamps: true,
    updatedAt: false, // Uploaded documents are read-only / delete-only usually
  }
);

module.exports = Document;
