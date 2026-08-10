const OR = require('../states/OR');
const { calculateCourtFee, validateInput, META } = OR;
const { validateInterface } = require('./_helpers');

describe('Odisha (OR) Court Fee Calculator', () => {
  validateInterface(OR);

  describe('META object', () => {
    it('should have a valid META object for Functional Compatibility', () => {
      expect(META.stateCode).toBe('OR');
      expect(META.implementationType).toBe('Functional Compatibility');
      expect(META.statutoryVerification).toBe(false);
    });
  });

  describe('Functional Compatibility Tests (Century Law Firm Reference)', () => {
    
    // Low Range
    test.each([
      [1, 0.35],
      [10, 0.70],
      [100, 7.00],
      [101, 8.00],
      [110, 8.00],
      [200, 17.00],
      [500, 47.00],
      [900, 91.00],
      [1000, 102.00],
      [1001, 109.50]
    ])('should calculate correct fee for Low Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // Middle Range
    test.each([
      [5000, 402.00],
      [5001, 409.50],
      [6000, 477.00],
      [7000, 552.00],
      [7500, 589.50],
      [8000, 619.50],
      [9000, 679.50],
      [10000, 739.50],
      [10001, 762.00],
      [11000, 784.50],
      [20000, 1189.50],
      [30000, 1489.50],
      [40000, 1639.50],
      [50000, 1789.50],
      [50001, 1889.50]
    ])('should calculate correct fee for Middle Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // High Range
    test.each([
      [100000, 2789.50],
      [100001, 2889.50],
      [500000, 10789.50],
      [1000000, 20789.50],
      [10000000, 200789.50]
    ])('should calculate correct fee for High Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

  });

  describe('Validation Tests', () => {
    it('should reject invalid inputs', () => {
      expect(() => calculateCourtFee(null)).toThrow('Invalid suit value');
      expect(() => calculateCourtFee(-10)).toThrow('Invalid suit value');
      expect(() => calculateCourtFee(0)).toThrow('Invalid suit value');
      expect(() => calculateCourtFee('abc')).toThrow('Invalid suit value');
    });
  });
});
