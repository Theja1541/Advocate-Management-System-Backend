/**
 * Court Fee Calculator for Karnataka (KA)
 *
 * Based on the Karnataka Court-Fees and Suits Valuation Act, 1958.
 * Schedule I, Article 1 — Ad Valorem fees on plaints,
 * written statements pleading a set-off or counterclaim,
 * and memorandums of appeal.
 *
 * NOTE: This is a continuous marginal-rate schedule (not a CEIL step function).
 * Each slab applies a flat base fee plus a percentage of the amount
 * EXCEEDING the lower boundary of that slab.
 *
 * The 2020 Amendment (Karnataka Court Fees and Suits Valuation
 * (Amendment) Act, 2020) did NOT alter these fee rates — it only
 * increased the court fee refund from 75% to 100% for cases settled
 * through mediation/Lok Adalat.
 */

const META = {
  stateCode: 'KA',
  stateName: 'Karnataka',
  version: 1,
  lastUpdated: '2026-08-07',
  legislation: {
    act: 'Karnataka Court-Fees and Suits Valuation Act, 1958',
    amendment: 'Karnataka Court Fees and Suits Valuation (Amendment) Act, 2020 (refund provisions only; fee rates unchanged)',
    effectiveDate: null,
    citation: 'Schedule I, Article 1 — Ad Valorem Fees',
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
 * Calculates the statutory Court Fee for a Money Suit in Karnataka.
 *
 * Schedule I, Article 1 — Karnataka Court-Fees and Suits Valuation Act, 1958:
 *
 * Slab (i)   : v ≤ 15,000               → 2.5% of v
 * Slab (ii)  : 15,000 < v ≤ 75,000      → 375 + 7.5% of (v − 15,000)
 * Slab (iii) : 75,000 < v ≤ 2,50,000    → 4,875 + 7% of (v − 75,000)
 * Slab (iv)  : 2,50,000 < v ≤ 5,00,000  → 17,125 + 6.5% of (v − 2,50,000)
 * Slab (v)   : 5,00,000 < v ≤ 7,50,000  → 33,375 + 6% of (v − 5,00,000)
 * Slab (vi)  : 7,50,000 < v ≤ 10,00,000 → 48,375 + 5.5% of (v − 7,50,000)
 * Slab (vii) : 10,00,000 < v ≤ 15,00,000 → 62,125 + 5% of (v − 10,00,000)
 * Slab (viii): 15,00,000 < v ≤ 20,00,000 → 87,125 + 4.5% of (v − 15,00,000)
 * Slab (ix)  : 20,00,000 < v ≤ 25,00,000 → 1,09,625 + 4% of (v − 20,00,000)
 * Slab (x)   : 25,00,000 < v ≤ 30,00,000 → 1,29,625 + 3.5% of (v − 25,00,000)
 * Slab (xi)  : 30,00,000 < v ≤ 40,00,000 → 1,47,125 + 3% of (v − 30,00,000)
 * Slab (xii) : 40,00,000 < v ≤ 50,00,000 → 1,77,125 + 2.5% of (v − 40,00,000)
 * Slab (xiii): 50,00,000 < v ≤ 60,00,000 → 2,02,125 + 2% of (v − 50,00,000)
 * Slab (xiv) : 60,00,000 < v ≤ 70,00,000 → 2,22,125 + 1.5% of (v − 60,00,000)
 * Slab (xv)  : 70,00,000 < v ≤ 80,00,000 → 2,37,125 + 1% of (v − 70,00,000)
 * Slab (xvi) : v > 80,00,000              → 2,47,125 + 0.5% of (v − 80,00,000)
 *
 * This is a continuous marginal schedule. No ceiling-rounding is applied.
 *
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee (rounded to 2 decimal places)
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for KA Court Fee calculation');
  }

  let fee = 0;

  if (v <= 15000) {
    // Slab (i): 2½% of suit value
    fee = v * 0.025;
  } else if (v <= 75000) {
    // Slab (ii): Rs. 375 + 7½% of the amount exceeding Rs. 15,000
    fee = 375 + (v - 15000) * 0.075;
  } else if (v <= 250000) {
    // Slab (iii): Rs. 4,875 + 7% of the amount exceeding Rs. 75,000
    fee = 4875 + (v - 75000) * 0.07;
  } else if (v <= 500000) {
    // Slab (iv): Rs. 17,125 + 6½% of the amount exceeding Rs. 2,50,000
    fee = 17125 + (v - 250000) * 0.065;
  } else if (v <= 750000) {
    // Slab (v): Rs. 33,375 + 6% of the amount exceeding Rs. 5,00,000
    fee = 33375 + (v - 500000) * 0.06;
  } else if (v <= 1000000) {
    // Slab (vi): Rs. 48,375 + 5½% of the amount exceeding Rs. 7,50,000
    fee = 48375 + (v - 750000) * 0.055;
  } else if (v <= 1500000) {
    // Slab (vii): Rs. 62,125 + 5% of the amount exceeding Rs. 10,00,000
    fee = 62125 + (v - 1000000) * 0.05;
  } else if (v <= 2000000) {
    // Slab (viii): Rs. 87,125 + 4½% of the amount exceeding Rs. 15,00,000
    fee = 87125 + (v - 1500000) * 0.045;
  } else if (v <= 2500000) {
    // Slab (ix): Rs. 1,09,625 + 4% of the amount exceeding Rs. 20,00,000
    fee = 109625 + (v - 2000000) * 0.04;
  } else if (v <= 3000000) {
    // Slab (x): Rs. 1,29,625 + 3½% of the amount exceeding Rs. 25,00,000
    fee = 129625 + (v - 2500000) * 0.035;
  } else if (v <= 4000000) {
    // Slab (xi): Rs. 1,47,125 + 3% of the amount exceeding Rs. 30,00,000
    fee = 147125 + (v - 3000000) * 0.03;
  } else if (v <= 5000000) {
    // Slab (xii): Rs. 1,77,125 + 2½% of the amount exceeding Rs. 40,00,000
    fee = 177125 + (v - 4000000) * 0.025;
  } else if (v <= 6000000) {
    // Slab (xiii): Rs. 2,02,125 + 2% of the amount exceeding Rs. 50,00,000
    fee = 202125 + (v - 5000000) * 0.02;
  } else if (v <= 7000000) {
    // Slab (xiv): Rs. 2,22,125 + 1½% of the amount exceeding Rs. 60,00,000
    fee = 222125 + (v - 6000000) * 0.015;
  } else if (v <= 8000000) {
    // Slab (xv): Rs. 2,37,125 + 1% of the amount exceeding Rs. 70,00,000
    fee = 237125 + (v - 7000000) * 0.01;
  } else {
    // Slab (xvi): Rs. 2,47,125 + ½% of the amount exceeding Rs. 80,00,000
    fee = 247125 + (v - 8000000) * 0.005;
  }

  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
