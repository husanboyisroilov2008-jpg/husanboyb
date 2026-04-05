const { extractBearerToken, verifySignedPayload } = require('./session');
const { findUserBySubOrEmail } = require('./storage');

async function requireUser(event) {
  const token = extractBearerToken(event);
  const payload = verifySignedPayload(token);
  if (!payload || payload.type !== 'user') return null;
  const user = await findUserBySubOrEmail({ sub: payload.sub, email: payload.email });
  return user || null;
}

function requireAdmin(event) {
  const token = extractBearerToken(event);
  const payload = verifySignedPayload(token);
  if (!payload || payload.type !== 'admin' || !payload.admin) return null;
  return payload;
}

module.exports = {
  requireAdmin,
  requireUser
};
