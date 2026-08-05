const tenantService = require('./tenantService');
const logger = require('../../config/logger');
const AppError = require('../../utils/AppError');
const fs = require('fs');
const path = require('path');
const { Tenant } = require('../associations');

exports.getAllTenants = async (req, res, next) => {
  try {
    const tenants = await tenantService.getTenants();
    res.status(200).json({ status: 'success', data: { tenants } });
  } catch (error) {
    logger.error('GetAllTenants error:', error);
    next(error);
  }
};

exports.getTenantById = async (req, res, next) => {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);
    res.status(200).json({ status: 'success', data: { tenant } });
  } catch (error) {
    logger.error('GetTenantById error:', error);
    next(error);
  }
};

exports.createTenant = async (req, res, next) => {
  try {
    const { tenantData, adminData } = req.body;
    if (!tenantData || !adminData) {
      return next(new AppError('tenantData and adminData are required', 400));
    }
    const tenant = await tenantService.createTenant(tenantData, adminData);
    res.status(201).json({ status: 'success', data: { tenant } });
  } catch (error) {
    logger.error('CreateTenant error:', error);
    next(error);
  }
};

exports.updateTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: { tenant } });
  } catch (error) {
    logger.error('UpdateTenant error:', error);
    next(error);
  }
};

exports.uploadLogo = async (req, res, next) => {
  try {
    const tenantId = req.params.id;
    
    // Authorization: Super Admin can upload for anyone. Tenant Admin can upload for their own tenant.
    if (req.user.role !== 'Super Admin' && String(req.user.tenantId) !== String(tenantId)) {
      return next(new AppError('Not authorized to update this tenant logo', 403));
    }

    if (!req.file) {
      return next(new AppError('No logo file provided', 400));
    }

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return next(new AppError('Tenant not found', 404));
    }

    const newLogoPath = `/${req.file.path.replace(/\\/g, '/')}`;

    if (tenant.logo) {
      // Delete old file if it exists
      const oldFilePath = path.join(__dirname, '../../../../', tenant.logo);
      if (fs.existsSync(oldFilePath) && oldFilePath !== path.join(__dirname, '../../../../', newLogoPath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    tenant.logo = newLogoPath;
    await tenant.save();

    res.status(200).json({
      status: 'success',
      message: 'Tenant logo updated successfully',
      data: {
        logo: tenant.logo,
      },
    });
  } catch (error) {
    logger.error('UploadTenantLogo error:', error);
    next(error);
  }
};

exports.resetAdminPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return next(new AppError('newPassword is required', 400));
    
    await tenantService.resetAdminPassword(req.params.id, newPassword);
    res.status(200).json({ status: 'success', message: 'Password reset successfully' });
  } catch (error) {
    logger.error('ResetAdminPassword error:', error);
    next(error);
  }
};

exports.deleteTenant = async (req, res, next) => {
  try {
    await tenantService.deleteTenant(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteTenant error:', error);
    next(error);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const stats = await tenantService.getDashboardStats();
    res.status(200).json({ status: 'success', data: { stats } });
  } catch (error) {
    logger.error('GetDashboardStats error:', error);
    next(error);
  }
};
