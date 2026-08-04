const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Case extends Model {}

Case.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    caseNo: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      field: 'case_no',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Pending Approval', 'Closed'),
      allowNull: false,
      defaultValue: 'Active',
    },
    court: {
      type: DataTypes.STRING(180),
      allowNull: true,
    },
    nextHearing: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'next_hearing',
    },
    advocateId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'advocate_id',
    },
    clientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'client_id',
    },
    caseTypeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'case_type_id',
    },
    caseStageId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'case_stage_id',
    },
    courtId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'court_id',
    },
    approvalLevel: {
      type: DataTypes.TINYINT,
      allowNull: true,
      field: 'approval_level',
    },
    courtFeeSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'court_fee_snapshot',
    },
    suitValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'suit_value',
    },
    feePercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'fee_percentage',
    },
    advocateFee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'advocate_fee',
    },
    courtFee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'court_fee',
    },
    processFee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'process_fee',
    },
    filingFee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'filing_fee',
    },
    miscCharges: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'misc_charges',
    },
    totalPayable: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'total_payable',
    },
    feeCalculationStatus: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'fee_calculation_status',
    },
  },
  {
    sequelize,
    modelName: 'Case',
    tableName: 'cases',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['case_no'],
      },
      {
        fields: ['advocate_id'],
      },
      {
        fields: ['client_id'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

module.exports = Case;
