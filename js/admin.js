(() => {
  const {
    api,
    authHeaders,
    buildEmailPreview,
    clearAdminToken,
    clearSession,
    formatDate,
    getAdminToken,
    getSessionToken,
    showToast,
    setAdminToken,
    escapeHtml
  } = window.EduFlowCommon;

  const els = {
    authCard: document.getElementById('admin-auth-card'),
    authStatus: document.getElementById('admin-auth-status'),
    codeInput: document.getElementById('admin-code'),
    loginBtn: document.getElementById('admin-login-btn'),
    panel: document.getElementById('admin-panel'),
    logoutBtn: document.getElementById('admin-logout-btn'),
    adminUserLine: document.getElementById('admin-user-line'),
    statTotal: document.getElementById('stat-total-users'),
    statSubscribers: document.getElementById('stat-subscribers'),
    statEmailUsers: document.getElementById('stat-email-users'),
    statGoogleUsers: document.getElementById('stat-google-users'),
    statLinkedUsers: document.getElementById('stat-linked-users'),
    statCampaigns: document.getElementById('stat-campaigns'),
    usersTable: document.getElementById('users-table-body'),
    campaignHistory: document.getElementById('campaign-history'),
    preview: document.getElementById('campaign-preview'),
    sendBtn: document.getElementById('send-campaign-btn'),
    previewFillBtn: document.getElementById('preview-fill-btn'),
    campaignResult: document.getElementById('campaign-result'),
    subject: document.getElementById('campaign-subject'),
    preheader: document.getElementById('campaign-preheader'),
    title: document.getElementById('campaign-title'),
    buttonText: document.getElementById('campaign-button-text'),
    buttonUrl: document.getElementById('campaign-button-url'),
    summary: document.getElementById('campaign-summary'),
    message: document.getElementById('campaign-message')
  };

  const sessionToken = getSessionToken();
  if (!sessionToken) {
    els.authStatus.textContent = 'Avval bosh sahifadan Google yoki Email orqali kiring, keyin admin kodni kiriting.';
  }

  els.loginBtn?.addEventListener('click', adminLogin);
  els.logoutBtn?.addEventListener('click', logoutAll);
  els.sendBtn?.addEventListener('click', sendCampaign);
  els.previewFillBtn?.addEventListener('click', fillDemoCampaign);
  [els.subject, els.preheader, els.title, els.buttonText, els.buttonUrl, els.summary, els.message].forEach((input) => {
    input?.addEventListener('input', renderPreview);
  });

  init().catch((error) => {
    console.error(error);
    showToast(error.message || 'Admin sahifa yuklanmadi.', 'error');
  });

  async function init() {
    fillDemoCampaign();
    renderPreview();
    const adminToken = getAdminToken();
    if (!adminToken) return;
    try {
      await loadOverview(adminToken);
    } catch (error) {
      clearAdminToken();
      if (error.status && error.status !== 401) showToast(error.message || 'Admin sessiya muddati tugagan.', 'error');
    }
  }

  async function adminLogin() {
    if (!sessionToken) {
      showToast('Avval oddiy account bilan kiring.', 'error');
      window.location.href = '/index.html';
      return;
    }

    const code = els.codeInput.value.trim();
    if (!code) {
      showToast('Admin kodni kiriting.', 'error');
      return;
    }

    els.loginBtn.disabled = true;
    els.loginBtn.textContent = 'Tekshirilmoqda…';
    try {
      const result = await api('/api/admin-login', {
        method: 'POST',
        headers: authHeaders(sessionToken),
        body: JSON.stringify({ code })
      });
      setAdminToken(result.adminToken);
      showToast('Admin kirish muvaffaqiyatli.', 'success');
      await loadOverview(result.adminToken);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Admin kirish amalga oshmadi.', 'error');
    } finally {
      els.loginBtn.disabled = false;
      els.loginBtn.textContent = 'Kirish';
    }
  }

  async function loadOverview(adminToken) {
    const data = await api('/api/admin-overview', {
      headers: authHeaders(adminToken)
    });

    els.authCard.classList.add('hidden');
    els.panel.classList.remove('hidden');
    els.adminUserLine.textContent = `${data.admin.email} orqali kirilgan. Admin sessiya faol.`;
    els.statTotal.textContent = data.stats.totalUsers;
    els.statSubscribers.textContent = data.stats.subscribedUsers;
    els.statEmailUsers.textContent = data.stats.emailUsers;
    els.statGoogleUsers.textContent = data.stats.googleUsers;
    els.statLinkedUsers.textContent = data.stats.linkedUsers;
    els.statCampaigns.textContent = data.stats.totalCampaigns;
    renderUsers(data.users || []);
    renderCampaignHistory(data.campaigns || []);
  }

  function renderUsers(users) {
    if (!users.length) {
      els.usersTable.innerHTML = '<tr><td colspan="5">Hali user ro‘yxatdan o‘tmagan.</td></tr>';
      return;
    }

    els.usersTable.innerHTML = users.map((user) => `
      <tr>
        <td>
          <div class="user-cell">
            <img src="${escapeHtml(user.picture || '/assets/icon-192.png')}" alt="${escapeHtml(user.name || 'User')}" />
            <div>
              <strong>${escapeHtml(user.name || 'Noma’lum')}</strong>
              <div class="muted">${escapeHtml((user.givenName || '') + ' ' + (user.familyName || ''))}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(user.email || '—')}</td>
        <td>${(user.authMethods || []).map((method) => `<span class="badge ${method === 'google' ? 'yes' : ''}">${escapeHtml(method)}</span>`).join(' ') || '—'}</td>
        <td>${formatDate(user.joinedAt)}</td>
        <td><span class="badge ${user.receiveEmails !== false ? 'yes' : 'no'}">${user.receiveEmails !== false ? 'Obuna bor' : 'O‘chiq'}</span></td>
      </tr>
    `).join('');
  }

  function renderCampaignHistory(campaigns) {
    if (!campaigns.length) {
      els.campaignHistory.innerHTML = '<div class="history-item"><strong>Hali kampaniya yuborilmagan.</strong><small>Bu yerda keyingi kampaniyalar tarixi va xatoliklari ko‘rinadi.</small></div>';
      return;
    }

    els.campaignHistory.innerHTML = campaigns.map((campaign) => `
      <article class="history-item">
        <strong>${escapeHtml(campaign.subject || 'No subject')}</strong>
        <div class="muted">${escapeHtml(campaign.title || '')}</div>
        <small>${formatDate(campaign.sentAt)} • ${campaign.sentCount || 0}/${campaign.totalRecipients || 0} yuborildi • ${campaign.failedCount || 0} xato</small>
        ${(campaign.failures || []).length ? `<details class="campaign-errors"><summary>Xatoliklar</summary>${campaign.failures.map((failure) => `<div class="failure-row"><strong>${escapeHtml(failure.email)}</strong><span>${escapeHtml(failure.error)}</span></div>`).join('')}</details>` : ''}
      </article>
    `).join('');
  }

  function fillDemoCampaign() {
    els.subject.value = 'EduFlow Hub: yangi workshop haftaligi boshlandi';
    els.preheader.value = 'Yangi workshoplar, mentorlik sessiyalari va yopiq community update.';
    els.title.value = 'Bu hafta siz uchun yangi workshop va community yangiliklari tayyor';
    els.buttonText.value = 'Profilni ochish';
    els.buttonUrl.value = `${window.location.origin}/profile.html`;
    els.summary.value = 'Community ichida yangi workshoplar, mentorlik sessiyalari va yopiq materiallar e’lon qilindi.';
    els.message.value = 'Assalomu alaykum!\n\nBu hafta siz uchun yangi workshoplar, mentorlar bilan jonli sessiyalar va yopiq materiallar tayyor. Profilingizni ochib, o‘zingizga mos bo‘limlarni ko‘rib chiqing.\n\nSavol bo‘lsa, ushbu emailga javob berishingiz mumkin.';
    renderPreview();
  }

  function collectCampaign() {
    return {
      subject: els.subject.value.trim(),
      preheader: els.preheader.value.trim(),
      title: els.title.value.trim(),
      buttonText: els.buttonText.value.trim(),
      buttonUrl: els.buttonUrl.value.trim(),
      summary: els.summary.value.trim(),
      message: els.message.value.trim()
    };
  }

  function renderPreview() {
    const data = collectCampaign();
    const html = buildEmailPreview(data, 'EduFlow Hub');
    els.preview.innerHTML = `<iframe title="Email preview" srcdoc="${html.replace(/"/g, '&quot;')}"></iframe>`;
  }

  async function sendCampaign() {
    const campaign = collectCampaign();
    if (!campaign.subject || !campaign.title || !campaign.buttonText || !campaign.buttonUrl || !campaign.summary || !campaign.message || !campaign.preheader) {
      showToast('Barcha maydonlarni to‘ldiring.', 'error');
      return;
    }

    const adminToken = getAdminToken();
    if (!adminToken) {
      showToast('Admin sessiya topilmadi. Qayta kiring.', 'error');
      return;
    }

    els.sendBtn.disabled = true;
    els.sendBtn.textContent = 'Yuborilmoqda…';
    try {
      const result = await api('/api/admin-send-broadcast', {
        method: 'POST',
        headers: authHeaders(adminToken),
        body: JSON.stringify(campaign)
      });
      els.campaignResult.className = `inline-status ${result.failedCount ? 'warning' : 'success'}`;
      els.campaignResult.innerHTML = `${escapeHtml(result.message)}${result.failures?.length ? `<div class="result-list">${result.failures.map((failure) => `<div class="failure-row"><strong>${escapeHtml(failure.email)}</strong><span>${escapeHtml(failure.error)}</span></div>`).join('')}</div>` : ''}`;
      showToast(`${result.sentCount} ta email yuborildi.`, result.failedCount ? 'info' : 'success');
      await loadOverview(adminToken);
    } catch (error) {
      console.error(error);
      els.campaignResult.className = 'inline-status error';
      els.campaignResult.textContent = error.message || 'Kampaniya yuborilmadi.';
      showToast(error.message || 'Kampaniya yuborilmadi.', 'error');
    } finally {
      els.sendBtn.disabled = false;
      els.sendBtn.textContent = 'Hamma obunachilarga yuborish';
    }
  }

  function logoutAll() {
    clearAdminToken();
    clearSession();
    window.location.href = '/index.html';
  }
})();
