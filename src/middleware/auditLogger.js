const { logEvent, actions } = require('../features/acts/auditService');

const auditLogger = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (body) {
    res.send = originalSend;

    // We only want to log write operations (POST, PUT, PATCH, DELETE) that succeed (2xx)
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
      res.statusCode >= 200 &&
      res.statusCode < 300
    ) {
      let action = 'WRITE';
      if (req.method === 'POST') action = actions.CREATED;
      else if (req.method === 'PUT' || req.method === 'PATCH') action = actions.UPDATED;
      else if (req.method === 'DELETE') action = actions.DELETED;

      // Extract details
      const details = {
        method: req.method,
        path: req.originalUrl || req.path,
        body: req.body ? { ...req.body } : {},
        params: req.params,
        query: req.query,
        statusCode: res.statusCode,
      };

      // Strip sensitive credentials
      if (details.body.password) details.body.password = '***';
      if (details.body.passwordHash) details.body.passwordHash = '***';

      try {
        logEvent(action, req, details);
      } catch (err) {
        // Fallback: don't break request execution if winston fails
      }
    }

    return originalSend.apply(this, arguments);
  };

  next();
};

module.exports = auditLogger;
