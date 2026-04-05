const { badRequest, methodNotAllowed, ok, serverError } = require('./_lib/response');
const { isValidEmail, normalizeEmail, verifyPassword } = require('./_lib/password');
const { findUserByEmail, getCampaigns, getUsers, upsertUser, computeStats } = require('./_lib/storage');
const { createUserSession } = require('./_lib/session');

exports.handler = async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return methodNotAllowed(['POST']);
    const body = JSON.parse(event.body || '{}');
    const email = normalizeEmail(body.email || '');
    const password = String(body.password || '');

    if (!isValidEmail(email)) return badRequest('Email format noto‘g‘ri.');
    if (!password) return badRequest('Parolni kiriting.');

    const user = await findUserByEmail(email);
    if (!user) return badRequest('Bu email bilan account topilmadi. Avval ro‘yxatdan o‘ting yoki Google orqali kiring.');
    if (!(user.authMethods || []).includes('email') || !user.passwordHash || !user.passwordSalt) {
      return badRequest('Bu email uchun parol orqali kirish yoqilmagan. Shu email bilan Google orqali kiring yoki yangi email-parol bilan ro‘yxatdan o‘ting.');
    }

    const passwordOk = await verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!passwordOk) return badRequest('Parol noto‘g‘ri. Qayta tekshirib kiriting.');

    const updatedUser = await upsertUser({
      ...user,
      lastLoginAt: new Date().toISOString()
    });

    const users = await getUsers();
    const campaigns = await getCampaigns();
    return ok({
      message: 'Kirish muvaffaqiyatli bajarildi.',
      user: updatedUser,
      sessionToken: createUserSession(updatedUser),
      stats: computeStats(users, campaigns)
    });
  } catch (error) {
    return serverError(error, 'Email orqali kirishda xatolik yuz berdi.');
  }
};
