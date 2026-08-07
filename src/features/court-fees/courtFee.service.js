const registry = require('./registry');

/**
 * Court Fee Calculation Service
 * 
 * Business logic layer between the API controller and the calculator registry.
 * Handles input validation, dispatching, and response shaping.
 */

/**
 * Calculate court fee for a given state and suit value.
 * 
 * @param {string} stateCode - State abbreviation (e.g., 'AP', 'DL')
 * @param {number} suitValue - The monetary value of the suit
 * @returns {Object} Structured result with fee and metadata
 */
function calculateCourtFee(stateCode, suitValue) {
  if (!stateCode) {
    const err = new Error('stateCode is required');
    err.code = 'INVALID_INPUT';
    throw err;
  }

  return registry.calculateCourtFee(stateCode, Number(suitValue));
}

/**
 * Get metadata for a specific state calculator.
 * 
 * @param {string} stateCode - State abbreviation
 * @returns {Object|null} META object or null
 */
function getStateMetadata(stateCode) {
  return registry.getStateMetadata(stateCode);
}

/**
 * Get all supported states.
 * 
 * @returns {Array<{code: string, name: string, verified: boolean}>}
 */
function getSupportedStates() {
  return registry.getSupportedStates();
}

module.exports = {
  calculateCourtFee,
  getStateMetadata,
  getSupportedStates,
};
