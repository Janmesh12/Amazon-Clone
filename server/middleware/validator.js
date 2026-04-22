const { validationResult } = require('express-validator');

// Validation runner middleware
const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      await validation.run(req);
    }
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    res.status(400).json({ errors: errors.array(), error: errors.array()[0].msg });
  };
};

module.exports = validate;
