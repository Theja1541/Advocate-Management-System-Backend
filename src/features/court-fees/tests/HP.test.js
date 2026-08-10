const { calculateCourtFee, validateInput, META } = require('../states/HP');
const { generateRandomSuitValue, testSuitValues } = require('./_helpers');

describe('HP Court Fee Calculator - Functional Parity Tests', () => {
  describe('Metadata Verification', () => {
    it('should have the correct state metadata', () => {
      expect(META.stateCode).toBe('HP');
      expect(META.stateName).toBe('Himachal Pradesh');
      expect(META.implementationType).toBe('Functional Compatibility');
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid inputs', () => {
      expect(validateInput(undefined).isValid).toBe(false);
      expect(validateInput(null).isValid).toBe(false);
      expect(validateInput(0).isValid).toBe(false);
      expect(validateInput(-1000).isValid).toBe(false);
      expect(validateInput('abc').isValid).toBe(false);
    });

    it('should accept valid inputs', () => {
      expect(validateInput(100).isValid).toBe(true);
      expect(validateInput('1000').isValid).toBe(true);
    });
  });

  describe('Century Law Firm Verified Outputs', () => {
    const verifiedCases = [
      { value: 100, expected: 20 },
      { value: 500, expected: 60 },
      { value: 1000, expected: 160 },
      { value: 5000, expected: 760 },
      { value: 10000, expected: 1260 },
      { value: 50000, expected: 3060 },
      { value: 100000, expected: 3560 }
    ];

    verifiedCases.forEach(({ value, expected }) => {
      it(`should return exactly ${expected} for a suit value of ${value}`, () => {
        const result = calculateCourtFee(value);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Algorithm Safety & Range Boundaries', () => {
    it('should not throw errors on large valid integers', () => {
      expect(() => calculateCourtFee(999999999)).not.toThrow();
    });

    it('should calculate fees consistently on boundaries', () => {
      // Slab borders checking
      expect(calculateCourtFee(100)).toBe(20);
      expect(calculateCourtFee(101)).toBe(20 + 0.1 * (110 - 100)); // 21
      expect(calculateCourtFee(500)).toBe(60);
      expect(calculateCourtFee(501)).toBe(60 + 0.2 * (510 - 500)); // 62
    });
  });
});
