/**
 * Court Fee Calculator for Odisha (OR)
 * 
 * NOTE: This implementation is strictly designed for Functional Compatibility 
 * with the Century Law Firm calculator based on manually verified outputs.
 */

const { CEIL } = require('../utils');

const META = {
  stateCode: 'OR',
  stateName: 'Odisha',
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
 * Calculates the Court Fee for a Money Suit in Odisha based on CLF functional parity.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for OR Court Fee calculation');
  }

  let fee = 0;
  
  if (v <= 100) {
    fee = CEIL(v, 5) * 0.07;
  } else if (v <= 500) {
    fee = 7 + CEIL(v - 100, 10) * 0.10;
  } else if (v <= 1000) {
    fee = 47 + CEIL(v - 500, 10) * 0.11;
  } else if (v <= 7500) {
    fee = 102 + CEIL(v - 1000, 100) * 0.075;
  } else if (v <= 10000) {
    fee = 589.50 + CEIL(v - 7500, 100) * 0.06;
  } else if (v <= 20000) {
    fee = 739.50 + CEIL(v - 10000, 500) * 0.045;
  } else if (v <= 30000) {
    fee = 1189.50 + CEIL(v - 20000, 1000) * 0.03;
  } else if (v <= 50000) {
    fee = 1489.50 + CEIL(v - 30000, 1000) * 0.015;
  } else {
    fee = 1789.50 + CEIL(v - 50000, 5000) * 0.02;
  }

  // No maximum fee cap in Odisha based on CLF outputs
  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
