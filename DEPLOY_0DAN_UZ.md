# 0 dan Netlify deploy yo'riqnomasi

## Tavsiya etiladigan Netlify project name
- `eduflow-hub-studio`

Netlify project name keyin ham o'zgartiriladi. Avval shu nom bilan deploy qilib, keyin xohlasangiz almashtirasiz.

## ZIP ichidagi eng muhim holat
- Google Client ID allaqachon kiritilgan.
- `SITE_BASE_URL` bo'sh qoldirilsa ham ishlaydi: funksiya joriy Netlify domenini avtomatik topadi.
- Siz qo'lda kiritadigan asosiy maxfiy ma'lumotlar: `SESSION_SECRET`, `SMTP_USER`, `SMTP_PASS`, `ADMIN_ALLOWED_EMAILS`.

## 1-qadam
ZIP ni oching va ichidagi barcha fayllarni yangi GitHub repository root'iga yuklang.

## 2-qadam
Netlify -> Add new project -> Import from Git -> GitHub.

Build settings:
- Base directory: bo'sh
- Build command: `echo 'No build command required'`
- Publish directory: `.`
- Functions directory: `netlify/functions`

## 3-qadam
Netlify Environment variables ga shularni qo'ying:
- `SESSION_SECRET`
- `ADMIN_ACCESS_CODE`
- `ADMIN_ALLOWED_EMAILS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM_NAME`
- `REPLY_TO_EMAIL`

Ixtiyoriy:
- `SITE_NAME`
- `SITE_TAGLINE`
- `SITE_BASE_URL`
- `GOOGLE_CLIENT_ID`

## 4-qadam
Deploy tugagach sizga yangi `https://....netlify.app` link chiqadi.

## 5-qadam (Google ishlashi uchun majburiy)
Google Cloud -> OAuth client -> Authorized JavaScript origins ga YANGI Netlify linkni qo'shing.
Misol:
- `https://your-new-site.netlify.app`

Agar custom domain ulasangiz, keyin uni ham qo'shasiz.

## 6-qadam (Email ishlashi uchun majburiy)
Gmail account:
- 2-Step Verification yoqing
- App Password yarating
- `SMTP_USER` = Gmail
- `SMTP_PASS` = 16 xonali App Password

## 7-qadam
Yana bir marta redeploy qiling.

## Nimalar darhol ishlaydi
- Asosiy sayt dizayni
- Google sign-in modal ko'rinishi
- Email sign-up form
- Profil va admin UI

## Nimalar env kiritilgandan keyin ishlaydi
- Google login
- Email verification kodi yuborish
- Profil saqlash
- Admin statistikasi
- Broadcast email yuborish
