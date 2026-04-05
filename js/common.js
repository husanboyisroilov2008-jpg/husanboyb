(function () {
  const SESSION_KEY = 'eduflow_session_token';
  const USER_KEY = 'eduflow_user';
  const ADMIN_KEY = 'eduflow_admin_token';
  const WELCOME_KEY = 'eduflow_show_welcome';

  function showToast(message, type = 'info') {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const item = document.createElement('div');
    item.className = `toast ${type}`;
    item.textContent = message;
    root.appendChild(item);
    setTimeout(() => item.remove(), 4200);
  }

  async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const isJsonBody = options.body && !(options.body instanceof FormData);
    if (isJsonBody && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');

    const response = await fetch(path, { ...options, headers });
    const text = await response.text();
    let payload = {};

    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { message: text || 'Noma’lum xatolik yuz berdi.' };
    }

    if (!response.ok) {
      const err = new Error(payload.message || 'So‘rov bajarilmadi.');
      err.status = response.status;
      err.payload = payload;
      throw err;
    }

    return payload;
  }

  function setSession(token, user) {
    localStorage.setItem(SESSION_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function getSessionToken() {
    return localStorage.getItem(SESSION_KEY) || '';
  }

  function getCachedUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function setAdminToken(token) {
    localStorage.setItem(ADMIN_KEY, token);
  }

  function getAdminToken() {
    return localStorage.getItem(ADMIN_KEY) || '';
  }

  function clearAdminToken() {
    localStorage.removeItem(ADMIN_KEY);
  }

  function markWelcomeNeeded() {
    localStorage.setItem(WELCOME_KEY, '1');
  }

  function consumeWelcomeFlag() {
    const value = localStorage.getItem(WELCOME_KEY) === '1';
    localStorage.removeItem(WELCOME_KEY);
    return value;
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function requireSessionOrRedirect() {
    const token = getSessionToken();
    if (!token) {
      window.location.href = '/index.html';
      return '';
    }
    return token;
  }

  function authHeaders(token, extra = {}) {
    return { ...extra, Authorization: `Bearer ${token}` };
  }

  function initialsFromName(name) {
    if (!name) return 'U';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || '')
      .join('')
      .toUpperCase();
  }

  function buildEmailPreview(campaign, siteName = 'EduFlow Hub') {
    const title = campaign.title || 'Siz uchun muhim yangilik';
    const summary = campaign.summary || 'Yangi imkoniyatlar va e’lonlar bilan tanishing.';
    const message = (campaign.message || 'Jamoamizdan yangi xabar bor.')
      .split('\n')
      .map((line) => `<p style="margin:0 0 14px; line-height:1.75; color:#334155;">${escapeHtml(line)}</p>`)
      .join('');
    const buttonText = campaign.buttonText || 'Profilni ochish';
    const buttonUrl = campaign.buttonUrl || '#';

    return `
      <div style="background:#eef4ff; padding:28px; font-family:Inter,Arial,sans-serif; min-height:100%;">
        <div style="max-width:680px; margin:0 auto; background:#ffffff; border-radius:26px; overflow:hidden; border:1px solid #dce7ff;">
          <div style="background:#071127; padding:20px 24px;">
            <img src="/assets/logo.svg" alt="${siteName}" style="width:190px; max-width:100%; display:block;" />
          </div>
          <img src="/assets/banner.svg" alt="Banner" style="width:100%; display:block;" />
          <div style="padding:28px;">
            <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(campaign.preheader || '')}</div>
            <h1 style="margin:0 0 14px; color:#071127; font-size:32px; line-height:1.15;">${escapeHtml(title)}</h1>
            <p style="margin:0 0 18px; color:#475569; line-height:1.8;">${escapeHtml(summary)}</p>
            ${message}
            <a href="${escapeAttribute(buttonUrl)}" style="display:inline-block; margin-top:8px; background:linear-gradient(135deg,#2b5cff,#00d1ff); color:white; text-decoration:none; padding:14px 22px; border-radius:14px; font-weight:700;">${escapeHtml(buttonText)}</a>
          </div>
          <div style="padding:20px 28px; background:#f8fbff; color:#64748b; font-size:14px; border-top:1px solid #e4ecff;">
            ${siteName} • Workshoplar, mentorlik va community yangiliklari.
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttribute(value = '') {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  window.EduFlowCommon = {
    api,
    authHeaders,
    buildEmailPreview,
    clearAdminToken,
    clearSession,
    consumeWelcomeFlag,
    escapeHtml,
    formatDate,
    getAdminToken,
    getCachedUser,
    getSessionToken,
    initialsFromName,
    markWelcomeNeeded,
    requireSessionOrRedirect,
    setAdminToken,
    setSession,
    showToast
  };
})();
