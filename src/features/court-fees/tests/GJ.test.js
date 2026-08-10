const GJ = require('../states/GJ');
const { calculateCourtFee, validateInput, META } = GJ;
const { validateInterface } = require('./_helpers');

describe('Gujarat (GJ) Court Fee Calculator', () => {
  validateInterface(GJ);

  describe('META object', () => {
    it('should have a valid META object for Functional Compatibility', () => {
      expect(META.stateCode).toBe('GJ');
      expect(META.implementationType).toBe('Functional Compatibility');
      expect(META.statutoryVerification).toBe(false);
    });
  });

  describe('Functional Compatibility Tests (Century Law Firm Reference)', () => {
    
    // Low Range
    test.each([
      [1, 10],
      [10, 10],
      [50, 10],
      [99, 10],
      [100, 10],
      [101, 20],
      [1000, 100],
      [1001, 110],
      [1050, 110],
      [1100, 110],
      [5000, 500],
      [5001, 510],
      [10000, 1000],
      [10001, 1250]
    ])('should calculate correct fee for Low Range value ₹%i as ₹%i', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // Middle Range
    test.each([
      [11000, 1250],
      [15000, 1250],
      [15001, 1500],
      [20000, 1500],
      [20001, 1525],
      [25000, 1825],
      [30000, 2200],
      [40000, 2950],
      [50000, 3700],
      [50001, 4000],
      [51000, 4000],
      [60000, 4300],
      [70000, 4900],
      [70001, 5200],
      [75000, 5200],
      [80000, 5950],
      [80001, 5950],
      [85000, 5950],
      [90000, 5950],
      [100000, 5950],
      [100001, 7950],
      [150000, 7950],
      [200000, 7950],
      [200001, 9950],
      [300000, 9950],
      [400000, 11950],
      [500000, 13950],
      [500001, 15950],
      [600000, 15950],
      [781424, 19950],
      [900001, 23950],
      [1000000, 23950]
    ])('should calculate correct fee for Middle Range value ₹%i as ₹%i', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // High Range
    test.each([
      [1000001, 26350],
      [1100000, 26350],
      [1200000, 26350],
      [2000000, 35950],
      [3000000, 40950],
      [3500000, 43450],
      [3600000, 43950],
      [9800000, 74950],
      [9810000, 75000],
      [9900000, 75000],
      [10000000, 75000],
      [20000000, 75000]
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
