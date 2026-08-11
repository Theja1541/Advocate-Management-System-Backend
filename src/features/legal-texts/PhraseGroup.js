const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PhraseGroup = sequelize.define('PhraseGroup', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'tenant_id'
  },
  phrase: {
    type: DataTypes.STRING(255),
    allowNull: false,
  }
}, {
  tableName: 'phrase_groups',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'phrase']
    }
  ]
});

module.exports = PhraseGroup;
