import { hashPassword, verifyPassword, generateAccessToken, verifyAccessToken } from '../utils/auth.js';

describe('Authentication & Cryptography Security Tests', () => {
  it('should hash passwords using Argon2id with high resistance to rainbow tables', async () => {
    const password = 'TestSecurePassword@2026!';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash.startsWith('$argon2id$')).toBe(true);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('WrongPassword123', hash);
    expect(isInvalid).toBe(false);
  });

  it('should generate and verify JWT token containing tenant context payload', () => {
    const payload = {
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'owner@slmultishop.com',
      isSuperAdmin: false,
      shopId: '22222222-2222-2222-2222-222222222222',
      branchId: '33333333-3333-3333-3333-333333333333',
      roleName: 'Shop Owner'
    };

    const token = generateAccessToken(payload);
    expect(token).toBeDefined();

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.shopId).toBe(payload.shopId);
    expect(decoded.roleName).toBe(payload.roleName);
  });
});
