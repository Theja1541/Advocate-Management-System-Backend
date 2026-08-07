/**
 * Shared test utilities for court fee calculator tests.
 */

/**
 * Validates that a calculator module has a properly structured META object.
 * 
 * @param {Object} calculator - The state calculator module
 */
function validateMeta(calculator) {
  describe('META object', () => {
    it('should have a META object', () => {
      expect(calculator.META).toBeDefined();
    });

    it('should have required top-level META fields', () => {
      expect(calculator.META.stateCode).toEqual(expect.any(String));
      expect(calculator.META.stateName).toEqual(expect.any(String));
      expect(calculator.META.version).toEqual(expect.any(Number));
      expect(calculator.META.lastUpdated).toEqual(expect.any(String));
    });

    it('should have a legislation sub-object with required fields', () => {
      const leg = calculator.META.legislation;
      expect(leg).toBeDefined();
      expect(leg.act).toEqual(expect.any(String));
      expect(typeof leg.verified).toBe('boolean');
    });
  });
}

/**
 * Validates that a calculator module exports the required interface.
 * 
 * @param {Object} calculator - The state calculator module
 */
function validateInterface(calculator) {
  describe('Module interface', () => {
    it('should export calculateCourtFee as a function', () => {
      expect(typeof calculator.calculateCourtFee).toBe('function');
    });

    it('should export validateInput as a function', () => {
      expect(typeof calculator.validateInput).toBe('function');
    });

    it('should export META as an object', () => {
      expect(typeof calculator.META).toBe('object');
    });
  });
}

/**
 * Runs a standard benchmark test suite against a calculator.
 * 
 * @param {Object} calculator - The state calculator module
 * @param {Array<{val: number, expected: number}>} testData - Array of test cases
 * @param {number} [precision=2] - Decimal precision for comparison
 */
function runBenchmarkTests(calculator, testData, precision = 2) {
  testData.forEach(({ val, expected }) => {
    test(`Suit Value ₹${val} should equal ₹${expected}`, () => {
      expect(calculator.calculateCourtFee(val)).toBeCloseTo(expected, precision);
    });
  });
}

module.exports = {
  validateMeta,
  validateInterface,
  runBenchmarkTests,
};
