const crypto = require('crypto');

function getSecret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_ACCESS_CODE || process.env.GOOGLE_CLIENT_ID || 'eduflow-dev-secret';
}

function base64url(input) {
  const value = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return value.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signPayload(payload) {
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(encodedPayload)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${encodedPayload}.${signature}`;
}

function verifySignedPayload(token) {
  if (!token || !token.includes('.')) return null;
  const [encodedPayload, signature] = token.split('.');
  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(encodedPayload)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const normalized = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '==='.slice((normalized.length + 3) % 4);
    const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function extractBearerToken(event) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : '';
}

function createUserSession(user) {
  return signPayload({
    type: 'user',
    sub: user.sub,
    email: user.email,
    name: user.name,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7
  });
}

function createAdminSession(email) {
  return signPayload({
    type: 'admin',
    admin: true,
    email,
    exp: Date.now() + 1000 * 60 * 60 * 12
  });
}

function createSignupTicket(email) {
  return signPayload({
    type: 'signup-ticket',
    email,
    exp: Date.now() + 1000 * 60 * 20
  });
}

module.exports = {
  createAdminSession,
  createSignupTicket,
  createUserSession,
  extractBearerToken,
  signPayload,
  verifySignedPayload
};
