const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Client extends Model {}

Client.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    clientCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'client_code',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isValidMobile(value) {
          const normalized = String(value).replace(/[\s\-()]/g, '');
          if (!/^(\+?91)?[6-9]\d{9}$/.test(normalized)) {
            throw new Error(
              'Please enter a valid mobile number (10 digits, optionally prefixed with +91)'
            );
          }
        },
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    village: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    aadhaarMasked: {
      type: DataTypes.STRING(20),
      defaultValue: '—',
      field: 'aadhaar_masked',
      validate: {
        isValidAadhaar(value) {
          if (value == null || value === '—') return;

          const trimmed = String(value).trim();
          // Full Aadhaar (preferred)
          const digitsOnly = trimmed.replace(/\D/g, '');
          if (digitsOnly.length === 12 && /^\d{12}$/.test(digitsOnly)) return;
          // Legacy masked format still stored in DB
          if (/^XXXX\sXXXX\s\d{4}$/i.test(trimmed)) return;

          throw new Error('Aadhaar must be 12 digits (e.g. 1234 5678 9012)');
        },
      },
    },
    panMasked: {
      type: DataTypes.STRING(20),
      defaultValue: '—',
      field: 'pan_masked',
      validate: {
        isValidPan(value) {
          if (value == null || value === '—') return;

          const trimmed = String(value).trim().toUpperCase();
          // Full PAN (preferred)
          if (/^[A-Z]{5}\d{4}[A-Z]$/.test(trimmed)) return;
          // Legacy masked format still stored in DB
          if (/^[A-Z]{5}[•*]{4}[A-Z]$/.test(trimmed)) return;

          throw new Error('PAN must be in format ABCDE1234F');
        },
      },
    },
    docsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'docs_count',
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
    modelName: 'Client',
    tableName: 'clients',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['client_code'],
      },
      {
        fields: ['name'],
      },
    ],
  }
);

module.exports = Client;
