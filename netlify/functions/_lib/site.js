const DEFAULT_GOOGLE_CLIENT_ID = '419515521066-dpvqqnd461n2p1u9g6tocd9tahocujuq.apps.googleusercontent.com';

function cleanUrl(value = '') {
  return String(value || '').trim().replace(/\/$/, '');
}

function getGoogleClientId() {
  return cleanUrl(process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID);
}

function getSiteName() {
  return process.env.SITE_NAME || 'EduFlow Hub';
}

function getSiteTagline() {
  return process.env.SITE_TAGLINE || 'Workshops, mentors, and private member spaces.';
}

function deriveOriginFromEvent(event = {}) {
  const headers = event.headers || {};
  const host = headers['x-forwarded-host'] || headers.host || headers.Host || '';
  const proto = headers['x-forwarded-proto'] || 'https';
  if (!host) return '';
  return cleanUrl(`${proto}://${host}`);
}

function getSiteBaseUrl(event = {}) {
  return cleanUrl(process.env.SITE_BASE_URL) || deriveOriginFromEvent(event);
}

module.exports = {
  DEFAULT_GOOGLE_CLIENT_ID,
  getGoogleClientId,
  getSiteBaseUrl,
  getSiteName,
  getSiteTagline
};
