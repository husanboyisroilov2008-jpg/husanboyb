const { connectLambda } = require('@netlify/blobs');
const { badRequest, methodNotAllowed, ok, serverError, unauthorized } = require('./_lib/response');
const { requireAdmin } = require('./_lib/auth');
const { getUsers, addCampaign } = require('./_lib/storage');
const { buildEmailHtml } = require('./_lib/email-template');
const { getMailer, getMailIdentity } = require('./_lib/mailer');
const { getSiteBaseUrl, getSiteName, getSiteTagline } = require('./_lib/site');

function validateCampaign(body) {
  const required = ['subject', 'preheader', 'title', 'buttonText', 'buttonUrl', 'summary', 'message'];
  return required.filter((key) => !String(body[key] || '').trim());
}

exports.handler = async function handler(event) {
  try {
    connectLambda(event);

    if (event.httpMethod !== 'POST') return methodNotAllowed(['POST']);

    const admin = requireAdmin(event);
    if (!admin) return unauthorized('Admin sessiya topilmadi.');

    const body = JSON.parse(event.body || '{}');
    const missing = validateCampaign(body);
    if (missing.length) {
      return badRequest(`Quyidagi maydonlar to‘ldirilishi kerak: ${missing.join(', ')}`);
    }

    const users = await getUsers();
    const recipients = users.filter((user) => user.email && user.receiveEmails !== false);
    if (!recipients.length) return badRequest('Email qabul qiluvchi obunachilar topilmadi.');

    const siteName = getSiteName();
    const siteTagline = getSiteTagline();
    const siteBaseUrl = getSiteBaseUrl(event);

    if (!siteBaseUrl) {
      return badRequest('Sayt URL aniqlanmadi. SITE_BASE_URL ni kiriting yoki Netlify domenini tekshiring.');
    }

    const mailer = getMailer();
    await mailer.verify();
    const identity = getMailIdentity();

    let sentCount = 0;
    const failures = [];

    for (const recipient of recipients) {
      const html = buildEmailHtml({
        recipientName: recipient.givenName || recipient.name || recipient.email,
        siteName,
        siteTagline,
        siteBaseUrl,
        subject: body.subject,
        preheader: body.preheader,
        title: body.title,
        summary: body.summary,
        message: body.message,
        buttonText: body.buttonText,
        buttonUrl: body.buttonUrl
      });

      try {
        await mailer.sendMail({
          from: `${identity.fromName} <${identity.fromEmail}>`,
          to: recipient.email,
          replyTo: identity.replyTo,
          subject: body.subject,
          html
        });
        sentCount += 1;
      } catch (error) {
        failures.push({
          email: recipient.email,
          error: String(error.message || error)
        });
      }
    }

    const campaignLog = {
      subject: body.subject,
      preheader: body.preheader,
      title: body.title,
      buttonText: body.buttonText,
      buttonUrl: body.buttonUrl,
      summary: body.summary,
      message: body.message,
      sentAt: new Date().toISOString(),
      sentCount,
      failedCount: failures.length,
      requestedBy: admin.email,
      totalRecipients: recipients.length,
      failures
    };

    await addCampaign(campaignLog);

    return ok({
      message: failures.length
        ? `${sentCount} ta yuborildi, ${failures.length} ta yuborilmadi.`
        : `${sentCount} ta email muvaffaqiyatli yuborildi.`,
      sentCount,
      failedCount: failures.length,
      totalRecipients: recipients.length,
      failures
    });
  } catch (error) {
    return serverError(error, 'Broadcast email yuborilmadi. SMTP yoki environment sozlamalarini tekshiring.');
  }
};
