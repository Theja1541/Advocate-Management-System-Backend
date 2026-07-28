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
