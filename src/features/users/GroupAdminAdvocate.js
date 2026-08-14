const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class GroupAdminAdvocate extends Model {}

GroupAdminAdvocate.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    groupAdminId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'group_admin_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    advocateId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'advocate_id',
      references: {
        model: 'advocates',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'GroupAdminAdvocate',
    tableName: 'group_admin_advocates',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['group_admin_id', 'advocate_id'],
      },
    ],
  }
);

module.exports = GroupAdminAdvocate;
