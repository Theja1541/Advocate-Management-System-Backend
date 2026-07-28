const { Daybook, User } = require('../associations');
const AppError = require('../../utils/AppError');

const SAFE_ATTRIBUTES = [
  'id',
  'daybookCode',
  'transactionDate',
  'category',
  'particulars',
  'paymentMode',
  'type',
  'amount',
  'recordedBy',
  'created_at',
  'updated_at',
];

const recorderInclude = {
  model: User,
  as: 'recorder',
  attributes: ['id', 'name'],
};

const toPublicEntry = (entry) => {
  const plain = entry.get ? entry.get({ plain: true }) : { ...entry };
  plain.amount = Number(plain.amount || 0);
  return plain;
};

const assertUserExists = async (userId) => {
  const user = await User.findByPk(userId, { attributes: ['id'] });
  if (!user) throw new AppError('Recording user not found', 400);
};

const generateDaybookCode = async () => {
  const last = await Daybook.findOne({
    attributes: ['id'],
    order: [['id', 'DESC']],
  });
  const nextNum = Number(last?.id || 0) + 1;
  return `DB-${String(nextNum).padStart(3, '0')}`;
};

const getAllEntries = async () => {
  const entries = await Daybook.findAll({
    attributes: SAFE_ATTRIBUTES,
    include: [recorderInclude],
    order: [
      ['transactionDate', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  return entries.map(toPublicEntry);
};

const getEntryById = async (id) => {
  const entry = await Daybook.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
    include: [recorderInclude],
  });
  if (!entry) throw new AppError('Day book entry not found', 404);
  return toPublicEntry(entry);
};

const createEntry = async ({
  daybookCode,
  transactionDate,
  category,
  particulars,
  paymentMode,
  type,
  amount,
  recordedBy,
}) => {
  await assertUserExists(recordedBy);

  let code = daybookCode;
  if (!code) code = await generateDaybookCode();

  const existing = await Daybook.findOne({
    where: { daybookCode: code },
    attributes: ['id'],
  });
  if (existing) throw new AppError('Day book reference is already registered', 409);

  const entry = await Daybook.create({
    daybookCode: code,
    transactionDate,
    category,
    particulars,
    paymentMode,
    type,
    amount,
    recordedBy,
  });

  return getEntryById(entry.id);
};

const updateEntry = async (
  id,
  {
    daybookCode,
    transactionDate,
    category,
    particulars,
    paymentMode,
    type,
    amount,
    recordedBy,
  }
) => {
  const entry = await Daybook.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!entry) throw new AppError('Day book entry not found', 404);

  if (recordedBy !== undefined) {
    await assertUserExists(recordedBy);
    entry.recordedBy = recordedBy;
  }

  if (daybookCode !== undefined && daybookCode !== entry.daybookCode) {
    const existing = await Daybook.findOne({
      where: { daybookCode },
      attributes: ['id'],
    });
    if (existing) throw new AppError('Day book reference is already registered', 409);
    entry.daybookCode = daybookCode;
  }

  if (transactionDate !== undefined) entry.transactionDate = transactionDate;
  if (category !== undefined) entry.category = category;
  if (particulars !== undefined) entry.particulars = particulars;
  if (paymentMode !== undefined) entry.paymentMode = paymentMode;
  if (type !== undefined) entry.type = type;
  if (amount !== undefined) entry.amount = amount;

  await entry.save();
  return getEntryById(entry.id);
};

const deleteEntry = async (id) => {
  const entry = await Daybook.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!entry) throw new AppError('Day book entry not found', 404);
  await entry.destroy();
  return true;
};

module.exports = {
  getAllEntries,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
};
