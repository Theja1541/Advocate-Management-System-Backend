const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Prevent orphaned files if validation fails
    if (req.file && req.file.path) {
      const fs = require('fs');
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (err) {
        // ignore cleanup errors
      }
    }
    return res.status(400).json({
      status: 'fail',
      errors: errors.array(),
    });
  }
  next();
};
