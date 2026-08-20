const path = require('path');
const fs = require('fs');
const { GlobalSetting, SmtpSetting } = require('../associations');
const logger = require('../../config/logger');
const AppError = require('../../utils/AppError');
const emailService = require('../../services/emailService');
const { encrypt, decrypt } = require('../../utils/cryptoUtil');

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

exports.getSmtpSettings = async (req, res, next) => {
  try {
    let smtp = await SmtpSetting.findOne({ where: { is_active: true } });
    if (!smtp) {
      return res.status(200).json({
        status: 'success',
        data: null,
      });
    }

    // The toJSON override in model automatically strips smtp_password_encrypted
    const responseData = smtp.toJSON();
    // Indicate if password is set without exposing it
    responseData.passwordConfigured = !!smtp.smtp_password_encrypted;

    res.status(200).json({
      status: 'success',
      data: responseData,
    });
  } catch (error) {
    logger.error('getSmtpSettings error:', error);
    next(error);
  }
};

exports.updateSmtpSettings = async (req, res, next) => {
  try {
    let smtp = await SmtpSetting.findOne({ where: { is_active: true } });
    const payload = { ...req.body };

    if (payload.reply_to_email === '') {
      payload.reply_to_email = null;
    }

    if (payload.smtp_password) {
      payload.smtp_password_encrypted = encrypt(payload.smtp_password);
    }
    // Never accidentally overwrite from request body payload unless explicit
    delete payload.smtp_password;
    delete payload.test_status;
    delete payload.last_tested_at;
    delete payload.last_test_result;

    payload.updated_by = req.user.id;

    if (!smtp) {
      payload.created_by = req.user.id;
      smtp = await SmtpSetting.create(payload);
    } else {
      await smtp.update(payload);
    }

    const responseData = smtp.toJSON();
    responseData.passwordConfigured = !!smtp.smtp_password_encrypted;

    res.status(200).json({
      status: 'success',
      message: 'SMTP settings updated successfully',
      data: responseData,
    });
  } catch (error) {
    logger.error('updateSmtpSettings error:', error);
    next(error);
  }
};

exports.testSmtpSettings = async (req, res, next) => {
  try {
    const { test_email } = req.body;
    let smtp = await SmtpSetting.findOne({ where: { is_active: true } });

    if (!smtp) {
      return next(new AppError('SMTP configuration not found. Please configure SMTP first.', 404));
    }

    const result = await emailService.sendEmail({
      to: test_email,
      subject: 'Test Email - Advocate Management System',
      text: 'This is a test email sent from your Advocate Management System to verify the global SMTP configuration.',
      html: '<p>This is a test email sent from your <strong>Advocate Management System</strong> to verify the global SMTP configuration.</p>',
    });

    if (result.success) {
      smtp.test_status = 'success';
      smtp.last_tested_at = new Date();
      smtp.last_test_result = `Message accepted. ID: ${result.messageId}`;
      await smtp.save();

      const responseData = smtp.toJSON();
      responseData.passwordConfigured = !!smtp.smtp_password_encrypted;

      res.status(200).json({
        status: 'success',
        message: 'Test email sent successfully.',
        data: responseData,
      });

    } else {
      smtp.test_status = 'failed';
      smtp.last_tested_at = new Date();
      smtp.last_test_result = result.error;
      await smtp.save();

      const responseData = smtp.toJSON();
      responseData.passwordConfigured = !!smtp.smtp_password_encrypted;

      return res.status(500).json({
        status: 'error',
        message: 'Failed to send test email.',
        error: result.error,
        data: responseData
      });
    }
  } catch (error) {
    logger.error('testSmtpSettings error:', error);
    next(error);
  }
};
