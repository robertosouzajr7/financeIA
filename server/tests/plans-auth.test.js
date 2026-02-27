const test = require('node:test');
const assert = require('node:assert/strict');

const plansRouter = require('../routes/plans');

const { requireAdminRole } = plansRouter;

test('requireAdminRole permite usuário ADMIN', () => {
  const req = { organizationRole: 'ADMIN' };
  let nextCalled = false;

  const res = {
    status() {
      throw new Error('status should not be called for ADMIN');
    },
    json() {
      throw new Error('json should not be called for ADMIN');
    },
  };

  requireAdminRole(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('requireAdminRole bloqueia usuário não ADMIN com 403', () => {
  const req = { organizationRole: 'MEMBER' };
  let statusCode;
  let payload;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    },
  };

  let nextCalled = false;
  requireAdminRole(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(statusCode, 403);
  assert.deepEqual(payload, { error: 'Forbidden: ADMIN role required' });
});
