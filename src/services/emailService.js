const nodemailer = require('nodemailer');
const { SmtpSetting } = require('../features/associations');
const logger = require('../config/logger');

/**
 * Creates and returns a Nodemailer transporter configured from the global SmtpSetting.
 * @returns {Promise<{transporter: object, smtp: object}>}
 */
const getTransporter = async () => {
  const smtp = await SmtpSetting.findOne({ where: { is_active: true } });
  
  if (!smtp) {
    throw new Error('SMTP configuration not found. Please ask the Super Admin to configure SMTP.');
  }

  const password = smtp.getDecryptedPassword();

  let transporterOptions = {
    host: smtp.smtp_host,
    port: smtp.smtp_port,
    secure: smtp.encryption_type === 'ssl' || smtp.smtp_port === 465,
  };

  if (smtp.smtp_auth_enabled && smtp.smtp_username && password) {
    transporterOptions.auth = {
      user: smtp.smtp_username,
      pass: password,
    };
  }
  
  if (smtp.encryption_type === 'none') {
    transporterOptions.secure = false;
    transporterOptions.ignoreTLS = true;
  } else if (smtp.encryption_type === 'tls') {
    transporterOptions.secure = false; // Nodemailer uses STARTTLS automatically if port is 587
  }

  const transporter = nodemailer.createTransport(transporterOptions);

  return { transporter, smtp };
};

/**
 * Sends an email using the global SMTP configuration.
 *
 * @param {Object} options
 * @param {string|string[]} options.to - Recipient email address(es)
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content
 * @returns {Promise<Object>} Result of the send operation
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const { transporter, smtp } = await getTransporter();

    const mailOptions = {
      from: `"${smtp.sender_name}" <${smtp.from_email}>`,
      replyTo: smtp.reply_to_email || smtp.from_email,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send email:', error);
    // Return a controlled failure object instead of throwing to allow graceful degradation
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  getTransporter // exported mainly to allow testing via settingsController without rewriting the success/fail log logic there
};
