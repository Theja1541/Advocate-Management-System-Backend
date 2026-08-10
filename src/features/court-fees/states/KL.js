const { CEIL } = require('../utils');

/**
 * Court Fee Calculator for Kerala (KL)
 * 
 * NOTE: This implementation is strictly designed for Functional Compatibility 
 * with the Century Law Firm calculator based on manually verified outputs.
 * It has NOT been independently verified against the statutory 
 * Kerala Court-Fees Act schedule.
 */

const META = {
  stateCode: 'KL',
  stateName: 'Kerala',
  version: 1,
  lastUpdated: '2026-08-07',
  implementationType: 'Functional Compatibility',
  reference: 'Century Law Firm Court Fee Calculator',
  verifiedAgainstReference: true,
  statutoryVerification: false
};

/**
 * Validates the input for court fee calculation.
 * @param {number} suitValue - The value of the suit
 * @returns {{ isValid: boolean, error: string|null }}
 */
function validateInput(suitValue) {
  if (suitValue === undefined || suitValue === null) {
    return { isValid: false, error: 'suitValue is required' };
  }
  const numericValue = Number(suitValue);
  if (isNaN(numericValue) || numericValue <= 0) {
    return { isValid: false, error: 'suitValue must be a positive number greater than 0' };
  }
  return { isValid: true, error: null };
}

/**
 * Calculates the Court Fee for a Money Suit in Kerala based on CLF functional parity.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for KL Court Fee calculation');
  }

  let fee = 0;
  
  if (v <= 100) { 
    fee = 4;
  }
  else if (v <= 15000) { 
    fee = CEIL(v, 100) * 0.04; 
  }
  else if (v <= 50000) { 
    fee = 600 + CEIL(v - 15000, 100) * 0.08; 
  }
  else if (v <= 1000000) { 
    fee = 3400 + CEIL(v - 50000, 100) * 0.10; 
  }
  else if (v <= 10000000) { 
    fee = 98400 + CEIL(v - 1000000, 100) * 0.08; 
  }
  else { 
    fee = 818400 + CEIL(v - 10000000, 100) * 0.01; 
  }

  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
