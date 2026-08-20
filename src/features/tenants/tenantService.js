const { sequelize } = require('../../config/database');
const { Tenant, TenantSetting, TenantSubscription, SubscriptionPlan, User, Role, Permission, Module, Case, Document } = require('../associations');
const AppError = require('../../utils/AppError');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { generateTemporaryPassword } = require('../../utils/cryptoUtil');
const emailService = require('../../services/emailService');

const getTenants = async (query = {}) => {
  const tenants = await Tenant.findAll({
    include: [
      { model: SubscriptionPlan, as: 'plan' },
      { 
        model: User, 
        as: 'Users',
        attributes: ['id', 'roleId'],
        include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }]
      }
    ],
    order: [['created_at', 'DESC']],
    bypassTenant: true
  });

  return tenants.map(t => {
    const plain = t.toJSON();
    const groupAdminsCount = (plain.Users || []).filter(u => 
      u.role?.name?.toLowerCase().includes('group admin')
    ).length;
    const usersCount = (plain.Users || []).length;

    return {
      ...plain,
      groupAdminsCount,
      usersCount
    };
  });
};

const getTenantById = async (id) => {
  const tenant = await Tenant.findByPk(id, {
    include: [{ model: SubscriptionPlan, as: 'plan' }, { model: TenantSetting, as: 'settings' }]
  });
  if (!tenant) throw new AppError('Tenant not found', 404);

  const adminRole = await Role.findOne({ where: { name: 'Tenant Admin', tenantId: id }, bypassTenant: true });
  if (adminRole) {
    const adminUser = await User.findOne({ where: { roleId: adminRole.id, tenantId: id }, bypassTenant: true, attributes: ['id', 'name', 'email', 'status'] });
    if (adminUser) {
      tenant.dataValues.tenantAdmin = adminUser;
    }
  }

  return tenant;
};

const createTenant = async (tenantData, adminData) => {
  const transaction = await sequelize.transaction();
  try {
    // 1. Create Tenant
    const tenant = await Tenant.create({
      ...tenantData,
      status: 'active'
    }, { transaction, bypassTenant: true });

    // 2. Create Default Settings
    await TenantSetting.create({
      tenantId: tenant.id,
      key: 'theme',
      value: 'light'
    }, { transaction, bypassTenant: true });

    // 3. Create Default Subscription if planId provided
    if (tenantData.planId) {
      const plan = await SubscriptionPlan.findByPk(tenantData.planId, { transaction });
      if (plan) {
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        await TenantSubscription.create({
          tenantId: tenant.id,
          planId: plan.id,
          amountPaid: plan.price ?? 0.00,
          status: 'active',
          startDate: new Date(),
          endDate: endDate,
        }, { transaction, bypassTenant: true });
        
        tenant.subscriptionStart = new Date();
        tenant.subscriptionEnd = endDate;
        tenant.maxUsers = plan.maxUsers;
        tenant.storageLimit = plan.storageLimit;
        await tenant.save({ transaction, bypassTenant: true });
      }
    }

    // 4. Create Tenant Admin Role
    const adminRole = await Role.create({
      name: 'Tenant Admin',
      description: 'Full access to tenant data',
      tenantId: tenant.id
    }, { transaction, bypassTenant: true });

    // 5. Create other default roles
    const defaultRoles = [
      { name: 'Group Admin', description: 'Group administrator access', tenantId: tenant.id },
      { name: 'Sub Admin', description: 'Limited administrative access', tenantId: tenant.id },
      { name: 'Advocate', description: 'Standard advocate access', tenantId: tenant.id },
      { name: 'Staff/Bearer', description: 'Basic staff access', tenantId: tenant.id }
    ];
    const createdDefaultRoles = await Role.bulkCreate(defaultRoles, { transaction, bypassTenant: true });


    // 6. Assign modules to roles
    const modules = await Module.findAll({ transaction, bypassTenant: true });
    const allRoleIds = [adminRole.id, ...createdDefaultRoles.map(r => r.id)];
    const perms = [];
    allRoleIds.forEach(roleId => {
      modules.forEach(m => {
        perms.push({
          roleId: roleId,
          moduleId: m.id,
          accessLevel: roleId === adminRole.id ? 'VEA' : '---',
          tenantId: tenant.id
        });
      });
    });
    await Permission.bulkCreate(perms, { transaction, bypassTenant: true });

    // 7. Create Admin User
    const isTempPassword = !(adminData.password && String(adminData.password).trim());
    const actualPassword = isTempPassword ? generateTemporaryPassword() : String(adminData.password).trim();
    const passwordHash = await bcrypt.hash(actualPassword, 10);

    await User.create({
      name: adminData.name,
      email: adminData.email,
      passwordHash,
      roleId: adminRole.id,
      status: 'active',
      tenantId: tenant.id,
      mustChangePassword: isTempPassword
    }, { transaction, bypassTenant: true });

    if (isTempPassword) {
      const emailResult = await emailService.sendEmail({
        to: adminData.email,
        subject: 'Welcome to Advocate Management System - Tenant Admin',
        text: `Hello ${adminData.name},\n\nYour Tenant Admin account for ${tenantData.name} has been created.\n\nYour temporary password is: ${actualPassword}\n\nPlease login and change your password immediately.\n\nLogin URL: http://localhost:5173/login`,
        html: `
          <p>Hello <strong>${adminData.name}</strong>,</p>
          <p>Your Tenant Admin account for <strong>${tenantData.name}</strong> has been successfully created.</p>
          <p>Your temporary password is: <strong>${actualPassword}</strong></p>
          <p>Please login and change your password immediately.</p>
          <p><a href="http://localhost:5173/login">Click here to login</a></p>
        `
      });

      if (!emailResult.success) {
        throw new AppError(`Failed to send welcome email: ${emailResult.error}. Tenant creation aborted.`, 500);
      }
    }

    await transaction.commit();
    return tenant;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updateTenant = async (id, data) => {
  const tenant = await getTenantById(id);
  const oldStatus = tenant.status;
  
  if (data.status) tenant.status = data.status;
  if (data.name) tenant.name = data.name;
  if (data.email) tenant.email = data.email;
  if (data.phone) tenant.phone = data.phone;
  if (data.maxUsers !== undefined) tenant.maxUsers = data.maxUsers;
  if (data.storageLimit !== undefined) tenant.storageLimit = data.storageLimit;
  if (data.address !== undefined) tenant.address = data.address;
  if (data.city !== undefined) tenant.city = data.city;
  if (data.state !== undefined) tenant.state = data.state;
  if (data.country !== undefined) tenant.country = data.country;
  if (data.pincode !== undefined) tenant.pincode = data.pincode;
  if (data.contactPerson !== undefined) tenant.contactPerson = data.contactPerson;
  if (data.website !== undefined) tenant.website = data.website;
  if (data.gstNumber !== undefined) tenant.gstNumber = data.gstNumber;
  if (data.subscriptionStart !== undefined) tenant.subscriptionStart = data.subscriptionStart;
  if (data.subscriptionEnd !== undefined) tenant.subscriptionEnd = data.subscriptionEnd;
  if (data.planId !== undefined) tenant.planId = data.planId;
  
  await tenant.save({ bypassTenant: true });

  if (data.status && data.status !== oldStatus) {
    const { User, Advocate } = require('../associations');
    const newStatus = data.status === 'active' ? 'active' : 'inactive';
    
    // Cascade status to all users and advocates inside the tenant
    await User.update({ status: newStatus }, { where: { tenantId: id }, bypassTenant: true });
    if (Advocate) {
      await Advocate.update({ status: newStatus }, { where: { tenantId: id }, bypassTenant: true });
    }
  }

  return tenant;
};

const resetAdminPassword = async (tenantId, newPassword) => {
  const tenant = await getTenantById(tenantId);
  const adminRole = await Role.findOne({ where: { name: 'Tenant Admin', tenantId }, bypassTenant: true });
  if (!adminRole) throw new AppError('Tenant Admin role not found', 404);

  const user = await User.findOne({ where: { roleId: adminRole.id, tenantId }, bypassTenant: true });
  if (!user) throw new AppError('Tenant Admin user not found', 404);

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save({ bypassTenant: true });
  return true;
};

const deleteTenant = async (id) => {
  const tenant = await getTenantById(id);
  
  // Check if tenant has cases or documents
  const casesCount = await Case.count({ where: { tenantId: id }, bypassTenant: true });
  const docsCount = await Document.count({ where: { tenantId: id }, bypassTenant: true });
  
  if (casesCount > 0 || docsCount > 0) {
    throw new AppError('Cannot delete tenant containing business data. Please suspend instead.', 400);
  }

  // Soft delete or hard delete depending on paranoid setting. 
  // Let's do hard delete since we checked for business data.
  await tenant.destroy({ bypassTenant: true });
  return true;
};

const getDashboardStats = async () => {
  const totalTenants = await Tenant.count({ bypassTenant: true });
  const activeTenants = await Tenant.count({ where: { status: 'active' }, bypassTenant: true });
  const suspendedTenants = await Tenant.count({ where: { status: 'suspended' }, bypassTenant: true });
  const totalUsers = await User.count({ bypassTenant: true });
  const totalCases = await Case.count({ bypassTenant: true });

  return {
    totalTenants,
    activeTenants,
    suspendedTenants,
    totalUsers,
    totalCases
  };
};

const checkStorageLimit = async (tenantId, incomingFileSizeInBytes) => {
  const tenant = await getTenantById(tenantId);
  if (!tenant.storageLimit) return true; // No limit set

  const docs = await Document.findAll({
    where: { tenantId },
    attributes: ['fileSize'],
    bypassTenant: true
  });

  let totalBytes = 0;
  for (const doc of docs) {
    const sizeStr = String(doc.fileSize || '');
    if (sizeStr.includes('MB')) {
      totalBytes += parseFloat(sizeStr) * 1024 * 1024;
    } else if (sizeStr.includes('KB')) {
      totalBytes += parseFloat(sizeStr) * 1024;
    } else if (sizeStr.includes('B')) {
      totalBytes += parseFloat(sizeStr);
    }
  }

  const limitBytes = tenant.storageLimit * 1024 * 1024; // storageLimit is in MB
  if (totalBytes + incomingFileSizeInBytes > limitBytes) {
    const currentMB = (totalBytes / (1024 * 1024)).toFixed(2);
    throw new AppError(`Storage limit exceeded. Current usage: ${currentMB} MB / ${tenant.storageLimit} MB. Cannot upload file.`, 400);
  }
  return true;
};

module.exports = {
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  resetAdminPassword,
  deleteTenant,
  getDashboardStats,
  checkStorageLimit
};
