const { connectLambda } = require('@netlify/blobs');
const { badRequest, methodNotAllowed, ok, serverError } = require('./_lib/response');
const { createPasswordHash, isValidEmail, normalizeEmail, validatePassword } = require('./_lib/password');
const { findUserByEmail, getPendingVerification, setPendingVerification } = require('./_lib/storage');
const { buildVerificationEmailHtml } = require('./_lib/email-template');
const { getMailer, getMailIdentity } = require('./_lib/mailer');
const { getSiteBaseUrl, getSiteName, getSiteTagline } = require('./_lib/site');

const EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_MS = 60 * 1000;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function maskEmail(email) {
  const [name, domain] = normalizeEmail(email).split('@');
  const visibleName = name.length <= 2 ? `${name[0] || '*'}*` : `${name.slice(0, 2)}***`;
  return `${visibleName}@${domain}`;
}

exports.handler = async function handler(event) {
  try {
    connectLambda(event);

    if (event.httpMethod !== 'POST') return methodNotAllowed(['POST']);

    const body = JSON.parse(event.body || '{}');
    const email = normalizeEmail(body.email || '');
    const password = String(body.password || '');

    if (!isValidEmail(email)) {
      return badRequest('Email format noto‘g‘ri. Masalan: name@example.com');
    }

    const passwordError = validatePassword(password);
    if (passwordError) return badRequest(passwordError);

    const existingUser = await findUserByEmail(email);
    if (existingUser && (existingUser.authMethods || []).includes('email') && existingUser.passwordHash) {
      return badRequest('Bu email allaqachon email-parol orqali ro‘yxatdan o‘tgan. Kirish oynasidan foydalaning.');
    }

    const pending = await getPendingVerification(email, 'signup');
    if (pending?.sentAt && Date.now() - new Date(pending.sentAt).getTime() < RESEND_COOLDOWN_MS) {
      return badRequest('Kod yaqinda yuborilgan. Qayta yuborishdan oldin taxminan 1 daqiqa kuting.');
    }

    const mailer = getMailer();
    await mailer.verify();

    const code = generateCode();
    const passwordRecord = await createPasswordHash(password);
    const sentAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000).toISOString();

    await setPendingVerification(
      email,
      {
        code,
        sentAt,
        expiresAt,
        attempts: 0,
        verified: false,
        ...passwordRecord
      },
      'signup'
    );

    const siteName = getSiteName();
    const siteTagline = getSiteTagline();
    const siteBaseUrl = getSiteBaseUrl(event);

    if (!siteBaseUrl) {
      return badRequest('Sayt URL aniqlanmadi. SITE_BASE_URL ni kiriting yoki Netlify domenini tekshiring.');
    }

    const identity = getMailIdentity();

    await mailer.sendMail({
      from: `${identity.fromName} <${identity.fromEmail}>`,
      to: email,
      replyTo: identity.replyTo,
      subject: `${siteName}: tasdiqlash kodi`,
      html: buildVerificationEmailHtml({
        siteName,
        siteTagline,
        siteBaseUrl,
        code,
        expiresMinutes: EXPIRY_MINUTES,
        purpose: 'email orqali ro‘yxatdan o‘tish'
      })
    });

    return ok({
      message: `Tasdiqlash kodi ${maskEmail(email)} manziliga yuborildi.`,
      email,
      expiresInMinutes: EXPIRY_MINUTES
    });
  } catch (error) {
    return serverError(error, 'Tasdiqlash xati yuborilmadi. SMTP sozlamalari va email manzilini tekshiring.');
  }
};
