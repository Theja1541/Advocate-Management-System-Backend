const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PhraseOccurrence = sequelize.define('PhraseOccurrence', {
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
  phraseGroupId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'phrase_group_id'
  },
  sourceType: {
    type: DataTypes.ENUM('LegalText', 'Document', 'CaseDiary', 'Opinion'),
    allowNull: false,
    field: 'source_type'
  },
  sourceId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'source_id'
  }
}, {
  tableName: 'phrase_occurrences',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['phrase_group_id', 'source_type', 'source_id']
    }
  ]
});

module.exports = PhraseOccurrence;
