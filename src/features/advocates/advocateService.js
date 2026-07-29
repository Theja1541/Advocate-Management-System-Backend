const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const Advocate = require('./Advocate');
const User = require('../users/User');
const Role = require('../users/Role');
const AppError = require('../../utils/AppError');

const SAFE_ATTRIBUTES = [
  'id',
  'name',
  'mobile',
  'email',
  'specialization',
  'enrolment',
  'experience',
  'relation',
  'status',
  'userId',
  'created_at',
  'updated_at',
];

const DEFAULT_LOGIN_PASSWORD = 'password';

const toPublicAdvocate = (advocate) => {
  const plain = advocate.get ? advocate.get({ plain: true }) : { ...advocate };
  plain.hasLogin = plain.userId != null;
  return plain;
};

const getAdvocateRoleId = async (transaction) => {
  const role = await Role.findOne({
    where: { name: 'Advocate' },
    attributes: ['id'],
    transaction,
  });
  if (!role) {
    throw new AppError('Advocate role is not configured', 500);
  }
  return role.id;
};

const assertEmailAvailableForAdvocate = async (email, excludeId, transaction) => {
  if (!email) return;
  const existing = await Advocate.findOne({
    where: {
      email,
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
    },
    attributes: ['id'],
    transaction,
  });
  if (existing) {
    throw new AppError('Email is already registered to another advocate', 409);
  }
};

const assertEmailAvailableForUser = async (email, excludeUserId, transaction) => {
  if (!email) return;
  const existing = await User.findOne({
    where: {
      email,
      ...(excludeUserId ? { id: { [Op.ne]: excludeUserId } } : {}),
    },
    attributes: ['id'],
    transaction,
  });
  if (existing) {
    throw new AppError('Email is already registered as a login account', 409);
  }
};

const createLinkedLoginUser = async (
  { name, email, password, status },
  transaction
) => {
  const roleId = await getAdvocateRoleId(transaction);
  await assertEmailAvailableForUser(email, null, transaction);

  const passwordHash = await bcrypt.hash(
    password && String(password).trim() ? String(password).trim() : DEFAULT_LOGIN_PASSWORD,
    10
  );

  return User.create(
    {
      name,
      email,
      roleId,
      passwordHash,
      status: status === 'inactive' ? 'inactive' : 'active',
    },
    { transaction }
  );
};

const syncLinkedLoginUser = async (
  advocate,
  { name, email, password, status },
  transaction
) => {
  if (!advocate.userId) return;

  const user = await User.findByPk(advocate.userId, {
    attributes: ['id', 'name', 'email', 'passwordHash', 'status', 'roleId'],
    transaction,
  });
  if (!user) {
    advocate.userId = null;
    return;
  }

  if (email && email !== user.email) {
    await assertEmailAvailableForUser(email, user.id, transaction);
    user.email = email;
  }
  if (name !== undefined) user.name = name;
  if (status !== undefined) {
    user.status = status === 'inactive' ? 'inactive' : 'active';
  }
  if (password && String(password).trim()) {
    user.passwordHash = await bcrypt.hash(String(password).trim(), 10);
  }

  await user.save({ transaction });
};

const getAllAdvocates = async () => {
  const advocates = await Advocate.findAll({
    attributes: SAFE_ATTRIBUTES,
    order: [['id', 'ASC']],
  });
  return advocates.map(toPublicAdvocate);
};

const getAdvocateById = async (id) => {
  const advocate = await Advocate.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });

  if (!advocate) {
    throw new AppError('Advocate not found', 404);
  }

  return toPublicAdvocate(advocate);
};

const createAdvocate = async ({
  name,
  mobile,
  email,
  specialization,
  enrolment,
  experience,
  relation,
  status,
  password,
  createLogin,
}) => {
  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
  const wantsLogin =
    createLogin === undefined ? Boolean(normalizedEmail) : Boolean(createLogin);

  if (wantsLogin && !normalizedEmail) {
    throw new AppError('Email is required to create an advocate login', 400);
  }

  return sequelize.transaction(async (transaction) => {
    await assertEmailAvailableForAdvocate(normalizedEmail, null, transaction);
    if (normalizedEmail) {
      await assertEmailAvailableForUser(normalizedEmail, null, transaction);
    }

    let userId = null;
    if (wantsLogin) {
      const user = await createLinkedLoginUser(
        {
          name,
          email: normalizedEmail,
          password,
          status: status || 'active',
        },
        transaction
      );
      userId = user.id;
    }

    const advocate = await Advocate.create(
      {
        name,
        mobile,
        email: normalizedEmail,
        specialization: specialization || null,
        enrolment: enrolment || null,
        experience: experience || null,
        relation: relation || 'Junior Advocate',
        status: status || 'active',
        userId,
      },
      { transaction }
    );

    return toPublicAdvocate(advocate);
  });
};

const updateAdvocate = async (
  id,
  {
    name,
    mobile,
    email,
    specialization,
    enrolment,
    experience,
    relation,
    status,
    password,
    createLogin,
  }
) => {
  return sequelize.transaction(async (transaction) => {
    const advocate = await Advocate.findByPk(id, {
      attributes: SAFE_ATTRIBUTES,
      transaction,
    });

    if (!advocate) {
      throw new AppError('Advocate not found', 404);
    }

    const nextEmail =
      email !== undefined
        ? email
          ? String(email).trim().toLowerCase()
          : null
        : advocate.email;

    if (nextEmail && nextEmail !== advocate.email) {
      await assertEmailAvailableForAdvocate(nextEmail, id, transaction);
      await assertEmailAvailableForUser(nextEmail, advocate.userId, transaction);
    }

    if (name !== undefined) advocate.name = name;
    if (mobile !== undefined) advocate.mobile = mobile;
    if (email !== undefined) advocate.email = nextEmail;
    if (specialization !== undefined) {
      advocate.specialization = specialization || null;
    }
    if (enrolment !== undefined) advocate.enrolment = enrolment || null;
    if (experience !== undefined) advocate.experience = experience || null;
    if (relation) advocate.relation = relation;
    if (status) advocate.status = status;

    // Create login later if requested and none exists yet
    const wantsLogin =
      Boolean(createLogin) ||
      (password && String(password).trim() && !advocate.userId);

    if (!advocate.userId && wantsLogin) {
      if (!nextEmail) {
        throw new AppError('Email is required to create an advocate login', 400);
      }
      const user = await createLinkedLoginUser(
        {
          name: advocate.name,
          email: nextEmail,
          password,
          status: advocate.status,
        },
        transaction
      );
      advocate.userId = user.id;
    } else if (advocate.userId) {
      await syncLinkedLoginUser(
        advocate,
        {
          name: advocate.name,
          email: nextEmail,
          password,
          status: advocate.status,
        },
        transaction
      );
    }

    await advocate.save({ transaction });

    return toPublicAdvocate(advocate);
  });
};

const deleteAdvocate = async (id) => {
  return sequelize.transaction(async (transaction) => {
    const advocate = await Advocate.findByPk(id, {
      attributes: SAFE_ATTRIBUTES,
      transaction,
    });

    if (!advocate) {
      throw new AppError('Advocate not found', 404);
    }

    const linkedUserId = advocate.userId;
    await advocate.destroy({ transaction });

    if (linkedUserId) {
      const user = await User.findByPk(linkedUserId, { transaction });
      if (user) {
        await user.destroy({ transaction });
      }
    }

    return true;
  });
};

module.exports = {
  getAllAdvocates,
  getAdvocateById,
  createAdvocate,
  updateAdvocate,
  deleteAdvocate,
  DEFAULT_LOGIN_PASSWORD,
};
