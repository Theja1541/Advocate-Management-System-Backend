const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Daybook extends Model {}

Daybook.init(
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
    daybookCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'daybook_code',
    },
    transactionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'transaction_date',
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    particulars: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    paymentMode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'payment_mode',
    },
    type: {
      type: DataTypes.ENUM('in', 'out'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    recordedBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'recorded_by',
    },
  },
  {
    sequelize,
    modelName: 'Daybook',
    tableName: 'daybook',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Daybook;
