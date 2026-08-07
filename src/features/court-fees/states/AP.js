const { CEIL } = require('../utils');

/**
 * Court Fee Calculator for Andhra Pradesh (AP)
 * 
 * Based on the Andhra Pradesh Court-fees and Suits Valuation Act, 1956.
 * Schedule I — Ad Valorem fees on plaints, written statements, etc.
 */

const META = {
  stateCode: 'AP',
  stateName: 'Andhra Pradesh',
  version: 1,
  lastUpdated: '2026-08-06',
  legislation: {
    act: 'Andhra Pradesh Court-fees and Suits Valuation Act, 1956',
    amendment: null,
    effectiveDate: null,
    citation: 'AP Act VII of 1956, Schedule I',
    verified: true,
  },
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
 * Calculates the statutory Court Fee for a Money Suit in Andhra Pradesh.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for AP Court Fee calculation');
  }

  let fee = 0;
  
  if (v <= 100) { 
    fee = CEIL(v, 5) * 0.12; 
  }
  else if (v <= 1000) { 
    fee = 12 + (CEIL(v, 10) - 100) * 0.11; 
  }
  else if (v <= 10000) { 
    fee = 111 + (CEIL(v, 100) - 1000) * 0.075; 
  }
  else if (v <= 20000) { 
    fee = 786 + (CEIL(v, 500) - 10000) * 0.06; 
  }
  else if (v <= 30000) { 
    fee = 1386 + (CEIL(v, 1000) - 20000) * 0.04; 
  }
  else if (v <= 50000) { 
    fee = 1786 + (CEIL(v, 2000) - 30000) * 0.03; 
  }
  else if (v <= 54000) { 
    fee = 2446; 
  }
  else if (v <= 58000) { 
    fee = 2546; 
  }
  else if (v <= 98000) { 
    fee = 2586 + (CEIL(v, 4000) - 62000) * 0.02; 
  }
  else if (v <= 100000) { 
    fee = 3426; 
  }
  else { 
    fee = 3426 + (CEIL(v, 10000) - 100000) * 0.01; 
  }

  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
