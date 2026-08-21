const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    tenantId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'tenant_id',
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    roleId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'role_id',
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    mustChangePassword: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'must_change_password',
    },
    mfaOtpHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'mfa_otp_hash',
    },
    mfaOtpExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'mfa_otp_expires_at',
    },
    mfaOtpAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'mfa_otp_attempts',
    },
    mfaOtpLastSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'mfa_otp_last_sent_at',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
    ],
  }
);

module.exports = User;
