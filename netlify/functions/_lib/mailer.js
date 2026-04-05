const nodemailer = require('nodemailer');

function getMailer() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || 'true') !== 'false';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error('SMTP sozlamalari topilmadi. Netlify Environment variables ichiga SMTP_USER va SMTP_PASS kiriting.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
}

function getMailIdentity() {
  const siteName = process.env.SITE_NAME || 'EduFlow Hub';
  return {
    fromName: process.env.EMAIL_FROM_NAME || siteName,
    replyTo: process.env.REPLY_TO_EMAIL || process.env.SMTP_USER || '',
    fromEmail: process.env.SMTP_USER || ''
  };
}

module.exports = {
  getMailer,
  getMailIdentity
};
