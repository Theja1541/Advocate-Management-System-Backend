const assert = require('assert');
const {
  validateEffectiveDates,
  validateSlabs,
  calculateCourtFee,
} = require('./courtFeeCalculator.service');

console.log('Running Court Fee Calculator Service CLF Parity Unit Tests...\n');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

// 1. Effective Dates Validation Tests
test('validateEffectiveDates: valid date range', () => {
  assert.doesNotThrow(() => validateEffectiveDates('2022-01-01', '2025-12-31'));
  assert.doesNotThrow(() => validateEffectiveDates('2022-01-01', null));
});

test('validateEffectiveDates: throws error when effectiveFrom is missing', () => {
  assert.throws(() => validateEffectiveDates(null, '2025-12-31'), /Effective From date is required/);
});

test('validateEffectiveDates: throws error when effectiveFrom > effectiveTo', () => {
  assert.throws(() => validateEffectiveDates('2025-12-31', '2022-01-01'), /cannot be after/);
});

// 2. Slab Validation Tests
test('validateSlabs: valid non-overlapping slabs', () => {
  const slabs = [
    { fromAmount: 0, toAmount: 100000, feeType: 'PERCENTAGE', feeValue: 2.5 },
    { fromAmount: 100001, toAmount: 500000, feeType: 'PERCENTAGE', feeValue: 2.0 },
    { fromAmount: 500001, toAmount: null, feeType: 'PERCENTAGE', feeValue: 1.5 },
  ];
  assert.doesNotThrow(() => validateSlabs(slabs));
});

test('validateSlabs: detects overlapping slabs', () => {
  const overlappingSlabs = [
    { fromAmount: 0, toAmount: 100000, feeType: 'PERCENTAGE', feeValue: 2.5 },
    { fromAmount: 50000, toAmount: 500000, feeType: 'PERCENTAGE', feeValue: 2.0 },
  ];
  assert.throws(() => validateSlabs(overlappingSlabs), /Slab overlap detected/);
});

// 3. CLF Parity Test - Maharashtra Schedule I Article 1
test('CLF Parity: Maharashtra (MH) Cumulative Slabs & ₹3,00,000 Max Cap', () => {
  const mhRule = {
    ruleType: 'SLAB',
    calculationMode: 'MARGINAL_CUMULATIVE',
    maxFee: 300000,
    processFee: 800,
    filingFee: 1500,
    miscCharges: 3500,
    defaultAdvocateFeePct: 10,
    stateCode: 'MH',
    stateName: 'Maharashtra',
    slabs: [
      { id: 1, fromAmount: 0, toAmount: 10000, feeType: 'PERCENTAGE', feeValue: 5.00, minFee: 200 },
      { id: 2, fromAmount: 10001, toAmount: 50000, feeType: 'PERCENTAGE', feeValue: 4.00, minFee: 500 },
      { id: 3, fromAmount: 50001, toAmount: 100000, feeType: 'PERCENTAGE', feeValue: 3.00, minFee: 2100 },
      { id: 4, fromAmount: 100001, toAmount: 200000, feeType: 'PERCENTAGE', feeValue: 2.50, minFee: 3600 },
      { id: 5, fromAmount: 200001, toAmount: 500000, feeType: 'PERCENTAGE', feeValue: 2.00, minFee: 6100 },
      { id: 6, fromAmount: 500001, toAmount: 1000000, feeType: 'PERCENTAGE', feeValue: 1.50, minFee: 12100 },
      { id: 7, fromAmount: 1000001, toAmount: null, feeType: 'PERCENTAGE', feeValue: 1.00, minFee: 19600 },
    ],
  };

  // Case A: Suit value ₹40,000 -> Base ₹500 + 4% of (40000 - 10000) = 500 + 1200 = 1700
  const rA = calculateCourtFee(mhRule, 40000);
  assert.strictEqual(rA.courtFee, 1700);

  // Case B: Suit value ₹3,00,000 -> Base ₹6100 + 2% of (300000 - 200000) = 6100 + 2000 = 8100
  const rB = calculateCourtFee(mhRule, 300000);
  assert.strictEqual(rB.courtFee, 8100);

  // Case C: Suit value ₹5,00,00,000 -> Base 19600 + 1% of 4,90,00,000 = 5,09,600 -> capped at maxFee 3,00,000
  const rC = calculateCourtFee(mhRule, 50000000);
  assert.strictEqual(rC.courtFee, 300000);
});

// 4. CLF Parity Test - Andhra Pradesh & Telangana Schedule I Article 1
test('CLF Parity: Andhra Pradesh (AP) Cumulative Slabs', () => {
  const apRule = {
    ruleType: 'SLAB',
    calculationMode: 'MARGINAL_CUMULATIVE',
    processFee: 500,
    filingFee: 1000,
    miscCharges: 2000,
    defaultAdvocateFeePct: 10,
    stateCode: 'AP',
    stateName: 'Andhra Pradesh',
    slabs: [
      { id: 1, fromAmount: 0, toAmount: 100000, feeType: 'PERCENTAGE', feeValue: 2.50, minFee: 100 },
      { id: 2, fromAmount: 100001, toAmount: 500000, feeType: 'PERCENTAGE', feeValue: 2.00, minFee: 2500 },
      { id: 3, fromAmount: 500001, toAmount: 1000000, feeType: 'PERCENTAGE', feeValue: 1.50, minFee: 10500 },
      { id: 4, fromAmount: 1000001, toAmount: null, feeType: 'PERCENTAGE', feeValue: 1.00, minFee: 18000 },
    ],
  };

  // Suit value ₹18,50,000 -> Base ₹18000 + 1% of (1850000 - 1000000) = 18000 + 8500 = 26500
  const result = calculateCourtFee(apRule, 1850000);
  assert.strictEqual(result.courtFee, 26500);
});

// 5. CLF Parity Test - Consumer Court Redressal Commissions Rules
test('CLF Parity: Consumer Commission Fee Tiers', () => {
  const ccRule = {
    ruleType: 'SLAB',
    calculationMode: 'SINGLE_SLAB',
    processFee: 300,
    filingFee: 500,
    miscCharges: 1000,
    defaultAdvocateFeePct: 10,
    stateCode: 'CC',
    stateName: 'Consumer Commission',
    slabs: [
      { fromAmount: 0, toAmount: 500000, feeType: 'FIXED', feeValue: 0 },
      { fromAmount: 500001, toAmount: 1000000, feeType: 'FIXED', feeValue: 200 },
      { fromAmount: 1000001, toAmount: 2000000, feeType: 'FIXED', feeValue: 500 },
      { fromAmount: 2000001, toAmount: 5000000, feeType: 'FIXED', feeValue: 1000 },
    ],
  };

  assert.strictEqual(calculateCourtFee(ccRule, 300000).courtFee, 0); // Nil
  assert.strictEqual(calculateCourtFee(ccRule, 750000).courtFee, 200); // ₹200
  assert.strictEqual(calculateCourtFee(ccRule, 1500000).courtFee, 500); // ₹500
  assert.strictEqual(calculateCourtFee(ccRule, 3500000).courtFee, 1000); // ₹1000
});

console.log(`\nTest Summary: ${passed}/${total} unit tests passed successfully.`);
if (passed !== total) {
  process.exit(1);
}
