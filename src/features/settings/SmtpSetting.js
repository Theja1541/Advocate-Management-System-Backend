const { DataTypes, Model, Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const { encrypt, decrypt } = require('../../utils/cryptoUtil');

class SmtpSetting extends Model {
  // Instance method to get decrypted password
  getDecryptedPassword() {
    if (!this.smtp_password_encrypted) return null;
    try {
      return decrypt(this.smtp_password_encrypted);
    } catch (error) {
      console.error('Failed to decrypt SMTP password', error);
      return null;
    }
  }

  // Override toJSON to ensure encrypted password is never exposed
  toJSON() {
    const values = Object.assign({}, this.get());
    delete values.smtp_password_encrypted;
    return values;
  }
}

SmtpSetting.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'custom',
      validate: {
        isIn: [['custom', 'gmail', 'sendgrid', 'mailgun', 'amazon_ses', 'office365']]
      }
    },
    sender_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    from_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true,
      }
    },
    reply_to_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      }
    },
    smtp_host: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    smtp_port: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 587,
      validate: {
        isInt: true,
        min: 1,
        max: 65535,
      }
    },
    encryption_type: {
      type: DataTypes.ENUM('none', 'ssl', 'tls'),
      allowNull: false,
      defaultValue: 'tls',
      validate: {
        isIn: [['none', 'ssl', 'tls']]
      }
    },
    smtp_auth_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    smtp_username: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    smtp_password_encrypted: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    test_status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    last_tested_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_test_result: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    }
  },
  {
    sequelize,
    modelName: 'SmtpSetting',
    tableName: 'smtp_settings',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeSave: async (smtpSetting, options) => {
        // Example hook if we were to encrypt plaintext password on save.
        // Assuming the controller sets a virtual field `password_plain`
        if (smtpSetting.password_plain) {
          smtpSetting.smtp_password_encrypted = encrypt(smtpSetting.password_plain);
        }
        
        // Ensure only one global setting is active
        if (smtpSetting.is_active) {
          await SmtpSetting.update(
            { is_active: false },
            { 
              where: { id: { [Op.ne]: smtpSetting.id || 0 } }, 
              transaction: options.transaction 
            }
          );
        }
      }
    }
  }
);

module.exports = SmtpSetting;
