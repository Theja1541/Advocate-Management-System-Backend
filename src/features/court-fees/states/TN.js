const { CEIL } = require('../utils');

/**
 * Court Fee Calculator for Tamil Nadu (TN)
 * 
 * NOTE: This implementation is strictly designed for Functional Compatibility 
 * with the Century Law Firm calculator based on manually verified outputs.
 * It has NOT been independently verified against the statutory 
 * Tamil Nadu Court-Fees Act schedule.
 */

const META = {
  stateCode: 'TN',
  stateName: 'Tamil Nadu',
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
 * Calculates the Court Fee for a Money Suit in Tamil Nadu based on CLF functional parity.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for TN Court Fee calculation');
  }

  let fee = 0;
  
  if (v <= 100) { 
    fee = (CEIL(v, 5) / 5) * 0.40; 
  } else { 
    fee = 8.00 + (CEIL(v - 100, 10) / 10) * 0.75; 
  }

  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
