const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');
const { normalizeEmail } = require('./password');

function store() {
  return getStore('eduflow-hub-store');
}

async function getUsers() {
  return (await store().get('users:list', { type: 'json' })) || [];
}

async function setUsers(users) {
  await store().setJSON('users:list', users);
  return users;
}

function uniqueAuthMethods(list = []) {
  return [...new Set((Array.isArray(list) ? list : []).filter(Boolean))];
}

async function upsertUser(nextUser) {
  const users = await getUsers();
  const normalizedEmail = normalizeEmail(nextUser.email || '');
  const index = users.findIndex(
    (item) => item.sub === nextUser.sub || normalizeEmail(item.email || '') === normalizedEmail
  );

  const safeIncoming = {
    ...nextUser,
    email: normalizedEmail,
    authMethods: uniqueAuthMethods(nextUser.authMethods || [])
  };

  if (index >= 0) {
    const mergedAuth = uniqueAuthMethods([
      ...(users[index].authMethods || []),
      ...(safeIncoming.authMethods || [])
    ]);
    users[index] = { ...users[index], ...safeIncoming, authMethods: mergedAuth };
  } else {
    users.push({ ...safeIncoming, authMethods: safeIncoming.authMethods || [] });
  }

  await setUsers(users);

  return (
    users.find(
      (item) =>
        item.sub === nextUser.sub ||
        normalizeEmail(item.email || '') === normalizedEmail
    ) || null
  );
}

async function findUserBySubOrEmail({ sub, email }) {
  const users = await getUsers();
  const normalizedEmail = normalizeEmail(email || '');

  return (
    users.find(
      (item) =>
        item.sub === sub ||
        (normalizedEmail &&
          normalizeEmail(item.email || '') === normalizedEmail)
    ) || null
  );
}

async function findUserByEmail(email) {
  return findUserBySubOrEmail({ email });
}

function verificationKey(email, purpose = 'signup') {
  const hash = crypto
    .createHash('sha256')
    .update(normalizeEmail(email))
    .digest('hex');
  return `verification:${purpose}:${hash}`;
}

async function getPendingVerification(email, purpose = 'signup') {
  return (await store().get(verificationKey(email, purpose), { type: 'json' })) || null;
}

async function setPendingVerification(email, data, purpose = 'signup') {
  await store().setJSON(verificationKey(email, purpose), {
    ...data,
    email: normalizeEmail(email)
  });
}

async function clearPendingVerification(email, purpose = 'signup') {
  await store().delete(verificationKey(email, purpose));
}

async function getCampaigns() {
  return (await store().get('campaigns:list', { type: 'json' })) || [];
}

async function addCampaign(campaign) {
  const campaigns = await getCampaigns();
  campaigns.unshift(campaign);
  await store().setJSON('campaigns:list', campaigns.slice(0, 50));
  return campaigns;
}

function computeStats(users, campaigns = []) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const newToday = users.filter(
    (user) => String(user.joinedAt || '').slice(0, 10) === todayIso
  ).length;
  const subscribedUsers = users.filter(
    (user) => user.receiveEmails !== false && user.email
  ).length;
  const googleUsers = users.filter((user) =>
    (user.authMethods || []).includes('google')
  ).length;
  const emailUsers = users.filter((user) =>
    (user.authMethods || []).includes('email')
  ).length;
  const linkedUsers = users.filter(
    (user) => (user.authMethods || []).length > 1
  ).length;
  const verifiedEmails = users.filter((user) => user.emailVerified).length;

  return {
    totalUsers: users.length,
    subscribedUsers,
    newToday,
    totalCampaigns: campaigns.length,
    googleUsers,
    emailUsers,
    linkedUsers,
    verifiedEmails
  };
}

module.exports = {
  addCampaign,
  clearPendingVerification,
  computeStats,
  findUserByEmail,
  findUserBySubOrEmail,
  getCampaigns,
  getPendingVerification,
  getUsers,
  setPendingVerification,
  setUsers,
  upsertUser
};
