const Client = require('./Client');
const User = require('../users/User');
const AppError = require('../../utils/AppError');

const SAFE_ATTRIBUTES = [
  'id',
  'clientCode',
  'name',
  'mobile',
  'email',
  'village',
  'aadhaarMasked',
  'panMasked',
  'docsCount',
  'createdBy',
  'updatedBy',
  'created_at',
  'updated_at',
];

const toPublicClient = (client) => {
  const plain = client.get ? client.get({ plain: true }) : { ...client };
  return plain;
};

const assertUserExists = async (userId, fieldLabel) => {
  if (userId == null) return;

  const user = await User.findByPk(userId, { attributes: ['id'] });
  if (!user) {
    throw new AppError(`${fieldLabel} user not found`, 400);
  }
};

const getAllClients = async () => {
  const clients = await Client.findAll({
    attributes: SAFE_ATTRIBUTES,
    order: [['id', 'ASC']],
  });
  return clients.map(toPublicClient);
};

const getClientById = async (id) => {
  const client = await Client.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  return toPublicClient(client);
};

const createClient = async ({
  clientCode,
  name,
  mobile,
  email,
  village,
  aadhaarMasked,
  panMasked,
  docsCount,
  createdBy,
  updatedBy,
}) => {
  await assertUserExists(createdBy, 'createdBy');
  await assertUserExists(updatedBy, 'updatedBy');

  let resolvedCode = clientCode;
  if (!resolvedCode) {
    const last = await Client.findOne({
      attributes: ['id'],
      order: [['id', 'DESC']],
    });
    const nextNum = Number(last?.id || 0) + 1;
    resolvedCode = `CL-${String(nextNum).padStart(4, '0')}`;
  }

  const existing = await Client.findOne({
    where: { clientCode: resolvedCode },
    attributes: SAFE_ATTRIBUTES,
  });
  if (existing) {
    throw new AppError('Client code is already registered', 409);
  }

  const client = await Client.create({
    clientCode: resolvedCode,
    name,
    mobile,
    email: email || null,
    village: village || null,
    aadhaarMasked: aadhaarMasked || '—',
    panMasked: panMasked || '—',
    docsCount: docsCount || 0,
    createdBy: createdBy || null,
    updatedBy: updatedBy || null,
  });

  return toPublicClient(client);
};

const updateClient = async (
  id,
  {
    clientCode,
    name,
    mobile,
    email,
    village,
    aadhaarMasked,
    panMasked,
    docsCount,
    createdBy,
    updatedBy,
  }
) => {
  const client = await Client.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  if (createdBy !== undefined) {
    await assertUserExists(createdBy, 'createdBy');
  }
  if (updatedBy !== undefined) {
    await assertUserExists(updatedBy, 'updatedBy');
  }

  if (clientCode && clientCode !== client.clientCode) {
    const existing = await Client.findOne({
      where: { clientCode },
      attributes: SAFE_ATTRIBUTES,
    });
    if (existing) {
      throw new AppError('Client code is already registered', 409);
    }
  }

  if (clientCode !== undefined) client.clientCode = clientCode;
  if (name !== undefined) client.name = name;
  if (mobile !== undefined) client.mobile = mobile;
  if (email !== undefined) client.email = email || null;
  if (village !== undefined) client.village = village || null;
  if (aadhaarMasked !== undefined) client.aadhaarMasked = aadhaarMasked || '—';
  if (panMasked !== undefined) client.panMasked = panMasked || '—';
  if (docsCount !== undefined) client.docsCount = docsCount;
  if (createdBy !== undefined) client.createdBy = createdBy;
  if (updatedBy !== undefined) client.updatedBy = updatedBy;

  await client.save();

  return toPublicClient(client);
};

const deleteClient = async (id) => {
  const client = await Client.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  await client.destroy();
  return true;
};

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
};
