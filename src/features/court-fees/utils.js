/**
 * Utility functions for statutory court fee calculations.
 */

/**
 * Rounds a value up to the nearest multiple of a step.
 * Used for statutory clauses like "for every Rs. 100 or part thereof".
 * 
 * @param {number} val The value to round up.
 * @param {number} step The step interval (e.g., 5, 10, 100).
 * @returns {number} The rounded value.
 */
function CEIL(val, step) {
  if (val <= 0) return 0;
  return Math.ceil(val / step) * step;
}

module.exports = {
  CEIL,
};
