const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ms = require('ms');
const { User, Role, Advocate, Tenant } = require('../associations');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefresh';

const roleInclude = {
  model: Role,
  as: 'role',
  attributes: ['id', 'name'],
};

const tenantInclude = { model: Tenant, as: 'tenant', attributes: ['name', 'logo'] };
const advocateInclude = {
  model: Advocate,
  as: 'advocateProfile',
  attributes: ['id', 'tenantAdminId'],
  include: [
    {
      model: User,
      as: 'groupAdmins',
      attributes: ['id', 'name'],
      through: { attributes: [] },
    },
    {
      model: User,
      as: 'assignedTenantAdmin',
      attributes: ['id', 'name'],
    }
  ],
  required: false,
};

const getRoleName = (user) => user.role?.name || null;

const getAdvocateId = (user) =>
  user.advocateProfile?.id ?? user.advocateId ?? null;

const getRefreshCookieBaseOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  signed: true,
  sameSite: 'lax',
  path: '/',
});

const getRefreshCookieOptions = () => ({
  ...getRefreshCookieBaseOptions(),
  maxAge: ms(REFRESH_TOKEN_EXPIRES_IN),
});

const signAccessToken = (user) => {
  const payload = {
    id: user.id,
    name: user.name,
    roleId: user.roleId,
    role: getRoleName(user),
    tenantId: user.tenantId,
  tenant: user.tenant ? { name: user.tenant.name, logo: user.tenant.logo } : null,
  };
  const advocateId = getAdvocateId(user);
  if (advocateId != null) {
    payload.advocateId = advocateId;
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

const signRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
};

const toAuthUser = (user) => {
  const base = {
    id: user.id,
    name: user.name,
    email: user.email,
    roleId: user.roleId,
    role: getRoleName(user),
    status: user.status,
    advocateId: getAdvocateId(user),
    tenantId: user.tenantId,
    tenant: user.tenant ? { name: user.tenant.name, logo: user.tenant.logo } : null,
    mustChangePassword: user.mustChangePassword,
    mfaEnabled: user.mfaEnabled,
  };

  if (base.advocateId && user.advocateProfile) {
    const contexts = [];
    if (user.advocateProfile.tenantAdminId) {
      contexts.push({
        type: 'TENANT_ADMIN',
        id: user.advocateProfile.tenantAdminId,
        name: user.advocateProfile.assignedTenantAdmin?.name || 'Tenant Admin',
      });
    }
    if (user.advocateProfile.groupAdmins) {
      user.advocateProfile.groupAdmins.forEach(ga => {
        contexts.push({
          type: 'GROUP_ADMIN',
          id: ga.id,
          name: ga.name,
        });
      });
    }
    base.availableContexts = contexts;
  }
  return base;
};

const findAuthUserById = async (id) => {
  return User.findByPk(id, {
    attributes: ['id', 'name', 'email', 'roleId', 'status', 'tenantId', 'mustChangePassword', 'mfaEnabled'],
    include: [roleInclude, advocateInclude, tenantInclude],
  });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const emailService = require('../../services/emailService');

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({
      where: { email, status: 'active' },
      attributes: ['id', 'name', 'email', 'roleId', 'passwordHash', 'status', 'tenantId', 'mustChangePassword', 'mfaEnabled'],
      include: [roleInclude, advocateInclude, tenantInclude],
    });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    const isSuperAdmin = user.role && user.role.name === 'Super Admin';
    if (isSuperAdmin && user.mfaEnabled) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);

      user.mfaOtpHash = otpHash;
      user.mfaOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
      user.mfaOtpAttempts = 0;
      user.mfaOtpLastSentAt = new Date();
      await user.save();

      const emailResult = await emailService.sendEmail({
        to: user.email,
        subject: 'Login Verification Code - Advocate Management System',
        text: `Hello ${user.name},\n\nYour 6-digit verification code is: ${otp}\n\nThis code expires in 5 minutes.\nPlease do not share this code with anyone.`,
        html: `<p>Hello <strong>${user.name}</strong>,</p><p>Your 6-digit verification code is: <strong>${otp}</strong></p><p>This code expires in 5 minutes.</p><p><em>Please do not share this code with anyone.</em></p>`
      });

      if (!emailResult.success) {
        return next(new AppError('Failed to send verification email. Please try again.', 500));
      }

      return res.status(200).json({
        status: 'MFA_REQUIRED',
        userId: user.id,
      });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

    res.status(200).json({
      status: user.mustChangePassword ? 'PASSWORD_CHANGE_REQUIRED' : 'success',
      token: accessToken,
      data: {
        user: toAuthUser(user),
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

exports.verifyMfa = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findOne({
      where: { id: userId, status: 'active' },
      attributes: ['id', 'name', 'email', 'roleId', 'status', 'tenantId', 'mustChangePassword', 'mfaOtpHash', 'mfaOtpExpiresAt', 'mfaOtpAttempts', 'mfaEnabled'],
      include: [roleInclude, advocateInclude, tenantInclude],
    });

    if (!user) {
      return next(new AppError('User not found or inactive', 401));
    }

    if (!user.mfaOtpHash || !user.mfaOtpExpiresAt) {
      return next(new AppError('No pending verification found', 400));
    }

    if (user.mfaOtpAttempts >= 5) {
      return next(new AppError('Maximum verification attempts exceeded. Please request a new code.', 429));
    }

    if (new Date() > new Date(user.mfaOtpExpiresAt)) {
      return next(new AppError('Verification code has expired. Please request a new code.', 400));
    }

    if (!(await bcrypt.compare(otp, user.mfaOtpHash))) {
      user.mfaOtpAttempts += 1;
      await user.save();
      return next(new AppError('Incorrect verification code', 401));
    }

    user.mfaOtpHash = null;
    user.mfaOtpExpiresAt = null;
    user.mfaOtpAttempts = 0;
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

    res.status(200).json({
      status: user.mustChangePassword ? 'PASSWORD_CHANGE_REQUIRED' : 'success',
      token: accessToken,
      data: {
        user: toAuthUser(user),
      },
    });
  } catch (error) {
    logger.error('Verify MFA error:', error);
    next(error);
  }
};

exports.resendMfa = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const emailService = require('../../services/emailService');

    const user = await User.findOne({
      where: { id: userId, status: 'active' },
      attributes: ['id', 'name', 'email', 'mfaOtpLastSentAt'],
    });

    if (!user) {
      return next(new AppError('User not found or inactive', 401));
    }

    if (user.mfaOtpLastSentAt) {
      const timeSinceLastSent = Date.now() - new Date(user.mfaOtpLastSentAt).getTime();
      if (timeSinceLastSent < 60000) {
        return next(new AppError('Please wait 60 seconds before requesting a new code.', 429));
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    user.mfaOtpHash = otpHash;
    user.mfaOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    user.mfaOtpAttempts = 0;
    user.mfaOtpLastSentAt = new Date();
    await user.save();

    const emailResult = await emailService.sendEmail({
      to: user.email,
      subject: 'Login Verification Code - Advocate Management System',
      text: `Hello ${user.name},\n\nYour new 6-digit verification code is: ${otp}\n\nThis code expires in 5 minutes.\nPlease do not share this code with anyone.`,
      html: `<p>Hello <strong>${user.name}</strong>,</p><p>Your new 6-digit verification code is: <strong>${otp}</strong></p><p>This code expires in 5 minutes.</p><p><em>Please do not share this code with anyone.</em></p>`
    });

    if (!emailResult.success) {
      return next(new AppError('Failed to send verification email. Please try again.', 500));
    }

    res.status(200).json({
      status: 'success',
      message: 'A new verification code has been sent to your email.'
    });
  } catch (error) {
    logger.error('Resend MFA error:', error);
    next(error);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('refreshToken', getRefreshCookieBaseOptions());
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.signedCookies.refreshToken || req.cookies.refreshToken;

    if (!refreshToken) {
      return next(new AppError('No refresh token provided', 401));
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    const user = await findAuthUserById(decoded.id);

    if (!user || user.status !== 'active') {
      return next(
        new AppError('User belonging to this token no longer exists or is inactive', 401)
      );
    }

    if (!getRoleName(user)) {
      return next(new AppError('User role is missing or invalid', 401));
    }

    const accessToken = signAccessToken(user);

    res.status(200).json({
      status: 'success',
      token: accessToken,
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    return next(new AppError('Invalid or expired refresh token', 401));
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await findAuthUserById(req.user.id);

    if (!user || user.status !== 'active') {
      return next(new AppError('User not found or inactive', 401));
    }

    if (!getRoleName(user)) {
      return next(new AppError('User role is missing or invalid', 401));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: toAuthUser(user),
      },
    });
  } catch (error) {
    logger.error('GetMe error:', error);
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'passwordHash', 'mustChangePassword', 'mfaEnabled']
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (currentPassword === newPassword) {
      return next(new AppError('New password cannot be the same as the current password', 400));
    }

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return next(new AppError('Incorrect current password', 401));
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    user.passwordHash = newPasswordHash;
    user.mustChangePassword = false;
    await user.save();
    
    res.clearCookie('refreshToken', getRefreshCookieBaseOptions());

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully. Please log in again with your new password.',
    });
  } catch (error) {
    logger.error('Change password error:', error);
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { User } = require('../associations');
    const { generateTemporaryPassword } = require('../../utils/cryptoUtil');
    const emailService = require('../../services/emailService');
    const bcrypt = require('bcrypt');
    const AppError = require('../../utils/AppError');
    const email = req.body.email ? String(req.body.email).toLowerCase().trim() : '';
    if (!email) return next(new AppError('Please provide an email address', 400));

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(200).json({ status: 'success', message: 'If that email is in our database, we have sent a password reset link to it.' });
    }

    const tempPassword = generateTemporaryPassword();
    user.passwordHash = await bcrypt.hash(tempPassword, 10);
    user.mustChangePassword = true;
    await user.save();

    const emailResult = await emailService.sendEmail({
      to: email,
      subject: 'Password Reset - Advocate Management System',
      text: `Hello ${user.name},\n\nWe received a request to reset your password.\n\nYour new temporary password is: ${tempPassword}\n\nPlease login and change your password immediately.\n\nLogin URL: http://localhost:5173/login`,
      html: `<p>Hello <strong>${user.name}</strong>,</p><p>We received a request to reset your password.</p><p>Your new temporary password is: <strong>${tempPassword}</strong></p><p>Please login and change your password immediately.</p><p><a href="http://localhost:5173/login">Click here to login</a></p>`
    });

    if (!emailResult.success) {
      return next(new AppError(`Failed to send email: ${emailResult.error}`, 500));
    }

    res.status(200).json({ status: 'success', message: 'If that email is in our database, we have sent a password reset link to it.' });
  } catch (error) {
    next(error);
  }
};




exports.toggleMfa = async (req, res, next) => {
  try {
    const { password, enabled } = req.body;
    
    if (!password) {
      return next(new AppError('Password is required', 400));
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'passwordHash', 'mfaEnabled']
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (!(await bcrypt.compare(password, user.passwordHash))) {
      return next(new AppError('Incorrect password', 401));
    }

    user.mfaEnabled = !!enabled;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: `Multi-Factor Authentication ${user.mfaEnabled ? 'enabled' : 'disabled'} successfully.`,
      mfaEnabled: user.mfaEnabled
    });
  } catch (error) {
    logger.error('Toggle MFA error:', error);
    next(error);
  }
};
