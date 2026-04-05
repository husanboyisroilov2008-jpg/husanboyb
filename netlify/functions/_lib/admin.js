function getAdminCode() {
  return process.env.ADMIN_ACCESS_CODE || 'Husanboy0';
}

function getAllowedAdminEmails() {
  return String(process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmailAllowed(email) {
  const allowed = getAllowedAdminEmails();
  if (!allowed.length) return true;
  return allowed.includes(String(email || '').toLowerCase());
}

module.exports = {
  getAdminCode,
  getAllowedAdminEmails,
  isAdminEmailAllowed
};
