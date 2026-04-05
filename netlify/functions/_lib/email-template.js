function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shell({ siteName, siteTagline, siteBaseUrl, subject, preheader, body }) {
  const logoUrl = `${siteBaseUrl}/assets/logo.svg`;
  const bannerUrl = `${siteBaseUrl}/assets/banner.svg`;

  return `<!DOCTYPE html>
<html lang="uz">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0; padding:0; background:#eef4ff; font-family:Inter,Arial,sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">${escapeHtml(preheader || '')}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef4ff; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="680" cellpadding="0" cellspacing="0" style="max-width:680px; width:100%; background:#ffffff; border-radius:26px; overflow:hidden; border:1px solid #dbe7ff;">
            <tr>
              <td style="background:#071127; padding:20px 24px;">
                <img src="${logoUrl}" alt="${escapeHtml(siteName)}" width="200" style="display:block; width:200px; max-width:100%;" />
              </td>
            </tr>
            <tr>
              <td><img src="${bannerUrl}" alt="${escapeHtml(siteName)} banner" width="680" style="display:block; width:100%; max-width:680px;" /></td>
            </tr>
            <tr>
              <td style="padding:30px 30px 10px;">${body}</td>
            </tr>
            <tr>
              <td style="padding:18px 30px 30px; color:#64748b; line-height:1.7; font-size:14px;">
                <strong style="color:#0f172a;">${escapeHtml(siteName)}</strong><br />
                ${escapeHtml(siteTagline)}<br />
                Bu xat sayt xavfsizligi va aloqa funksiyalari uchun yuborildi.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildEmailHtml({
  recipientName,
  siteName,
  siteTagline,
  siteBaseUrl,
  subject,
  preheader,
  title,
  summary,
  message,
  buttonText,
  buttonUrl
}) {
  const safeMessage = String(message || '')
    .split('\n')
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 14px; line-height:1.8; color:#334155;">${escapeHtml(line)}</p>`)
    .join('');

  const body = `
    <p style="margin:0 0 10px; color:#64748b; font-size:14px;">Assalomu alaykum, ${escapeHtml(recipientName || 'qadrli a’zo')}!</p>
    <h1 style="margin:0 0 14px; color:#071127; font-size:32px; line-height:1.15;">${escapeHtml(title)}</h1>
    <p style="margin:0 0 18px; color:#475569; line-height:1.8;">${escapeHtml(summary)}</p>
    ${safeMessage}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 8px;">
      <tr>
        <td style="border-radius:14px; background:linear-gradient(135deg,#2b5cff,#00d1ff);">
          <a href="${escapeHtml(buttonUrl)}" style="display:inline-block; padding:14px 22px; color:#ffffff; text-decoration:none; font-weight:700; border-radius:14px;">${escapeHtml(buttonText)}</a>
        </td>
      </tr>
    </table>
  `;

  return shell({ siteName, siteTagline, siteBaseUrl, subject, preheader, body });
}

function buildVerificationEmailHtml({ siteName, siteTagline, siteBaseUrl, code, expiresMinutes = 10, purpose = 'email tasdiqlash' }) {
  const body = `
    <p style="margin:0 0 10px; color:#64748b; font-size:14px;">Salom!</p>
    <h1 style="margin:0 0 14px; color:#071127; font-size:30px; line-height:1.15;">${escapeHtml(siteName)} uchun tasdiqlash kodi</h1>
    <p style="margin:0 0 18px; color:#475569; line-height:1.8;">Siz ${escapeHtml(purpose)} jarayonini boshladingiz. Quyidagi bir martalik kodni kiriting:</p>
    <div style="margin:20px 0 22px; padding:18px 22px; border-radius:20px; background:#071127; color:#ffffff; font-size:34px; letter-spacing:8px; font-weight:800; text-align:center;">${escapeHtml(code)}</div>
    <p style="margin:0 0 16px; color:#475569; line-height:1.8;">Kod <strong>${expiresMinutes} daqiqa</strong> davomida amal qiladi. Agar bu amalni siz bajarmagan bo‘lsangiz, xatni e’tiborsiz qoldiring.</p>
    <p style="margin:0; color:#64748b; font-size:14px; line-height:1.7;">Xavfsizlik uchun kodni boshqa hech kimga yubormang.</p>
  `;

  return shell({
    siteName,
    siteTagline,
    siteBaseUrl,
    subject: `${siteName}: tasdiqlash kodi`,
    preheader: `${code} — ${siteName} verifikatsiya kodi`,
    body
  });
}

module.exports = {
  buildEmailHtml,
  buildVerificationEmailHtml,
  escapeHtml
};
