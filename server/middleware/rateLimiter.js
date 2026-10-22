const rateLimit = require('express-rate-limit');

// Strict rate limiter for login and registration to mitigate credential stuffing & brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 login/register requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many attempts from this IP. Please try again after 15 minutes.',
  },
});

// Stricter rate limiter for password reset endpoints to mitigate email spam & enumeration
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 reset attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many password reset requests. Please try again in 15 minutes.',
  },
});

// General API rate limiter to protect endpoints from automated scraping/flooding
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests. Please slow down.',
  },
});

module.exports = {
  authLimiter,
  passwordResetLimiter,
  apiLimiter,
};
