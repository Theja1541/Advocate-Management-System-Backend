const bcrypt = require('bcrypt');
const { User, Role } = require('../associations');
const AppError = require('../../utils/AppError');

const SAFE_ATTRIBUTES = [
  'id',
  'name',
  'email',
  'roleId',
  'status',
  'created_at',
  'updated_at',
];

const WRITE_ATTRIBUTES = [...SAFE_ATTRIBUTES, 'passwordHash'];

const roleInclude = {
  model: Role,
  as: 'role',
  attributes: ['id', 'name'],
};

const toPublicUser = (user) => {
  const plain = user.get ? user.get({ plain: true }) : { ...user };
  delete plain.passwordHash;

  const roleName = plain.role?.name ?? null;
  plain.role = roleName;

  return plain;
};

const ensureRoleExists = async (roleId) => {
  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new AppError('Role not found', 404);
  }
  return role;
};

const getAllUsers = async () => {
  const users = await User.findAll({
    attributes: SAFE_ATTRIBUTES,
    include: [roleInclude],
    order: [['id', 'ASC']],
  });
  return users.map(toPublicUser);
};

const getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
    include: [roleInclude],
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return toPublicUser(user);
};

const createUser = async ({ name, email, roleId, password, status }) => {
  const existing = await User.findOne({
    where: { email },
    attributes: SAFE_ATTRIBUTES,
  });
  if (existing) {
    throw new AppError('Email is already registered', 409);
  }

  await ensureRoleExists(roleId);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    roleId,
    passwordHash,
    status: status || 'active',
  });

  return getUserById(user.id);
};

const updateUser = async (id, { name, email, roleId, password, status }) => {
  const user = await User.findByPk(id, {
    attributes: WRITE_ATTRIBUTES,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (email && email !== user.email) {
    const existing = await User.findOne({
      where: { email },
      attributes: SAFE_ATTRIBUTES,
    });
    if (existing) {
      throw new AppError('Email is already registered', 409);
    }
  }

  if (roleId !== undefined) {
    await ensureRoleExists(roleId);
  }

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (roleId !== undefined) user.roleId = roleId;
  if (status !== undefined) user.status = status;
  if (password) {
    user.passwordHash = await bcrypt.hash(password, 10);
  }

  await user.save();

  return getUserById(user.id);
};

const deleteUser = async (id) => {
  const user = await User.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await user.destroy();
  return true;
};

const crypto = require('crypto');

const resetPassword = async (id) => {
  const user = await User.findByPk(id, {
    attributes: WRITE_ATTRIBUTES,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const tempPassword = crypto.randomBytes(8).toString('hex');
  user.passwordHash = await bcrypt.hash(tempPassword, 10);
  user.mustChangePassword = true;
  
  await user.save();

  return tempPassword;
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
};
