const courtFeeService = require('./courtFee.service');

/**
 * Handles the POST /api/v1/court-fees/calculate request.
 * 
 * Returns an enriched response with metadata for debugging,
 * auditing, and traceability.
 */
async function calculate(req, res) {
  try {
    const { stateCode, suitValue } = req.body;

    if (!stateCode || suitValue === undefined) {
      return res.status(400).json({ error: 'stateCode and suitValue are required' });
    }

    const result = courtFeeService.calculateCourtFee(stateCode, Number(suitValue));

    // Unsupported state — return 200 with { supported: false }
    if (!result.supported) {
      return res.status(200).json(result);
    }

    // Successful calculation — return enriched response
    return res.status(200).json({
      stateCode: result.stateCode,
      stateName: result.stateName,
      suitValue: result.suitValue,
      courtFee: result.courtFee,
      currency: result.currency,
      verified: result.verified,
      act: result.act,
      version: result.version,
    });
  } catch (error) {
    if (error.code === 'INVALID_INPUT') {
      return res.status(400).json({
        error: error.message || 'Bad Request',
      });
    }

    console.error('Court Fee API Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
    });
  }
}

module.exports = {
  calculate,
};
