const KL = require('../states/KL');
const { calculateCourtFee, validateInput, META } = KL;
const { validateInterface } = require('./_helpers');

describe('Kerala (KL) Court Fee Calculator', () => {
  validateInterface(KL);

  describe('META object', () => {
    it('should have a valid META object for Functional Compatibility', () => {
      expect(META.stateCode).toBe('KL');
      expect(META.implementationType).toBe('Functional Compatibility');
      expect(META.statutoryVerification).toBe(false);
    });
  });

  describe('Functional Compatibility Tests (Century Law Firm Reference)', () => {
    
    // Minimum Fee and Boundaries
    test.each([
      [1, 4],
      [10, 4],
      [50, 4],
      [99, 4],
      [100, 4],
      [101, 8],
      [150, 8],
      [199, 8],
      [1000, 40],
      [1001, 44],
      [5000, 200],
      [5001, 204],
      [10000, 400],
      [10001, 404]
    ])('should calculate correct fee for Low Range value ₹%i as ₹%i', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // Middle Range
    test.each([
      [15000, 600],
      [15001, 608],
      [15100, 608],
      [15101, 616],
      [20000, 1000],
      [25000, 1400],
      [30000, 1800],
      [40000, 2600],
      [50000, 3400],
      [50001, 3410],
      [50100, 3410],
      [50101, 3420],
      [100000, 8400],
      [100001, 8410],
      [100100, 8410],
      [100101, 8420]
    ])('should calculate correct fee for Middle Range value ₹%i as ₹%i', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // High Range
    test.each([
      [500000, 48400],
      [1000000, 98400],
      [1000001, 98408],
      [1000100, 98408],
      [1000101, 98416],
      [10000000, 818400],
      [10000001, 818401],
      [10000100, 818401],
      [10000101, 818402],
      [20000000, 918400],
      [100000000, 1718400]
    ])('should calculate correct fee for High Range value ₹%i as ₹%i', (suitValue, expectedFee) => {
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
