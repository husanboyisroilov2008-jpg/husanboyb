const crypto = require('crypto');

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

function isValidEmail(email = '') {
  const value = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function validatePassword(password = '') {
  const value = String(password || '');
  if (value.length < 8) {
    return 'Parol kamida 8 ta belgidan iborat bo‘lishi kerak.';
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Parolda kamida 1 ta harf va 1 ta raqam bo‘lishi kerak.';
  }
  return '';
}

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

async function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(String(password), salt);
  return {
    passwordSalt: salt,
    passwordHash: derivedKey.toString('hex')
  };
}

async function verifyPassword(password, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  const derivedKey = await scryptAsync(String(password), salt);
  const expected = Buffer.from(String(expectedHash), 'hex');
  if (expected.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(expected, derivedKey);
}

module.exports = {
  createPasswordHash,
  isValidEmail,
  normalizeEmail,
  validatePassword,
  verifyPassword
};
