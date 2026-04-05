const crypto = require('crypto');
const { badRequest, methodNotAllowed, ok, serverError } = require('./_lib/response');
const { normalizeEmail } = require('./_lib/password');
const { clearPendingVerification, findUserByEmail, getCampaigns, getUsers, getPendingVerification, upsertUser, computeStats } = require('./_lib/storage');
const { createUserSession, verifySignedPayload } = require('./_lib/session');

function cleanName(value = '') {
  return String(value).trim().replace(/\s+/g, ' ');
}

exports.handler = async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return methodNotAllowed(['POST']);
    const body = JSON.parse(event.body || '{}');
    const ticket = String(body.signupTicket || '');
    const givenName = cleanName(body.givenName);
    const familyName = cleanName(body.familyName);

    if (!givenName || !familyName) {
      return badRequest('Ism va familiyani to‘liq kiriting.');
    }

    const payload = verifySignedPayload(ticket);
    if (!payload || payload.type !== 'signup-ticket') {
      return badRequest('Tasdiqlash sessiyasi topilmadi yoki muddati tugagan. Qayta kod tasdiqlang.');
    }

    const email = normalizeEmail(payload.email || '');
    const pending = await getPendingVerification(email, 'signup');
    if (!pending || !pending.verified) {
      return badRequest('Email hali tasdiqlanmagan. Avval kodni kiriting.');
    }

    const existing = await findUserByEmail(email);
    const now = new Date().toISOString();
    const nextUser = await upsertUser({
      sub: existing?.sub || `usr_${crypto.randomBytes(12).toString('hex')}`,
      email,
      name: `${givenName} ${familyName}`,
      givenName,
      familyName,
      picture: existing?.picture || '',
      receiveEmails: existing?.receiveEmails !== false,
      joinedAt: existing?.joinedAt || now,
      lastLoginAt: now,
      emailVerified: true,
      authMethods: [...new Set([...(existing?.authMethods || []), 'email'])],
      passwordHash: pending.passwordHash,
      passwordSalt: pending.passwordSalt
    });

    await clearPendingVerification(email, 'signup');
    const users = await getUsers();
    const campaigns = await getCampaigns();

    return ok({
      message: 'Ro‘yxatdan o‘tish muvaffaqiyatli yakunlandi.',
      user: nextUser,
      isNewUser: !existing,
      sessionToken: createUserSession(nextUser),
      stats: computeStats(users, campaigns)
    });
  } catch (error) {
    return serverError(error, 'Email ro‘yxatdan o‘tishini yakunlab bo‘lmadi.');
  }
};
