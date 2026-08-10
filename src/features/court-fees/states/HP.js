/**
 * Court Fee Calculator for Himachal Pradesh (HP)
 * 
 * NOTE: This implementation is strictly designed for Functional Compatibility 
 * with the Century Law Firm calculator based on manually verified outputs.
 */

const { CEIL } = require('../utils');

const META = {
  stateCode: 'HP',
  stateName: 'Himachal Pradesh',
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
 * Calculates the Court Fee for a Money Suit in Himachal Pradesh based on CLF functional parity.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for HP Court Fee calculation');
  }

  let fee = 0;
  
  if (v <= 100) {
    fee = CEIL(v, 5) * 0.2;
  } else if (v <= 500) {
    fee = 20 + (CEIL(v, 10) - 100) * 0.1;
  } else if (v <= 1000) {
    fee = 60 + (CEIL(v, 10) - 500) * 0.2;
  } else if (v <= 5000) {
    fee = 160 + (CEIL(v, 100) - 1000) * 0.15;
  } else if (v <= 10000) {
    fee = 760 + (CEIL(v, 250) - 5000) * 0.1;
  } else if (v <= 20000) {
    fee = 1260 + (CEIL(v, 500) - 10000) * 0.08;
  } else if (v <= 30000) {
    fee = 2060 + (CEIL(v, 1000) - 20000) * 0.05;
  } else if (v <= 50000) {
    fee = 2560 + (CEIL(v, 2000) - 30000) * 0.025;
  } else {
    fee = 3060 + (CEIL(v, 5000) - 50000) * 0.01;
  }

  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
