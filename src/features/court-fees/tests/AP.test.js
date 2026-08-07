const AP = require('../states/AP');
const { validateMeta, validateInterface, runBenchmarkTests } = require('./_helpers');

const benchmarkTests = [
  { val: 1, expected: 0.60 },
  { val: 5, expected: 0.60 },
  { val: 10, expected: 1.20 },
  { val: 25, expected: 3.00 },
  { val: 50, expected: 6.00 },
  { val: 75, expected: 9.00 },
  { val: 100, expected: 12.00 },
  { val: 101, expected: 13.10 },
  { val: 250, expected: 28.5 },
  { val: 500, expected: 56.0 },
  { val: 999, expected: 111.0 },
  { val: 1000, expected: 111.0 },
  { val: 1001, expected: 118.5 },
  { val: 5000, expected: 411.0 },
  { val: 10000, expected: 786.0 },
  { val: 25000, expected: 1586.0 },
  { val: 50000, expected: 2386.0 },
  { val: 100000, expected: 3426.0 },
  { val: 500000, expected: 7426.0 },
  { val: 1000000, expected: 12426.0 },
];

describe('AP Court Fee Calculator', () => {
  validateMeta(AP);
  validateInterface(AP);

  describe('Fee calculations', () => {
    runBenchmarkTests(AP, benchmarkTests);
  });

  describe('Input validation', () => {
    test('Rejects missing suit value', () => {
      const { isValid } = AP.validateInput();
      expect(isValid).toBe(false);
    });

    test('Rejects negative suit value', () => {
      const { isValid } = AP.validateInput(-100);
      expect(isValid).toBe(false);
    });
  });
});
