const userService = require('./userService');
const emailService = require('../../services/emailService');
const logger = require('../../config/logger');

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({
      status: 'success',
      data: { users },
    });
  } catch (error) {
    logger.error('GetAllUsers error:', error);
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    logger.error('GetUserById error:', error);
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    logger.error('CreateUser error:', error);
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    logger.error('UpdateUser error:', error);
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteUser error:', error);
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { tempPassword, email } = await userService.resetPassword(req.params.id);

    const emailResult = await emailService.sendEmail({
      to: email,
      subject: 'Your Password Has Been Reset',
      text: `Your password has been reset by the administrator. Your new temporary password is: ${tempPassword}\nPlease login and change your password immediately.`,
      html: `<p>Your password has been reset by the administrator.</p><p>Your new temporary password is: <strong>${tempPassword}</strong></p><p>Please login and change your password immediately.</p>`
    });

    if (!emailResult.success) {
      logger.error(`Failed to send reset password email to ${email}: ${emailResult.error}`);
      return res.status(500).json({
        status: 'error',
        message: 'Password was reset, but failed to send the email with the new password. Please contact support.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset and emailed to the user successfully.',
    });
  } catch (error) {
    logger.error('ResetPassword error:', error);
    next(error);
  }
};
