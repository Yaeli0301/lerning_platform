const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticate, isAdmin } = require('../authMiddleware');

const app = express();

app.get('/test-auth', authenticate, (req, res) => {
  res.status(200).json({ user: req.user });
});

app.get('/test-admin', authenticate, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Admin access granted' });
});

describe('Auth Middleware', () => {
  const secret = process.env.JWT_SECRET || 'secretkey';
  const userToken = jwt.sign({ id: 'user1', role: 'user' }, secret, { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: 'admin1', role: 'admin' }, secret, { expiresIn: '1h' });
  const expiredToken = jwt.sign({ id: 'user1', role: 'user' }, secret, { expiresIn: '-10s' });

  test('should return 401 if no authorization header', async () => {
    const res = await request(app).get('/test-auth');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Unauthorized: No token provided');
  });

  test('should return 401 if invalid token format', async () => {
    const res = await request(app).get('/test-auth').set('Authorization', 'Bearer');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Unauthorized: Invalid token format');
  });

  test('should return 401 if token is invalid', async () => {
    const res = await request(app).get('/test-auth').set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Unauthorized: Invalid token');
  });

  test('should return 401 if token is expired', async () => {
    const res = await request(app).get('/test-auth').set('Authorization', `Bearer ${expiredToken}`);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Unauthorized: Token expired');
  });

  test('should allow access with valid token', async () => {
    const res = await request(app).get('/test-auth').set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.id).toBe('user1');
  });

  test('should deny access to non-admin user on admin route', async () => {
    const res = await request(app).get('/test-admin').set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('גישה נדחתה!');
  });

  test('should allow access to admin user on admin route', async () => {
    const res = await request(app).get('/test-admin').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Admin access granted');
  });
});
