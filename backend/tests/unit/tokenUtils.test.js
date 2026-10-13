const jwt = require('jsonwebtoken');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  REFRESH_TOKEN_COOKIE_NAME,
} = require('../../src/utils/tokenUtils');

describe('Unit Test: tokenUtils', () => {
  const mockUser = {
    _id: '6acdbb1ebb21413d39b092f7',
    username: 'testauthor',
    email: 'testauthor@example.com',
    role: 'user',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token containing user payload', () => {
      const token = generateAccessToken(mockUser);
      expect(typeof token).toBe('string');

      const decoded = jwt.decode(token);
      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should verify correctly with the access secret', () => {
      const token = generateAccessToken(mockUser);
      const verified = verifyAccessToken(token);
      expect(verified.id).toBe(mockUser._id);
    });

    it('should throw JsonWebTokenError on invalid token string', () => {
      expect(() => verifyAccessToken('invalid.token.string')).toThrow();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token with unique jti and user id', () => {
      const token1 = generateRefreshToken(mockUser);
      const token2 = generateRefreshToken(mockUser);

      expect(typeof token1).toBe('string');
      expect(token1).not.toBe(token2);

      const decoded1 = verifyRefreshToken(token1);
      const decoded2 = verifyRefreshToken(token2);

      expect(decoded1.id).toBe(mockUser._id);
      expect(decoded1.jti).toBeDefined();
      expect(decoded2.jti).toBeDefined();
      expect(decoded1.jti).not.toBe(decoded2.jti);
    });

    it('should reject a refresh token signed with wrong secret', () => {
      const badToken = jwt.sign({ id: mockUser._id }, 'wrong_secret');
      expect(() => verifyRefreshToken(badToken)).toThrow();
    });
  });

  describe('cookie helpers', () => {
    it('should set HTTP-only cookie with proper security options', () => {
      const mockRes = {
        cookie: jest.fn(),
      };

      setRefreshTokenCookie(mockRes, 'sample_refresh_token_value');

      expect(mockRes.cookie).toHaveBeenCalledTimes(1);
      const [cookieName, cookieValue, options] = mockRes.cookie.mock.calls[0];

      expect(cookieName).toBe(REFRESH_TOKEN_COOKIE_NAME);
      expect(cookieValue).toBe('sample_refresh_token_value');
      expect(options.httpOnly).toBe(true);
      expect(options.path).toBe('/');
      expect(options.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should not set cookie if token is falsy', () => {
      const mockRes = {
        cookie: jest.fn(),
      };

      setRefreshTokenCookie(mockRes, null);
      expect(mockRes.cookie).not.toHaveBeenCalled();
    });

    it('should clear HTTP-only cookie matching name and path', () => {
      const mockRes = {
        clearCookie: jest.fn(),
      };

      clearRefreshTokenCookie(mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledTimes(1);
      const [cookieName, options] = mockRes.clearCookie.mock.calls[0];
      expect(cookieName).toBe(REFRESH_TOKEN_COOKIE_NAME);
      expect(options.httpOnly).toBe(true);
      expect(options.path).toBe('/');
    });
  });
});
