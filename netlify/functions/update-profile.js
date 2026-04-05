const { badRequest, methodNotAllowed, ok, serverError, unauthorized } = require('./_lib/response');
const { requireUser } = require('./_lib/auth');
const { getUsers, setUsers, getCampaigns, computeStats } = require('./_lib/storage');

exports.handler = async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return methodNotAllowed(['POST']);
    const user = await requireUser(event);
    if (!user) return unauthorized('Profilni yangilash uchun qayta kiring.');

    const body = JSON.parse(event.body || '{}');
    if (typeof body.receiveEmails !== 'boolean') {
      return badRequest('receiveEmails boolean qiymat bo‘lishi kerak.');
    }

    const users = await getUsers();
    const updatedUsers = users.map((item) => (
      item.sub === user.sub
        ? { ...item, receiveEmails: body.receiveEmails }
        : item
    ));

    await setUsers(updatedUsers);
    const updatedUser = updatedUsers.find((item) => item.sub === user.sub);
    const campaigns = await getCampaigns();
    return ok({ user: updatedUser, stats: computeStats(updatedUsers, campaigns) });
  } catch (error) {
    return serverError(error, 'Profil yangilanmadi.');
  }
};
