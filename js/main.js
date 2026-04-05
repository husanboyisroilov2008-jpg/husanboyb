(() => {
  const {
    api,
    authHeaders,
    getSessionToken,
    setSession,
    markWelcomeNeeded,
    showToast
  } = window.EduFlowCommon;

  const els = {
    openAuthBtns: document.querySelectorAll('#open-auth-btn, #hero-open-auth-btn'),
    modal: document.getElementById('auth-modal'),
    closeModalBtn: document.getElementById('close-auth-btn'),
    googleWrap: document.getElementById('google-signin-button'),
    googleStatus: document.getElementById('google-status'),
    globalStatus: document.getElementById('auth-global-status'),
    authSubtitle: document.getElementById('auth-subtitle'),
    sessionCopy: document.getElementById('session-state-copy'),
    continueBtn: document.getElementById('continue-session-btn'),
    modeBtns: document.querySelectorAll('[data-auth-mode]'),
    signinForm: document.getElementById('email-signin-form'),
    signupForm: document.getElementById('email-signup-form'),
    signinEmail: document.getElementById('signin-email'),
    signinPassword: document.getElementById('signin-password'),
    signupEmail: document.getElementById('signup-email'),
    signupPassword: document.getElementById('signup-password'),
    signupCode: document.getElementById('signup-code'),
    signupGivenName: document.getElementById('signup-given-name'),
    signupFamilyName: document.getElementById('signup-family-name'),
    signupStartBtn: document.getElementById('signup-start-btn'),
    signupVerifyBtn: document.getElementById('signup-verify-btn'),
    signupCompleteBtn: document.getElementById('signup-complete-btn'),
    signupBackBtn: document.getElementById('signup-back-btn'),
    signinBtn: document.getElementById('email-signin-btn'),
    stepCredentials: document.getElementById('signup-step-credentials'),
    stepVerify: document.getElementById('signup-step-verify'),
    stepProfile: document.getElementById('signup-step-profile')
  };

  const state = {
    mode: 'signin',
    signupEmail: '',
    signupTicket: '',
    publicConfig: null
  };

  els.openAuthBtns.forEach((button) => button?.addEventListener('click', openAuthModal));
  els.closeModalBtn?.addEventListener('click', closeAuthModal);
  els.continueBtn?.addEventListener('click', () => { window.location.href = '/profile.html'; });
  els.modeBtns.forEach((button) => button.addEventListener('click', () => switchMode(button.dataset.authMode)));
  document.querySelectorAll('[data-close-auth="1"]').forEach((node) => node.addEventListener('click', closeAuthModal));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAuthModal();
  });

  els.signinForm?.addEventListener('submit', handleEmailSignin);
  els.signupStartBtn?.addEventListener('click', handleSignupStart);
  els.signupVerifyBtn?.addEventListener('click', handleSignupVerify);
  els.signupCompleteBtn?.addEventListener('click', handleSignupComplete);
  els.signupBackBtn?.addEventListener('click', () => setSignupStep('credentials'));

  init().catch((error) => {
    console.error(error);
    setStatus(error.message || 'Konfiguratsiya yuklanmadi.', 'error');
  });

  async function init() {
    state.publicConfig = await api('/api/config');
    await hydrateSessionState();
    initGoogle();
    switchMode('signin');
    if (!state.publicConfig?.emailEnabled) {
      setStatus('Email ro‘yxatdan o‘tishi ishlashi uchun SMTP_USER va SMTP_PASS ni sozlang.', 'warning');
    }
  }

  async function hydrateSessionState() {
    const sessionToken = getSessionToken();
    if (!sessionToken) return;
    try {
      const me = await api('/api/me', { headers: authHeaders(sessionToken) });
      els.continueBtn.classList.remove('hidden');
      els.sessionCopy.textContent = `${me.user.name} sifatida kirasiz. Istasangiz shu yerdan profilingizga o‘ting.`;
    } catch {
      localStorage.removeItem('eduflow_session_token');
      localStorage.removeItem('eduflow_user');
    }
  }

  function initGoogle() {
    if (!state.publicConfig?.googleEnabled || !state.publicConfig?.googleClientId) {
      els.googleStatus.textContent = 'Google kirish hali sozlanmagan. Netlify Environment variables ichiga GOOGLE_CLIENT_ID kiriting.';
      els.googleStatus.className = 'inline-status warning';
      return;
    }

    window.handleEduFlowGoogle = async function handleEduFlowGoogle(response) {
      try {
        setStatus('Google token tekshirilmoqda…', 'neutral');
        const result = await api('/api/google-login', {
          method: 'POST',
          body: JSON.stringify({ credential: response.credential })
        });
        setSession(result.sessionToken, result.user);
        markWelcomeNeeded();
        showToast(result.isNewUser ? 'Google orqali yangi profil yaratildi.' : 'Google orqali muvaffaqiyatli kirildi.', 'success');
        window.location.href = '/profile.html';
      } catch (error) {
        console.error(error);
        setStatus(error.message || 'Google login amalga oshmadi.', 'error');
      }
    };

    const tryInit = (attempt = 0) => {
      if (!window.google?.accounts?.id) {
        if (attempt > 40) {
          els.googleStatus.textContent = 'Google skripti yuklanmadi. Internet va browser konsolini tekshiring.';
          els.googleStatus.className = 'inline-status warning';
          return;
        }
        window.setTimeout(() => tryInit(attempt + 1), 200);
        return;
      }

      els.googleStatus.textContent = 'Google kirish tayyor.';
      els.googleStatus.className = 'inline-status success';

      window.google.accounts.id.initialize({
        client_id: state.publicConfig.googleClientId,
        callback: window.handleEduFlowGoogle,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin'
      });

      window.google.accounts.id.renderButton(els.googleWrap, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        width: 300,
        text: 'continue_with'
      });
    };

    tryInit();
  }

  function openAuthModal() {
    els.modal.classList.remove('hidden');
    els.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeAuthModal() {
    els.modal.classList.add('hidden');
    els.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function switchMode(mode) {
    state.mode = mode;
    els.modeBtns.forEach((button) => button.classList.toggle('active', button.dataset.authMode === mode));
    const signup = mode === 'signup';
    els.signinForm.classList.toggle('hidden', signup);
    els.signupForm.classList.toggle('hidden', !signup);
    els.authSubtitle.textContent = signup
      ? 'Email uchun kod yuboriladi, Google esa bir bosishda account ochadi.'
      : 'Mavjud account bilan Google yoki email-parol orqali kiring.';
    if (signup) {
      setSignupStep(state.signupTicket ? 'profile' : 'credentials');
    }
    setStatus(signup ? 'Ro‘yxatdan o‘tish oynasi tayyor.' : 'Kirish oynasi tayyor.', 'neutral');
  }

  function setSignupStep(step) {
    const isCredentials = step === 'credentials';
    const isVerify = step === 'verify';
    const isProfile = step === 'profile';
    els.stepCredentials.classList.toggle('hidden', !isCredentials);
    els.stepVerify.classList.toggle('hidden', !isVerify);
    els.stepProfile.classList.toggle('hidden', !isProfile);

    if (isCredentials) {
      state.signupTicket = '';
      els.signupCode.value = '';
      els.signupGivenName.value = '';
      els.signupFamilyName.value = '';
    }
  }

  function setStatus(message, kind = 'neutral') {
    els.globalStatus.textContent = message;
    els.globalStatus.className = `inline-status ${kind}`;
  }

  function setBusy(button, busyText, idleText, isBusy) {
    if (!button) return;
    button.disabled = isBusy;
    button.textContent = isBusy ? busyText : idleText;
  }

  async function handleEmailSignin(event) {
    event.preventDefault();
    setBusy(els.signinBtn, 'Kirilmoqda…', 'Email bilan kirish', true);
    try {
      const result = await api('/api/email-login', {
        method: 'POST',
        body: JSON.stringify({
          email: els.signinEmail.value.trim(),
          password: els.signinPassword.value
        })
      });
      setSession(result.sessionToken, result.user);
      showToast('Email orqali kirish muvaffaqiyatli bajarildi.', 'success');
      window.location.href = '/profile.html';
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Email login bajarilmadi.', 'error');
    } finally {
      setBusy(els.signinBtn, 'Kirilmoqda…', 'Email bilan kirish', false);
    }
  }

  async function handleSignupStart() {
    setBusy(els.signupStartBtn, 'Yuborilmoqda…', 'Tasdiqlash kodini yuborish', true);
    try {
      const payload = await api('/api/email-signup-start', {
        method: 'POST',
        body: JSON.stringify({
          email: els.signupEmail.value.trim(),
          password: els.signupPassword.value
        })
      });
      state.signupEmail = payload.email;
      setSignupStep('verify');
      setStatus(payload.message || 'Kod yuborildi.', 'success');
      showToast('Tasdiqlash kodi yuborildi.', 'success');
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Tasdiqlash kodi yuborilmadi.', 'error');
    } finally {
      setBusy(els.signupStartBtn, 'Yuborilmoqda…', 'Tasdiqlash kodini yuborish', false);
    }
  }

  async function handleSignupVerify() {
    setBusy(els.signupVerifyBtn, 'Tekshirilmoqda…', 'Kodni tasdiqlash', true);
    try {
      const payload = await api('/api/email-signup-verify', {
        method: 'POST',
        body: JSON.stringify({
          email: state.signupEmail || els.signupEmail.value.trim(),
          code: els.signupCode.value.trim()
        })
      });
      state.signupTicket = payload.signupTicket;
      setSignupStep('profile');
      setStatus('Email tasdiqlandi. Endi ism va familiyangizni kiriting.', 'success');
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Kod tekshiruvi muvaffaqiyatsiz bo‘ldi.', 'error');
    } finally {
      setBusy(els.signupVerifyBtn, 'Tekshirilmoqda…', 'Kodni tasdiqlash', false);
    }
  }

  async function handleSignupComplete() {
    setBusy(els.signupCompleteBtn, 'Yakunlanmoqda…', 'Profilni yaratish', true);
    try {
      const result = await api('/api/email-signup-complete', {
        method: 'POST',
        body: JSON.stringify({
          signupTicket: state.signupTicket,
          givenName: els.signupGivenName.value.trim(),
          familyName: els.signupFamilyName.value.trim()
        })
      });
      setSession(result.sessionToken, result.user);
      markWelcomeNeeded();
      showToast('Email orqali profilingiz yaratildi.', 'success');
      window.location.href = '/profile.html';
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Ro‘yxatdan o‘tish yakunlanmadi.', 'error');
    } finally {
      setBusy(els.signupCompleteBtn, 'Yakunlanmoqda…', 'Profilni yaratish', false);
    }
  }
})();
