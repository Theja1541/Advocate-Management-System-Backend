const path = require('path');
const fs = require('fs');
const { GlobalSetting } = require('../associations');
const logger = require('../../config/logger');
const AppError = require('../../utils/AppError');

exports.getPublicSettings = async (req, res, next) => {
  try {
    const logoSetting = await GlobalSetting.findOne({ where: { key: 'SUPER_ADMIN_LOGO' } });
    res.status(200).json({
      status: 'success',
      data: {
        logo: logoSetting ? logoSetting.value : null,
      },
    });
  } catch (error) {
    logger.error('GetPublicSettings error:', error);
    next(error);
  }
};

exports.uploadSuperAdminLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No logo file provided', 400));
    }

    const newLogoPath = `/${req.file.path.replace(/\\/g, '/')}`;

    let logoSetting = await GlobalSetting.findOne({ where: { key: 'SUPER_ADMIN_LOGO' } });

    if (logoSetting && logoSetting.value) {
      // Delete old file if it exists
      const oldFilePath = path.join(__dirname, '../../../', logoSetting.value);
      if (fs.existsSync(oldFilePath) && oldFilePath !== path.join(__dirname, '../../../', newLogoPath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    if (logoSetting) {
      logoSetting.value = newLogoPath;
      await logoSetting.save();
    } else {
      logoSetting = await GlobalSetting.create({
        key: 'SUPER_ADMIN_LOGO',
        value: newLogoPath,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Super Admin logo updated successfully',
      data: {
        logo: logoSetting.value,
      },
    });
  } catch (error) {
    logger.error('UploadSuperAdminLogo error:', error);
    next(error);
  }
};
