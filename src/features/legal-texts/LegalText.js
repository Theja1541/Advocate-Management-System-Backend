const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class LegalText extends Model {}

LegalText.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    tenantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'tenant_id' },
    title: { type: DataTypes.STRING(255), allowNull: false },
    content: { type: DataTypes.TEXT('long'), allowNull: false },
    category: { type: DataTypes.STRING(50), allowNull: false },
    createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'created_by' },
    updatedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'updated_by' },
  },
  {
    sequelize,
    modelName: 'LegalText',
    tableName: 'legal_texts',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['category'] },
    ],
  }
);

module.exports = LegalText;
