const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Set test environment variables before requiring app
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_key_12345';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_67890';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

const app = require('../src/app');
const User = require('../src/models/User');

let mongoServer;

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    console.log('\n[Test Suite] Starting in-memory MongoDB server...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Test Suite] Connected to in-memory MongoDB.');

    // 1. User Registration
    console.log('\n--- Test 1: User Registration ---');
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'alice_writer',
        email: 'alice@example.com',
        password: 'securePassword123!',
        name: 'Alice Writer',
      });

    assert(regRes.status === 201, `Registration returns HTTP 201 (got ${regRes.status})`);
    assert(regRes.body.success === true, 'Response body indicates success: true');
    assert(!!regRes.body.data.accessToken, 'Access token is returned');
    assert(!!regRes.body.data.refreshToken, 'Refresh token is returned');
    assert(regRes.body.data.user.email === 'alice@example.com', 'User email matches');
    assert(regRes.body.data.user.password === undefined, 'Password is not leaked in response');

    // Check password is encrypted in database
    const dbUser = await User.findOne({ email: 'alice@example.com' }).select('+password');
    assert(dbUser.password !== 'securePassword123!', 'Password is encrypted in DB');
    assert(dbUser.password.startsWith('$2'), 'Password uses bcrypt hash format');

    // Check HTTP-only cookie set
    const cookies = regRes.headers['set-cookie'];
    assert(
      Array.isArray(cookies) && cookies.some((c) => c.includes('refreshToken=') && c.includes('HttpOnly')),
      'Refresh token is stored in HttpOnly cookie'
    );

    // 2. Reject short passwords
    console.log('\n--- Test 2: Input Validation (Short Password) ---');
    const shortPassRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'bob_short',
        email: 'bob@example.com',
        password: '123',
      });
    assert(shortPassRes.status === 400, `Short password returns HTTP 400 (got ${shortPassRes.status})`);
    assert(Array.isArray(shortPassRes.body.errors), 'Zod validation returns detailed errors array');

    // Test missing fields with Zod
    const missingFieldRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'incomplete@example.com',
      });
    assert(missingFieldRes.status === 400, `Missing required fields returns HTTP 400 (got ${missingFieldRes.status})`);

    // Test invalid email format with Zod
    const invalidEmailRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'valid_user',
        email: 'invalid-email-format',
        password: 'validPassword123!',
      });
    assert(invalidEmailRes.status === 400, `Invalid email format returns HTTP 400 (got ${invalidEmailRes.status})`);

    // 3. Reject duplicate registration
    console.log('\n--- Test 3: Duplicate Registration Handling ---');
    const dupRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'alice_writer',
        email: 'alice@example.com',
        password: 'anotherPassword123!',
      });
    assert(dupRes.status === 409, `Duplicate user returns HTTP 409 (got ${dupRes.status})`);

    // 4. User Login with valid credentials
    console.log('\n--- Test 4: User Login (Valid Credentials) ---');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'securePassword123!',
      });
    assert(loginRes.status === 200, `Login returns HTTP 200 (got ${loginRes.status})`);
    assert(!!loginRes.body.data.accessToken, 'Login returns new access token');
    const accessToken = loginRes.body.data.accessToken;
    const loginCookies = loginRes.headers['set-cookie'];
    const refreshTokenCookie = loginCookies.find((c) => c.includes('refreshToken='));
    const refreshToken = loginRes.body.data.refreshToken;

    // 5. User Login with invalid password
    console.log('\n--- Test 5: User Login (Invalid Password) ---');
    const wrongPassRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'wrongPassword!',
      });
    assert(wrongPassRes.status === 401, `Invalid password returns HTTP 401 (got ${wrongPassRes.status})`);

    // 6. Access Protected Route (/api/auth/me) with Access Token
    console.log('\n--- Test 6: Protected Route Access (/api/auth/me) ---');
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    assert(meRes.status === 200, `Protected route returns HTTP 200 (got ${meRes.status})`);
    assert(meRes.body.data.user.email === 'alice@example.com', 'Protected route returns current user');
    assert(meRes.body.data.user.password === undefined, 'Protected route does not leak password');

    // 7. Access Protected Route without Token
    console.log('\n--- Test 7: Protected Route Rejection Without Token ---');
    const noTokenRes = await request(app).get('/api/auth/me');
    assert(noTokenRes.status === 401, `Missing token returns HTTP 401 (got ${noTokenRes.status})`);

    // 8. Access Protected Route with Invalid Token
    console.log('\n--- Test 8: Protected Route Rejection With Invalid Token ---');
    const invalidTokenRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.value');
    assert(invalidTokenRes.status === 401, `Invalid token returns HTTP 401 (got ${invalidTokenRes.status})`);

    // 9. Refresh Token Rotation (/api/auth/refresh)
    console.log('\n--- Test 9: Refresh Token Endpoint & Rotation ---');
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [refreshTokenCookie]);

    assert(refreshRes.status === 200, `Refresh endpoint returns HTTP 200 (got ${refreshRes.status})`);
    assert(!!refreshRes.body.data.accessToken, 'Returns new access token');
    assert(!!refreshRes.body.data.refreshToken, 'Returns new rotated refresh token');
    const newAccessToken = refreshRes.body.data.accessToken;

    // Test that new access token works on protected route
    const testNewAccess = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${newAccessToken}`);
    assert(testNewAccess.status === 200, 'New access token works on protected route');

    // 10. Re-using old rotated refresh token should be rejected
    console.log('\n--- Test 10: Invalidation of Used Refresh Token ---');
    const replayRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [refreshTokenCookie]);
    assert(replayRes.status === 401, `Revoked/reused refresh token is rejected with HTTP 401 (got ${replayRes.status})`);

    // 11. User Logout (/api/auth/logout)
    console.log('\n--- Test 11: User Logout & Invalidation ---');
    const newRefreshCookie = refreshRes.headers['set-cookie'].find((c) => c.includes('refreshToken='));
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [newRefreshCookie]);
    assert(logoutRes.status === 200, `Logout returns HTTP 200 (got ${logoutRes.status})`);

    // Verify cookie was cleared
    const logoutCookies = logoutRes.headers['set-cookie'];
    assert(
      logoutCookies.some((c) => c.includes('refreshToken=;')),
      'Refresh token cookie is cleared'
    );

    // Verify refresh token cannot be used after logout
    const postLogoutRefresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: refreshRes.body.data.refreshToken });
    assert(postLogoutRefresh.status === 401, 'Refresh token is invalidated in DB after logout');

    // 12. Rate Limiting protection on auth endpoints
    console.log('\n--- Test 12: Rate Limiting Enforcement ---');
    let hitRateLimit = false;
    for (let i = 0; i < 20; i++) {
      const rateLimitRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'rate_test@example.com', password: 'password123' });

      if (rateLimitRes.status === 429) {
        hitRateLimit = true;
        assert(rateLimitRes.body.success === false, 'Rate limit response has success: false');
        assert(
          rateLimitRes.body.message.includes('Too many authentication attempts'),
          'Rate limit message properly formatted'
        );
        break;
      }
    }
    assert(hitRateLimit, 'Rate limiter triggered HTTP 429 Too Many Requests after threshold reached');

    // 13. Swagger Documentation Endpoints
    console.log('\n--- Test 13: Swagger API Documentation ---');
    const docsJsonRes = await request(app).get('/api/docs.json');
    assert(docsJsonRes.status === 200, `Swagger JSON endpoint returns HTTP 200 (got ${docsJsonRes.status})`);
    assert(docsJsonRes.body.openapi === '3.0.0', 'OpenAPI version is 3.0.0');
    assert(!!docsJsonRes.body.paths['/api/auth/register'], 'Registration route documented');
    assert(!!docsJsonRes.body.paths['/api/auth/login'], 'Login route documented');
    assert(!!docsJsonRes.body.paths['/api/auth/me'], 'Profile route documented');

    const docsUiRes = await request(app).get('/api/docs/');
    assert(docsUiRes.status === 200, `Swagger UI HTML endpoint returns HTTP 200 (got ${docsUiRes.status})`);
    assert(docsUiRes.text.includes('swagger-ui'), 'Swagger UI assets and container present in HTML');

    // Summary
    console.log(`\n========================================`);
    console.log(`RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
