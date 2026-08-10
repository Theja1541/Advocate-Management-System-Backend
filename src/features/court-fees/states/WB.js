const { CEIL } = require('../utils');

/**
 * Court Fee Calculator for West Bengal (WB)
 * 
 * NOTE: This implementation is strictly designed for Functional Compatibility 
 * with the Century Law Firm calculator based on manually verified outputs.
 */

const META = {
  stateCode: 'WB',
  stateName: 'West Bengal',
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
 * Calculates the Court Fee for a Money Suit in West Bengal based on CLF functional parity.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for WB Court Fee calculation');
  }

  let fee = 0;
  
  if (v <= 1000) {
    fee = CEIL(v, 100) * 0.10;
  } else if (v <= 7500) {
    fee = 100 + CEIL(v - 1000, 100) * 0.08;
  } else if (v <= 10000) {
    fee = 620 + CEIL(v - 7500, 250) * 0.064;
  } else if (v <= 20000) {
    fee = 780 + CEIL(v - 10000, 500) * 0.06;
  } else if (v <= 50000) {
    fee = 1380 + CEIL(v - 20000, 1000) * 0.05;
  } else if (v <= 100000) {
    fee = 2880 + CEIL(v - 50000, 5000) * 0.07;
  } else if (v <= 200000) {
    fee = 6380 + CEIL(v - 100000, 5000) * 0.074;
  } else if (v <= 300000) {
    fee = 13780 + CEIL(v - 200000, 5000) * 0.042;
  } else {
    fee = 17980 + CEIL(v - 300000, 10000) * 0.01;
  }

  // Maximum fee cap in West Bengal
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
