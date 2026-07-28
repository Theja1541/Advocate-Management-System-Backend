const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class BareAct extends Model {}

BareAct.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    abbreviation: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    effectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'effective_date',
    },
    type: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sectionsCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'sections_count',
    },
    isBookmarked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_bookmarked',
    },
    pdfFile: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'pdf_file',
    },
    pdfOriginalName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'pdf_original_name',
    },
    pdfStorageName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'pdf_storage_name',
    },
    pdfStoragePath: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'pdf_storage_path',
    },
    pdfSize: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
      field: 'pdf_size',
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'mime_type',
    },
    fileHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'file_hash',
    },
    versionNumber: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 1,
      field: 'version_number',
    },
    isCurrent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_current',
    },
    uploadedBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'uploaded_by',
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'uploaded_at',
    },
    createdBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'created_by',
    },
    updatedBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'updated_by',
    },
    deletedBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'deleted_by',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    modelName: 'BareAct',
    tableName: 'bare_acts',
    underscored: true,
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        unique: true,
        fields: ['abbreviation'],
      },
      {
        fields: ['name'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['file_hash'],
      },
      {
        fields: ['pdf_storage_name'],
      },
    ],
  }
);

module.exports = BareAct;
