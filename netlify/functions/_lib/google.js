const { OAuth2Client } = require('google-auth-library');
const { getGoogleClientId } = require('./site');

let cachedClient = null;
let cachedClientId = '';

function getClient() {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID topilmadi.');
  }
  if (!cachedClient || cachedClientId !== clientId) {
    cachedClient = new OAuth2Client(clientId);
    cachedClientId = clientId;
  }
  return { client: cachedClient, clientId };
}

async function verifyGoogleCredential(credential) {
  const { client, clientId } = getClient();
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: clientId
  });
  const payload = ticket.getPayload();
  if (!payload?.email_verified) {
    throw new Error('Google email tasdiqlanmagan.');
  }
  return payload;
}

module.exports = {
  verifyGoogleCredential
};
