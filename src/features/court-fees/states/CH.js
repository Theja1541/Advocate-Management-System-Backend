/**
 * Court Fee Calculator for Chandigarh (CH)
 * 
 * NOTE: This implementation is strictly designed for Functional Compatibility 
 * with the Century Law Firm calculator based on manually verified outputs.
 */

const { CEIL } = require('../utils');

const META = {
  stateCode: 'CH',
  stateName: 'Chandigarh',
  version: 1,
  lastUpdated: '2026-08-10',
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
 * Calculates the Court Fee for a Money Suit in Chandigarh based on CLF functional parity.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for CH Court Fee calculation');
  }

  let fee = 0;
  
  if (v <= 100) {
    fee = CEIL(v, 5) / 10;
  } else if (v <= 500) {
    fee = CEIL(v, 10) / 10;
  } else if (v <= 890) {
    fee = 75 + 0.15 * (CEIL(v, 10) - 500);
  } else if (v <= 900) {
    fee = 135.5;
  } else if (v <= 910) {
    fee = 136.5;
  } else if (v <= 1000) {
    fee = 136.5 + 0.15 * (CEIL(v, 10) - 910);
  } else if (v <= 5000) {
    fee = 150 + 0.122 * (CEIL(v, 100) - 1000);
  } else if (v <= 10000) {
    fee = 638 + 0.0976 * (CEIL(v, 250) - 5000);
  } else if (v <= 20000) {
    fee = 1126 + 0.073 * (CEIL(v, 500) - 10000);
  } else if (v <= 30000) {
    fee = 1856 + 0.0488 * (CEIL(v, 1000) - 20000);
  } else if (v <= 50000) {
    fee = 2344 + 0.0244 * (CEIL(v, 2000) - 30000);
  } else {
    fee = 2832 + 0.00976 * (CEIL(v, 5000) - 50000);
  }

  // Final rounding to nearest multiple of 0.10 if needed, but JS decimals need safe math
  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
