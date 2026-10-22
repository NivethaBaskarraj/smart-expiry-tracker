const request = require('supertest');
const jwt = require('jsonwebtoken');

// Set test environment variables before requiring the app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_12345';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/test_db';

// Mock expiry checker functions so tests don't buffer on Mongoose connection when DB is offline
jest.mock('../utils/expiryChecker', () => ({
  checkExpiringSoon: jest.fn().mockResolvedValue({ count: 0 }),
  checkExpired: jest.fn().mockResolvedValue({ count: 0 }),
  startExpiryChecker: jest.fn(),
}));

const app = require('../server');

describe('API Route Integrations & Security Tests', () => {
  describe('GET /api/health', () => {
    test('returns 200 with server status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.uptime).toBe('number');
    });
  });

  describe('POST /api/auth/register (Validation)', () => {
    test('rejects registration with missing fields', async () => {
      const res = await request(app).post('/api/auth/register').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/required/i);
    });

    test('rejects invalid email formats', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Alex',
        email: 'invalid-email-address',
        password: 'securePassword123',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/valid email/i);
    });

    test('rejects passwords shorter than 6 characters', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Alex',
        email: 'alex@example.com',
        password: '123',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/at least 6 characters/i);
    });
  });

  describe('JWT Authentication Middleware', () => {
    test('blocks access to protected /api/items when no token is provided', async () => {
      const res = await request(app).get('/api/items');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/no token provided/i);
    });

    test('blocks access to protected /api/items with an invalid token', async () => {
      const res = await request(app)
        .get('/api/items')
        .set('Authorization', 'Bearer totally_invalid_token_string');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/not valid/i);
    });

    test('blocks access to /api/auth/profile without authentication', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Disposal Suggestions API', () => {
    test('requires item name query parameter', async () => {
      const mockToken = jwt.sign({ userId: '507f1f77bcf86cd799439011' }, process.env.JWT_SECRET);
      const res = await request(app)
        .get('/api/disposal')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Item name is required/i);
    });

    test('returns disposal suggestions and safety notes for valid item', async () => {
      const mockToken = jwt.sign({ userId: '507f1f77bcf86cd799439011' }, process.env.JWT_SECRET);
      const res = await request(app)
        .get('/api/disposal?name=banana&category=produce')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.category).toBe('produce');
      expect(Array.isArray(res.body.generalTips)).toBe(true);
      expect(Array.isArray(res.body.specificTips)).toBe(true);
      expect(typeof res.body.safetyNote).toBe('string');
    });
  });

  describe('Protected External Cron Trigger', () => {
    test('allows trigger when CRON_SECRET is not enforced in test/dev', async () => {
      const res = await request(app).get('/api/cron/check-expiry');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
