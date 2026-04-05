const { methodNotAllowed, ok, serverError, unauthorized } = require('./_lib/response');
const { requireAdmin } = require('./_lib/auth');
const { getUsers, getCampaigns, computeStats } = require('./_lib/storage');

exports.handler = async function handler(event) {
  try {
    if (event.httpMethod !== 'GET') return methodNotAllowed(['GET']);
    const admin = requireAdmin(event);
    if (!admin) return unauthorized('Admin sessiya topilmadi.');

    const users = await getUsers();
    const campaigns = await getCampaigns();

    const sortedUsers = [...users].sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
    const sortedCampaigns = [...campaigns].sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    return ok({
      admin,
      stats: computeStats(users, campaigns),
      users: sortedUsers,
      campaigns: sortedCampaigns
    });
  } catch (error) {
    return serverError(error, 'Admin overview olinmadi.');
  }
};
