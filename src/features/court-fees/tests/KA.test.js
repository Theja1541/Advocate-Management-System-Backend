const KA = require('../states/KA');
const { validateMeta, validateInterface, runBenchmarkTests } = require('./_helpers');

/**
 * Benchmark values manually derived from Schedule I, Article 1
 * of the Karnataka Court-Fees and Suits Valuation Act, 1958.
 *
 * Derivation notes:
 *  - ₹1       : 0.025 × 1 = 0.025 → rounds to 0.03 (via Math.round × 100 / 100)
 *  - ₹100     : 0.025 × 100 = 2.50
 *  - ₹1,000   : 0.025 × 1000 = 25.00
 *  - ₹15,000  : 0.025 × 15000 = 375.00  [boundary (i)/(ii)]
 *  - ₹15,001  : 375 + 0.075 × 1 = 375.075 → 375.08
 *  - ₹75,000  : 375 + 0.075 × 60000 = 375 + 4500 = 4875.00 [boundary (ii)/(iii)]
 *  - ₹75,001  : 4875 + 0.07 × 1 = 4875.07
 *  - ₹2,50,000: 4875 + 0.07 × 175000 = 4875 + 12250 = 17125.00 [boundary (iii)/(iv)]
 *  - ₹5,00,000: 17125 + 0.065 × 250000 = 17125 + 16250 = 33375.00 [boundary (iv)/(v)]
 *  - ₹7,50,000: 33375 + 0.06 × 250000 = 33375 + 15000 = 48375.00 [boundary (v)/(vi)]
 *  - ₹10,00,000: 48375 + 0.055 × 250000 = 48375 + 13750 = 62125.00 [boundary (vi)/(vii)]
 *  - ₹15,00,000: 62125 + 0.05 × 500000 = 62125 + 25000 = 87125.00 [boundary (vii)/(viii)]
 *  - ₹20,00,000: 87125 + 0.045 × 500000 = 87125 + 22500 = 109625.00 [boundary (viii)/(ix)]
 *  - ₹25,00,000: 109625 + 0.04 × 500000 = 109625 + 20000 = 129625.00 [boundary (ix)/(x)]
 *  - ₹30,00,000: 129625 + 0.035 × 500000 = 129625 + 17500 = 147125.00 [boundary (x)/(xi)]
 *  - ₹40,00,000: 147125 + 0.03 × 1000000 = 147125 + 30000 = 177125.00 [boundary (xi)/(xii)]
 *  - ₹50,00,000: 177125 + 0.025 × 1000000 = 177125 + 25000 = 202125.00 [boundary (xii)/(xiii)]
 *  - ₹60,00,000: 202125 + 0.02 × 1000000 = 202125 + 20000 = 222125.00 [boundary (xiii)/(xiv)]
 *  - ₹70,00,000: 222125 + 0.015 × 1000000 = 222125 + 15000 = 237125.00 [boundary (xiv)/(xv)]
 *  - ₹80,00,000: 237125 + 0.01 × 1000000 = 237125 + 10000 = 247125.00 [boundary (xv)/(xvi)]
 *  - ₹1,00,00,000: 247125 + 0.005 × 2000000 = 247125 + 10000 = 257125.00
 */
const benchmarkTests = [
  // Slab (i): v ≤ 15,000  →  2.5% of v
  { val: 1,      expected: 0.03 },
  { val: 100,    expected: 2.50 },
  { val: 1000,   expected: 25.00 },
  { val: 5000,   expected: 125.00 },
  { val: 10000,  expected: 250.00 },
  { val: 15000,  expected: 375.00 },   // slab (i) boundary

  // Slab (ii): 15,000 < v ≤ 75,000  →  375 + 7.5% of (v − 15,000)
  { val: 15001,  expected: 375.08 },   // boundary onset
  { val: 30000,  expected: 1500.00 },
  { val: 50000,   expected: 3000.00 },   // 375 + 0.075 × 35000 = 3000
  { val: 75000,  expected: 4875.00 },  // slab (ii) boundary

  // Slab (iii): 75,000 < v ≤ 2,50,000  →  4,875 + 7% of (v − 75,000)
  { val: 75001,  expected: 4875.07 },  // boundary onset
  { val: 100000, expected: 6625.00 },
  { val: 200000, expected: 13625.00 },  // 4875 + 0.07 × 125000 = 13625
  { val: 250000, expected: 17125.00 }, // slab (iii) boundary

  // Slab (iv): 2,50,000 < v ≤ 5,00,000  →  17,125 + 6.5% of (v − 2,50,000)
  { val: 250001, expected: 17125.06 }, // boundary onset (float: 17125.065 rounds to 17125.06)
  { val: 350000, expected: 23625.00 },
  { val: 500000, expected: 33375.00 }, // slab (iv) boundary

  // Slab (v): 5,00,000 < v ≤ 7,50,000  →  33,375 + 6% of (v − 5,00,000)
  { val: 500001, expected: 33375.06 }, // boundary onset
  { val: 600000, expected: 39375.00 },
  { val: 750000, expected: 48375.00 }, // slab (v) boundary

  // Slab (vi): 7,50,000 < v ≤ 10,00,000  →  48,375 + 5.5% of (v − 7,50,000)
  { val: 750001, expected: 48375.06 }, // boundary onset
  { val: 900000, expected: 56625.00 },
  { val: 1000000, expected: 62125.00 }, // slab (vi) boundary

  // Slab (vii): 10,00,000 < v ≤ 15,00,000  →  62,125 + 5% of (v − 10,00,000)
  { val: 1000001, expected: 62125.05 }, // boundary onset
  { val: 1200000, expected: 72125.00 },
  { val: 1500000, expected: 87125.00 }, // slab (vii) boundary

  // Slab (viii): 15,00,000 < v ≤ 20,00,000  →  87,125 + 4.5% of (v − 15,00,000)
  { val: 1500001, expected: 87125.05 }, // boundary onset
  { val: 1750000, expected: 98375.00 },
  { val: 2000000, expected: 109625.00 }, // slab (viii) boundary

  // Slab (ix): 20,00,000 < v ≤ 25,00,000  →  1,09,625 + 4% of (v − 20,00,000)
  { val: 2000001, expected: 109625.04 }, // boundary onset
  { val: 2500000, expected: 129625.00 }, // slab (ix) boundary

  // Slab (x): 25,00,000 < v ≤ 30,00,000  →  1,29,625 + 3.5% of (v − 25,00,000)
  { val: 2500001, expected: 129625.04 }, // boundary onset
  { val: 3000000, expected: 147125.00 }, // slab (x) boundary

  // Slab (xi): 30,00,000 < v ≤ 40,00,000  →  1,47,125 + 3% of (v − 30,00,000)
  { val: 3000001, expected: 147125.03 }, // boundary onset
  { val: 3500000, expected: 162125.00 },
  { val: 4000000, expected: 177125.00 }, // slab (xi) boundary

  // Slab (xii): 40,00,000 < v ≤ 50,00,000  →  1,77,125 + 2.5% of (v − 40,00,000)
  { val: 4000001, expected: 177125.03 }, // boundary onset
  { val: 5000000, expected: 202125.00 }, // slab (xii) boundary

  // Slab (xiii): 50,00,000 < v ≤ 60,00,000  →  2,02,125 + 2% of (v − 50,00,000)
  { val: 5000001, expected: 202125.02 }, // boundary onset
  { val: 6000000, expected: 222125.00 }, // slab (xiii) boundary

  // Slab (xiv): 60,00,000 < v ≤ 70,00,000  →  2,22,125 + 1.5% of (v − 60,00,000)
  { val: 6000001, expected: 222125.02 }, // boundary onset
  { val: 7000000, expected: 237125.00 }, // slab (xiv) boundary

  // Slab (xv): 70,00,000 < v ≤ 80,00,000  →  2,37,125 + 1% of (v − 70,00,000)
  { val: 7000001, expected: 237125.01 }, // boundary onset
  { val: 8000000, expected: 247125.00 }, // slab (xv) boundary

  // Slab (xvi): v > 80,00,000  →  2,47,125 + 0.5% of (v − 80,00,000)
  { val: 8000001, expected: 247125.01 }, // boundary onset
  { val: 10000000, expected: 257125.00 },
];

describe('KA Court Fee Calculator', () => {
  validateMeta(KA);
  validateInterface(KA);

  describe('KA-specific metadata', () => {
    test('should have KA as stateCode', () => {
      expect(KA.META.stateCode).toBe('KA');
    });

    test('should be marked as verified', () => {
      expect(KA.META.legislation.verified).toBe(true);
    });

    test('should reference the Karnataka Court-Fees and Suits Valuation Act, 1958', () => {
      expect(KA.META.legislation.act).toContain('Karnataka Court-Fees and Suits Valuation Act, 1958');
    });
  });

  describe('Fee calculations — all 16 statutory slabs with boundary tests', () => {
    runBenchmarkTests(KA, benchmarkTests, 2);
  });

  describe('Slab boundary continuity', () => {
    test('Fee at exactly ₹15,000 matches slab (i) computation', () => {
      expect(KA.calculateCourtFee(15000)).toBeCloseTo(375.00, 2);
    });

    test('Fee at exactly ₹75,000 matches slab (ii) computation', () => {
      expect(KA.calculateCourtFee(75000)).toBeCloseTo(4875.00, 2);
    });

    test('Fee at exactly ₹2,50,000 matches slab (iii) computation', () => {
      expect(KA.calculateCourtFee(250000)).toBeCloseTo(17125.00, 2);
    });

    test('Fee at exactly ₹5,00,000 matches slab (iv) computation', () => {
      expect(KA.calculateCourtFee(500000)).toBeCloseTo(33375.00, 2);
    });

    test('Fee at exactly ₹80,00,000 matches slab (xv) computation', () => {
      expect(KA.calculateCourtFee(8000000)).toBeCloseTo(247125.00, 2);
    });
  });

  describe('Input validation', () => {
    test('Rejects missing suit value', () => {
      const { isValid } = KA.validateInput();
      expect(isValid).toBe(false);
    });

    test('Rejects null suit value', () => {
      const { isValid } = KA.validateInput(null);
      expect(isValid).toBe(false);
    });

    test('Rejects negative suit value', () => {
      const { isValid } = KA.validateInput(-100);
      expect(isValid).toBe(false);
    });

    test('Rejects zero', () => {
      const { isValid } = KA.validateInput(0);
      expect(isValid).toBe(false);
    });

    test('Rejects non-numeric string', () => {
      const { isValid } = KA.validateInput('abc');
      expect(isValid).toBe(false);
    });

    test('Accepts a valid integer', () => {
      const { isValid } = KA.validateInput(10000);
      expect(isValid).toBe(true);
    });

    test('Accepts a valid decimal', () => {
      const { isValid } = KA.validateInput(10000.50);
      expect(isValid).toBe(true);
    });
  });
});
