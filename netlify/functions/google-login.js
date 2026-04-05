const { connectLambda } = require('@netlify/blobs');
const { badRequest, methodNotAllowed, ok, serverError } = require('./_lib/response');
const { verifyGoogleCredential } = require('./_lib/google');
const { upsertUser, getUsers, getCampaigns, computeStats, findUserByEmail } = require('./_lib/storage');
const { createUserSession } = require('./_lib/session');

exports.handler = async function handler(event) {
  try {
    connectLambda(event);

    if (event.httpMethod !== 'POST') return methodNotAllowed(['POST']);

    const body = JSON.parse(event.body || '{}');
    if (!body.credential) return badRequest('Google credential yuborilmadi.');

    const payload = await verifyGoogleCredential(body.credential);
    const now = new Date().toISOString();
    const existing = await findUserByEmail(payload.email);

    const authMethods = [...new Set([...(existing?.authMethods || []), 'google'])];

    const nextUser = await upsertUser({
      sub: existing?.sub || payload.sub,
      email: payload.email,
      name:
        payload.name ||
        `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
      givenName: payload.given_name || existing?.givenName || '',
      familyName: payload.family_name || existing?.familyName || '',
      picture: payload.picture || existing?.picture || '',
      receiveEmails: existing?.receiveEmails !== false,
      joinedAt: existing?.joinedAt || now,
      lastLoginAt: now,
      emailVerified: true,
      authMethods,
      passwordHash: existing?.passwordHash || '',
      passwordSalt: existing?.passwordSalt || ''
    });

    const users = await getUsers();
    const campaigns = await getCampaigns();

    return ok({
      user: nextUser,
      isNewUser: !existing,
      sessionToken: createUserSession(nextUser),
      stats: computeStats(users, campaigns)
    });
  } catch (error) {
    return serverError(error, 'Google login bajarilmadi.');
  }
};
