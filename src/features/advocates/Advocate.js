const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Advocate extends Model {}

Advocate.init(
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
      type: DataTypes.STRING(140),
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    specialization: {
      type: DataTypes.STRING(140),
      allowNull: true,
    },
    enrolment: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    experience: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    relation: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'Junior Advocate',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  },
  {
    sequelize,
    modelName: 'Advocate',
    tableName: 'advocates',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['tenant_id', 'email'],
      },
      {
        unique: true,
        fields: ['tenant_id', 'user_id'],
      },
    ],
  }
);

module.exports = Advocate;
