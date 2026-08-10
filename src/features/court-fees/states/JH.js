/**
 * Court Fee Calculator for Jharkhand (JH)
 * 
 * NOTE: This implementation is strictly designed for Functional Compatibility 
 * with the Century Law Firm calculator based on manually verified outputs.
 */

const { CEIL } = require('../utils');

const META = {
  stateCode: 'JH',
  stateName: 'Jharkhand',
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
 * Calculates the Court Fee for a Money Suit in Jharkhand based on CLF functional parity.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for JH Court Fee calculation');
  }

  let fee = 0;
  
  if (v <= 100) {
    fee = CEIL(v, 5) * 0.2;
  } else if (v <= 1000) {
    fee = 20 + CEIL(v - 100, 10) * 0.2;
  } else if (v <= 5000) {
    fee = 200 + CEIL(v - 1000, 100) * 0.16;
  } else if (v <= 10000) {
    fee = 840 + CEIL(v - 5000, 250) * 0.128;
  } else if (v <= 20000) {
    fee = 1480 + CEIL(v - 10000, 500) * 0.096;
  } else if (v <= 30000) {
    fee = 2440 + CEIL(v - 20000, 1000) * 0.064;
  } else if (v <= 50000) {
    // Verified against CLF output for 35,000: uses a step of 2000, unlike BR.js
    fee = 3080 + CEIL(v - 30000, 2000) * 0.032;
  } else {
    fee = 3720 + CEIL(v - 50000, 5000) * 0.016;
  }

  // Maximum cap is 50000
  if (fee > 50000) {
    fee = 50000;
  }

  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
