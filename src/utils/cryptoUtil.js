const crypto = require('crypto');
require('dotenv').config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended IV size
const AUTH_TAG_LENGTH = 16; // GCM auth tag size

const getKey = () => {
  const keyHex = process.env.SMTP_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('Invalid or missing SMTP_ENCRYPTION_KEY. Must be a 32-byte (64 char) hex string.');
  }
  return Buffer.from(keyHex, 'hex');
};

/**
 * Encrypts a plaintext string.
 * @param {string} text - The plaintext string to encrypt.
 * @returns {string} The encrypted string in format: iv:authTag:encryptedData (hex encoded)
 */
const encrypt = (text) => {
  if (!text) return text;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts an encrypted string.
 * @param {string} text - The encrypted string.
 * @returns {string} The decrypted plaintext.
 */
const decrypt = (text) => {
  if (!text) return text;
  const parts = text.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format.');
  }
  
  const key = getKey();
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

const generateTemporaryPassword = (length = 12) => {
  // Generate a random hex string. 1 byte = 2 hex chars.
  // Using Math.ceil to ensure we have enough characters before truncating.
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

module.exports = {
  encrypt,
  decrypt,
  generateTemporaryPassword,
};

// Validate key on startup
try {
  getKey();
} catch (error) {
  console.warn('WARNING:', error.message);
}
