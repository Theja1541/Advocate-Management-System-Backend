const MP = require('../states/MP');
const { calculateCourtFee, validateInput, META } = MP;
const { validateInterface } = require('./_helpers');

describe('Madhya Pradesh (MP) Court Fee Calculator', () => {
  validateInterface(MP);

  describe('META object', () => {
    it('should have a valid META object for Functional Compatibility', () => {
      expect(META.stateCode).toBe('MP');
      expect(META.implementationType).toBe('Functional Compatibility');
      expect(META.statutoryVerification).toBe(false);
    });
  });

  describe('Functional Compatibility Tests (Century Law Firm Reference)', () => {
    
    // Low Range
    test.each([
      [1, 100.00],
      [10, 100.00],
      [100, 100.00],
      [101, 100.00],
      [500, 100.00],
      [750, 100.00],
      [1000, 120.00],
      [1001, 120.12]
    ])('should calculate correct fee for Low Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // Middle Range
    test.each([
      [5000, 600.00],
      [5001, 600.12],
      [10000, 1200.00],
      [10001, 1200.12],
      [50000, 6000.00],
      [50001, 6000.12],
      [100000, 12000.00],
      [100001, 12000.12],
      [250000, 30000.00],
      [250001, 30000.12]
    ])('should calculate correct fee for Middle Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // High Range
    test.each([
      [500000, 60000.00],
      [600000, 67000.00],
      [750000, 77500.00],
      [750001, 77500.07],
      [800000, 81000.00],
      [900000, 88000.00],
      [1000000, 95000.00],
      [1100000, 98000.00],
      [1500000, 110000.00],
      [2000000, 125000.00],
      [2500000, 140000.00],
      [2833333, 149999.99],
      [2833334, 150000.00], // Hits exact cap
      [3000000, 150000.00],
      [3500000, 150000.00],
      [4000000, 150000.00],
      [4500000, 150000.00],
      [5000000, 150000.00],
      [10000000, 150000.00],
      [20000000, 150000.00],
      [50000000, 150000.00]
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
