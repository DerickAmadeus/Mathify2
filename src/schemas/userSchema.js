/**
 * User Schema Definitions
 * Contains validation schemas for user-related operations
 */

const userRegisterSchema = {
  type: 'object',
  required: ['username', 'password'],
  properties: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 50,
      pattern: '^[a-zA-Z0-9_-]+$',
      description: 'Username (3-50 characters, alphanumeric, underscore, hyphen)'
    },
    password: {
      type: 'string',
      minLength: 6,
      maxLength: 100,
      description: 'Password (minimum 6 characters)'
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'Email address (optional)'
    }
  }
};

const userLoginSchema = {
  type: 'object',
  required: ['username', 'password'],
  properties: {
    username: {
      type: 'string',
      description: 'Username'
    },
    password: {
      type: 'string',
      description: 'Password'
    }
  }
};

const userUpdateSchema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 50,
      pattern: '^[a-zA-Z0-9_-]+$',
      description: 'Username (optional)'
    },
    password: {
      type: 'string',
      minLength: 6,
      maxLength: 100,
      description: 'Password (optional)'
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'Email address (optional)'
    }
  }
};

const userResponseSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      description: 'User ID'
    },
    username: {
      type: 'string',
      description: 'Username'
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'Email address'
    },
    created_at: {
      type: 'string',
      format: 'date-time',
      description: 'Account creation timestamp'
    }
  }
};

/**
 * Validate user input against schema
 * @param {object} data - User data to validate
 * @param {object} schema - Validation schema
 * @returns {object} - { valid: boolean, errors: array }
 */
function validateUser(data, schema) {
  const errors = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!data[field]) {
        errors.push(`${field} is required`);
      }
    }
  }

  // Validate properties
  for (const [key, rules] of Object.entries(schema.properties || {})) {
    if (!data[key]) continue;

    const value = data[key];

    // Check minLength
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${key} must be at least ${rules.minLength} characters`);
    }

    // Check maxLength
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${key} must not exceed ${rules.maxLength} characters`);
    }

    // Check pattern (regex)
    if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
      errors.push(`${key} format is invalid`);
    }

    // Check email format
    if (rules.format === 'email' && !isValidEmail(value)) {
      errors.push(`${key} must be a valid email`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Simple email validation
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = {
  userRegisterSchema,
  userLoginSchema,
  userUpdateSchema,
  userResponseSchema,
  validateUser,
  isValidEmail
};
