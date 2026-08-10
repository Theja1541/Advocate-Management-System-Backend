const { calculateCourtFee, validateInput, META } = require('../states/JH');

describe('JH Court Fee Calculator - Functional Parity Tests', () => {
  describe('Metadata Verification', () => {
    it('should have the correct state metadata', () => {
      expect(META.stateCode).toBe('JH');
      expect(META.stateName).toBe('Jharkhand');
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
      { value: 1000, expected: 200 },
      { value: 10000, expected: 1480 },
      { value: 35000, expected: 3272 },
      { value: 50000, expected: 3720 },
      { value: 100000, expected: 4520 },
    ];

    verifiedCases.forEach(({ value, expected }) => {
      it(`should return exactly ${expected} for a suit value of ${value}`, () => {
        const result = calculateCourtFee(value);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Algorithm Safety & Range Boundaries', () => {
    it('should enforce the maximum fee cap of 50,000', () => {
      expect(calculateCourtFee(100000000)).toBe(50000);
    });
  });
});
