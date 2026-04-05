(() => {
  const {
    api,
    authHeaders,
    clearAdminToken,
    clearSession,
    consumeWelcomeFlag,
    formatDate,
    requireSessionOrRedirect,
    showToast,
    escapeHtml
  } = window.EduFlowCommon;

  const sessionToken = requireSessionOrRedirect();
  if (!sessionToken) return;

  const els = {
    avatar: document.getElementById('profile-avatar'),
    name: document.getElementById('profile-name'),
    email: document.getElementById('profile-email'),
    authMethods: document.getElementById('auth-methods'),
    givenName: document.getElementById('given-name'),
    familyName: document.getElementById('family-name'),
    joinedDate: document.getElementById('joined-date'),
    lastLogin: document.getElementById('last-login'),
    optIn: document.getElementById('email-optin'),
    saveBtn: document.getElementById('save-preferences-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    communityUsers: document.getElementById('community-users'),
    communitySubscribers: document.getElementById('community-subscribers'),
    communityNewToday: document.getElementById('community-new-today'),
    communityLinked: document.getElementById('community-linked'),
    personalizedTip: document.getElementById('personalized-tip'),
    welcomeOverlay: document.getElementById('welcome-overlay'),
    welcomeMessage: document.getElementById('welcome-message'),
    closeWelcomeBtn: document.getElementById('close-welcome-btn')
  };

  els.logoutBtn?.addEventListener('click', logout);
  els.closeWelcomeBtn?.addEventListener('click', closeWelcome);
  els.saveBtn?.addEventListener('click', savePreferences);

  init().catch((error) => {
    console.error(error);
    if (error.status === 401) {
      logout();
      return;
    }
    showToast(error.message || 'Profil yuklanmadi.', 'error');
  });

  async function init() {
    const me = await api('/api/me', { headers: authHeaders(sessionToken) });
    renderProfile(me);
    maybeShowWelcome(me.user);
  }

  function renderProfile(data) {
    const { user, stats } = data;
    els.avatar.src = user.picture || '/assets/icon-192.png';
    els.name.textContent = user.name || 'EduFlow a’zosi';
    els.email.textContent = user.email || '—';
    els.authMethods.innerHTML = (user.authMethods || []).length
      ? user.authMethods.map((method) => `<span class="badge yes">${escapeHtml(method === 'google' ? 'Google' : 'Email')}</span>`).join('')
      : '<span class="badge">Faqat profil</span>';
    els.givenName.textContent = user.givenName || '—';
    els.familyName.textContent = user.familyName || '—';
    els.joinedDate.textContent = formatDate(user.joinedAt);
    els.lastLogin.textContent = formatDate(user.lastLoginAt);
    els.optIn.checked = user.receiveEmails !== false;
    els.communityUsers.textContent = stats.totalUsers;
    els.communitySubscribers.textContent = stats.subscribedUsers;
    els.communityNewToday.textContent = stats.newToday;
    els.communityLinked.textContent = stats.linkedUsers;
    els.personalizedTip.textContent = `${user.givenName || user.name || 'Siz'} uchun tavsiya: email update yoqilgan bo‘lsa, yangi workshop, mentorlik sessiyasi va community takliflari birinchi bo‘lib sizga yetib boradi.`;
  }

  async function savePreferences() {
    els.saveBtn.disabled = true;
    els.saveBtn.textContent = 'Saqlanmoqda…';
    try {
      const payload = await api('/api/update-profile', {
        method: 'POST',
        headers: authHeaders(sessionToken),
        body: JSON.stringify({ receiveEmails: els.optIn.checked })
      });
      renderProfile(payload);
      showToast('Profil sozlamalari saqlandi.', 'success');
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Saqlash muvaffaqiyatsiz.', 'error');
    } finally {
      els.saveBtn.disabled = false;
      els.saveBtn.textContent = 'Saqlash';
    }
  }

  function maybeShowWelcome(user) {
    if (!consumeWelcomeFlag()) return;
    els.welcomeMessage.textContent = `${user.name || 'Aziz foydalanuvchi'}, EduFlow Hub’ga xush kelibsiz!`;
    els.welcomeOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeWelcome() {
    els.welcomeOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function logout() {
    clearSession();
    clearAdminToken();
    window.location.href = '/index.html';
  }
})();
