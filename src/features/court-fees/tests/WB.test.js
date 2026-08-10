const WB = require('../states/WB');
const { calculateCourtFee, validateInput, META } = WB;
const { validateInterface } = require('./_helpers');

describe('West Bengal (WB) Court Fee Calculator', () => {
  validateInterface(WB);

  describe('META object', () => {
    it('should have a valid META object for Functional Compatibility', () => {
      expect(META.stateCode).toBe('WB');
      expect(META.implementationType).toBe('Functional Compatibility');
      expect(META.statutoryVerification).toBe(false);
    });
  });

  describe('Functional Compatibility Tests (Century Law Firm Reference)', () => {
    
    // Low Range
    test.each([
      [1, 10.00],
      [10, 10.00],
      [100, 10.00],
      [101, 20.00],
      [1000, 100.00],
      [1001, 108.00],
      [5000, 420.00],
      [5001, 428.00],
      [6000, 500.00],
      [7000, 580.00],
      [8000, 652.00],
      [9000, 716.00],
      [10000, 780.00],
      [10001, 810.00]
    ])('should calculate correct fee for Low Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // Middle Range
    test.each([
      [11000, 840.00],
      [20000, 1380.00],
      [20001, 1430.00],
      [30000, 1880.00],
      [40000, 2380.00],
      [50000, 2880.00],
      [50001, 3230.00],
      [100000, 6380.00],
      [100001, 6750.00]
    ])('should calculate correct fee for Middle Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // High Range
    test.each([
      [150000, 10080.00],
      [200000, 13780.00],
      [250001, 16090.00],
      [251000, 16090.00],
      [300000, 17980.00],
      [400000, 18980.00],
      [500000, 19980.00],
      [1000000, 24980.00],
      [1500000, 29980.00],
      [3000000, 44980.00],
      [4000000, 50000.00],
      [10000000, 50000.00]
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
