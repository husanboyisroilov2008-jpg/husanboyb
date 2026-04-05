const { connectLambda } = require('@netlify/blobs');
const { requireUser } = require('./_lib/auth');
const { createAdminSession } = require('./_lib/session');
const { getAdminCode, isAdminEmailAllowed } = require('./_lib/admin');
const { badRequest, forbidden, methodNotAllowed, ok, serverError, unauthorized } = require('./_lib/response');

exports.handler = async function handler(event) {
  try {
    connectLambda(event);

    if (event.httpMethod !== 'POST') return methodNotAllowed(['POST']);

    const user = await requireUser(event);
    if (!user) return unauthorized('Avval oddiy account bilan kiring.');

    const body = JSON.parse(event.body || '{}');
    if (!body.code) return badRequest('Admin kod yuborilmadi.');
    if (body.code !== getAdminCode()) return forbidden('Admin kod noto‘g‘ri.');

    if (!isAdminEmailAllowed(user.email)) {
      return forbidden(
        'Bu email admin sifatida ruxsat etilmagan. ADMIN_ALLOWED_EMAILS ro‘yxatini tekshiring.'
      );
    }

    return ok({
      adminToken: createAdminSession(user.email),
      adminEmail: user.email
    });
  } catch (error) {
    return serverError(error, 'Admin kirish amalga oshmadi.');
  }
};
