const { sequelize } = require('../../config/database');
const { Payment, Case, Client, Advocate, User, Daybook } = require('../associations');
const AppError = require('../../utils/AppError');
const { resolveAlert, resolveAllAlertsForRecord } = require('../alerts/alertEngine');

const SAFE_ATTRIBUTES = [
  'id',
  'receiptNo',
  'caseId',
  'partyType',
  'partyId',
  'amountReceived',
  'amountOutstanding',
  'transactionDate',
  'status',
  'createdBy',
  'updatedBy',
  'created_at',
  'updated_at',
];

const caseInclude = {
  model: Case,
  as: 'case',
  attributes: ['id', 'caseNo', 'title'],
};

const toPublicPayment = (payment) => {
  const plain = payment.get ? payment.get({ plain: true }) : { ...payment };
  plain.amountReceived = Number(plain.amountReceived || 0);
  plain.amountOutstanding = Number(plain.amountOutstanding || 0);
  return plain;
};

const assertCaseExists = async (caseId, options = {}) => {
  const caseRecord = await Case.findByPk(caseId, {
    attributes: ['id', 'caseNo'],
    transaction: options.transaction,
  });
  if (!caseRecord) {
    throw new AppError('Case not found', 400);
  }
  return caseRecord;
};

const assertPartyExists = async (partyType, partyId, options = {}) => {
  if (partyType === 'Client') {
    const client = await Client.findByPk(partyId, {
      attributes: ['id', 'name'],
      transaction: options.transaction,
    });
    if (!client) throw new AppError('Client not found', 400);
    return client;
  }
  if (partyType === 'Advocate') {
    const advocate = await Advocate.findByPk(partyId, {
      attributes: ['id', 'name'],
      transaction: options.transaction,
    });
    if (!advocate) throw new AppError('Advocate not found', 400);
    return advocate;
  }
  return null;
};

const assertUserExists = async (userId, fieldLabel, options = {}) => {
  if (userId == null) return;
  const user = await User.findByPk(userId, {
    attributes: ['id'],
    transaction: options.transaction,
  });
  if (!user) throw new AppError(`${fieldLabel} user not found`, 400);
};

const generateReceiptNo = async (options = {}) => {
  const last = await Payment.findOne({
    attributes: ['id'],
    order: [['id', 'DESC']],
    transaction: options.transaction,
    lock: options.transaction ? options.transaction.LOCK.UPDATE : undefined,
  });
  const nextNum = Number(last?.id || 0) + 1;
  return `PY-${String(nextNum).padStart(3, '0')}`;
};

const generateDaybookCode = async (options = {}) => {
  const last = await Daybook.findOne({
    attributes: ['id'],
    order: [['id', 'DESC']],
    transaction: options.transaction,
    lock: options.transaction ? options.transaction.LOCK.UPDATE : undefined,
  });
  const nextNum = Number(last?.id || 0) + 1;
  return `DB-${String(nextNum).padStart(3, '0')}`;
};

const deriveStatus = (status, amountReceived, amountOutstanding) => {
  if (status) return status;
  const received = Number(amountReceived || 0);
  const due = Number(amountOutstanding || 0);
  if (received > 0 && due <= 0) return 'paid';
  if (received > 0 && due > 0) return 'part';
  return 'pending';
};

const buildDaybookFromPayment = ({
  payment,
  caseRecord,
  party,
  paymentMode,
  recordedBy,
}) => {
  const amount = Number(payment.amountReceived || 0);
  const isClient = payment.partyType === 'Client';
  const partyName = party?.name || payment.partyType;
  const caseNo = caseRecord?.caseNo || `Case #${payment.caseId}`;

  return {
    category: isClient ? 'Client Payment' : 'Advocate Payment',
    type: isClient ? 'in' : 'out',
    amount: amount > 0 ? amount : Number(payment.amountOutstanding || 0) || 0,
    particulars: isClient
      ? `Fee received — ${partyName} (${caseNo}) [${payment.receiptNo}]`
      : `Advocate share — ${partyName} (${caseNo}) [${payment.receiptNo}]`,
    paymentMode: paymentMode || 'Bank',
    transactionDate: payment.transactionDate,
    recordedBy,
  };
};

const getAllPayments = async () => {
  const payments = await Payment.findAll({
    attributes: SAFE_ATTRIBUTES,
    include: [caseInclude],
    order: [['transactionDate', 'DESC'], ['id', 'DESC']],
  });
  return payments.map(toPublicPayment);
};

const getPaymentById = async (id, options = {}) => {
  const payment = await Payment.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
    include: [caseInclude],
    transaction: options.transaction,
  });
  if (!payment) throw new AppError('Payment not found', 404);
  return toPublicPayment(payment);
};

const createPayment = async ({
  receiptNo,
  caseId,
  partyType,
  partyId,
  amountReceived,
  amountOutstanding,
  transactionDate,
  status,
  paymentMode,
  createdBy,
  updatedBy,
}) => {
  return sequelize.transaction(async (transaction) => {
    const caseRecord = await assertCaseExists(caseId, { transaction });
    const party = await assertPartyExists(partyType, partyId, { transaction });
    await assertUserExists(createdBy, 'createdBy', { transaction });
    await assertUserExists(updatedBy, 'updatedBy', { transaction });

    if (createdBy == null) {
      throw new AppError(
        'Authenticated user is required to log payment and daybook entry',
        400
      );
    }

    let resolvedReceipt = receiptNo;
    if (!resolvedReceipt) {
      resolvedReceipt = await generateReceiptNo({ transaction });
    }

    const existing = await Payment.findOne({
      where: { receiptNo: resolvedReceipt },
      attributes: ['id'],
      transaction,
    });
    if (existing) {
      throw new AppError('Receipt number is already registered', 409);
    }

    const payment = await Payment.create(
      {
        receiptNo: resolvedReceipt,
        caseId,
        partyType,
        partyId,
        amountReceived: amountReceived ?? 0,
        amountOutstanding: amountOutstanding ?? 0,
        transactionDate,
        status: deriveStatus(status, amountReceived, amountOutstanding),
        createdBy: createdBy || null,
        updatedBy: updatedBy || null,
      },
      { transaction }
    );

    const daybookCode = await generateDaybookCode({ transaction });
    const daybookPayload = buildDaybookFromPayment({
      payment,
      caseRecord,
      party,
      paymentMode,
      recordedBy: createdBy,
    });

    const existingDaybook = await Daybook.findOne({
      where: { daybookCode },
      attributes: ['id'],
      transaction,
    });
    if (existingDaybook) {
      throw new AppError('Day book reference is already registered', 409);
    }

    await Daybook.create(
      {
        daybookCode,
        ...daybookPayload,
      },
      { transaction }
    );

    return getPaymentById(payment.id, { transaction });
  });
};

const updatePayment = async (
  id,
  {
    receiptNo,
    caseId,
    partyType,
    partyId,
    amountReceived,
    amountOutstanding,
    transactionDate,
    status,
    updatedBy,
  }
) => {
  const payment = await Payment.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!payment) throw new AppError('Payment not found', 404);

  if (caseId !== undefined) {
    await assertCaseExists(caseId);
    payment.caseId = caseId;
  }

  const nextPartyType = partyType !== undefined ? partyType : payment.partyType;
  const nextPartyId = partyId !== undefined ? partyId : payment.partyId;
  if (partyType !== undefined || partyId !== undefined) {
    await assertPartyExists(nextPartyType, nextPartyId);
    payment.partyType = nextPartyType;
    payment.partyId = nextPartyId;
  }

  if (updatedBy !== undefined) {
    await assertUserExists(updatedBy, 'updatedBy');
    payment.updatedBy = updatedBy;
  }

  if (receiptNo !== undefined && receiptNo !== payment.receiptNo) {
    const existing = await Payment.findOne({
      where: { receiptNo },
      attributes: ['id'],
    });
    if (existing) throw new AppError('Receipt number is already registered', 409);
    payment.receiptNo = receiptNo;
  }

  if (amountReceived !== undefined) payment.amountReceived = amountReceived;
  if (amountOutstanding !== undefined) payment.amountOutstanding = amountOutstanding;
  if (transactionDate !== undefined) payment.transactionDate = transactionDate;
  if (status !== undefined) {
    payment.status = status;
  } else if (amountReceived !== undefined || amountOutstanding !== undefined) {
    payment.status = deriveStatus(
      null,
      payment.amountReceived,
      payment.amountOutstanding
    );
  }

  await payment.save();
  
  if (payment.status === 'Completed' || payment.status === 'paid') {
    await resolveAlert('Payment', payment.id, 'PAYMENT_OVERDUE');
    await resolveAlert('Payment', payment.id, 'PAYMENT_DUE');
  }

  return getPaymentById(payment.id);
};

const deletePayment = async (id) => {
  const payment = await Payment.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!payment) throw new AppError('Payment not found', 404);
  await payment.destroy();
  await resolveAllAlertsForRecord('Payment', id);
  return true;
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
};
