const { connectLambda } = require('@netlify/blobs');
const { methodNotAllowed, ok, serverError, unauthorized } = require('./_lib/response');
const { requireUser } = require('./_lib/auth');
const { getUsers, getCampaigns, computeStats } = require('./_lib/storage');

exports.handler = async function handler(event) {
  try {
    connectLambda(event);

    if (event.httpMethod !== 'GET') return methodNotAllowed(['GET']);

    const user = await requireUser(event);
    if (!user) return unauthorized('Sessiya topilmadi yoki muddati tugagan.');

    const users = await getUsers();
    const campaigns = await getCampaigns();

    return ok({
      user,
      stats: computeStats(users, campaigns)
    });
  } catch (error) {
    return serverError(error, 'Profil ma’lumoti olinmadi.');
  }
};
