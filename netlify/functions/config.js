const { ok, methodNotAllowed, serverError } = require('./_lib/response');
const { getGoogleClientId, getSiteBaseUrl, getSiteName, getSiteTagline } = require('./_lib/site');

exports.handler = async function handler(event) {
  try {
    if (event.httpMethod !== 'GET') return methodNotAllowed(['GET']);
    const googleClientId = getGoogleClientId();
    return ok({
      googleEnabled: Boolean(googleClientId),
      googleClientId,
      emailEnabled: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
      siteName: getSiteName(),
      siteBaseUrl: getSiteBaseUrl(event),
      siteTagline: getSiteTagline()
    });
  } catch (error) {
    return serverError(error, 'Config olinmadi.');
  }
};
