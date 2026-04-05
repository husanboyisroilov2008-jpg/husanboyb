const { badRequest, methodNotAllowed, ok, serverError } = require('./_lib/response');
const { normalizeEmail } = require('./_lib/password');
const { clearPendingVerification, getPendingVerification, setPendingVerification } = require('./_lib/storage');
const { createSignupTicket } = require('./_lib/session');

exports.handler = async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return methodNotAllowed(['POST']);
    const body = JSON.parse(event.body || '{}');
    const email = normalizeEmail(body.email || '');
    const code = String(body.code || '').trim();

    if (!email || !code) return badRequest('Email va tasdiqlash kodi kiritilishi kerak.');

    const pending = await getPendingVerification(email, 'signup');
    if (!pending) return badRequest('Bu email uchun faol tasdiqlash kodi topilmadi. Qayta kod yuboring.');
    if (new Date(pending.expiresAt).getTime() < Date.now()) {
      await clearPendingVerification(email, 'signup');
      return badRequest('Kod muddati tugagan. Qayta tasdiqlash kodi yuboring.');
    }

    const attempts = Number(pending.attempts || 0);
    if (attempts >= 5) {
      await clearPendingVerification(email, 'signup');
      return badRequest('Juda ko‘p noto‘g‘ri urinish bo‘ldi. Xavfsizlik uchun yangi kod so‘rang.');
    }

    if (pending.code !== code) {
      await setPendingVerification(email, { ...pending, attempts: attempts + 1 }, 'signup');
      const remaining = 5 - (attempts + 1);
      return badRequest(`Kod noto‘g‘ri. ${remaining > 0 ? `${remaining} ta urinish qoldi.` : 'Urinishlar tugadi.'}`);
    }

    await setPendingVerification(email, {
      ...pending,
      verified: true,
      verifiedAt: new Date().toISOString(),
      code: ''
    }, 'signup');

    return ok({
      message: 'Email muvaffaqiyatli tasdiqlandi.',
      signupTicket: createSignupTicket(email),
      email
    });
  } catch (error) {
    return serverError(error, 'Tasdiqlash kodi tekshirilayotganda xatolik yuz berdi.');
  }
};
