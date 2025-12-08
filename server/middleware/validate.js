const Joi = require('joi');
const AppError = require('../utils/AppError');

const schemas = {
  compare: Joi.object({
    p1: Joi.string().required().messages({'any.required': 'Problem 1 (p1) is required'}),
    p2: Joi.string().required().messages({'any.required': 'Problem 2 (p2) is required'})
  }),
  // Add other schemas as needed
};

const validate = (schemaType, property = 'body') => {
  return (req, res, next) => {
    const schema = schemas[schemaType];
    if (!schema) {
        return next();
    }
    
    // Validate request property (body, query, params)
    const { error } = schema.validate(req[property]);
    
    if (error) {
      const message = error.details.map(i => i.message).join(',');
      return next(new AppError(message, 400));
    }
    
    next();
  };
};

module.exports = validate;
