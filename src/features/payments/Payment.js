const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Payment extends Model {}

Payment.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    receiptNo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'receipt_no',
    },
    caseId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'case_id',
    },
    partyType: {
      type: DataTypes.ENUM('Client', 'Advocate'),
      allowNull: false,
      field: 'party_type',
    },
    partyId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'party_id',
    },
    amountReceived: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00,
      field: 'amount_received',
    },
    amountOutstanding: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00,
      field: 'amount_outstanding',
    },
    transactionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'transaction_date',
    },
    status: {
      type: DataTypes.ENUM('paid', 'part', 'pending'),
      defaultValue: 'pending',
      allowNull: false,
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
    modelName: 'Payment',
    tableName: 'payments',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Payment;
