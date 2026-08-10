/**
 * Court Fee Calculator for Jammu and Kashmir (JK)
 * 
 * NOTE: This implementation is strictly designed for Functional Compatibility 
 * with the Century Law Firm calculator based on manually verified outputs.
 */

const { CEIL } = require('../utils');

const META = {
  stateCode: 'JK',
  stateName: 'Jammu and Kashmir',
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
 * Calculates the Court Fee for a Money Suit in Jammu and Kashmir based on CLF functional parity.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for JK Court Fee calculation');
  }

  let fee = 0;
  
  if (v <= 100) {
    fee = 10;
  } else if (v <= 1000) {
    fee = CEIL(v, 10) * 0.1;
  } else if (v <= 1100) {
    fee = 106.2;
  } else if (v <= 1200) {
    fee = 112.5;
  } else if (v <= 1300) {
    fee = 118.75;
  } else if (v <= 2600) {
    fee = 118.75 + 0.0625 * (CEIL(v, 100) - 1300);
  } else if (v <= 2700) {
    fee = 206.15;
  } else if (v <= 2800) {
    fee = 212.5;
  } else if (v <= 2900) {
    fee = 218.75;
  } else if (v <= 5000) {
    fee = 218.75 + 0.0625 * (CEIL(v, 100) - 2900);
  } else if (v <= 10000) {
    fee = 350 + 0.08 * (CEIL(v, 250) - 5000);
  } else if (v <= 20000) {
    fee = 750 + 0.1 * (CEIL(v, 500) - 10000);
  } else if (v <= 30000) {
    fee = 1750 + 0.1 * (CEIL(v, 1000) - 20000);
  } else if (v <= 32000) {
    fee = 2900;
  } else if (v <= 34000) {
    fee = 3150;
  } else if (v <= 50000) {
    fee = 3150 + 0.075 * (CEIL(v, 2000) - 34000);
  } else if (v <= 52500) {
    fee = 4500;
  } else if (v <= 55000) {
    fee = 4600;
  } else if (v <= 57500) {
    fee = 4800;
  } else if (v <= 75000) {
    fee = 4800 + 0.06 * (CEIL(v, 2500) - 57500);
  } else if (v <= 100000) {
    fee = 5850 + 0.03 * (CEIL(v, 5000) - 75000);
  } else if (v <= 1000000) {
    fee = 6600 + 0.02 * (CEIL(v, 10000) - 100000);
  } else if (v <= 2000000) {
    fee = 24600 + 0.012 * (CEIL(v, 100000) - 1000000);
  } else {
    fee = 36600 + 0.005 * (CEIL(v, 100000) - 2000000);
  }

  // Maximum cap
  if (fee > 75000) {
    fee = 75000;
  }

  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
