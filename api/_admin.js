const getAuthenticatedUser = require('./_auth');

function parseAllowlist(raw) {
  return String(raw || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdminUser(req) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }

  const email = String(user.email || '').trim().toLowerCase();
  const allowlist = parseAllowlist(process.env.ADMIN_EMAILS);
  const isLocalDevUser = email === 'local';
  const isAllowed = isLocalDevUser || (email && allowlist.includes(email));

  if (!isAllowed) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  return { user, email, allowlist };
}

module.exports = {
  parseAllowlist,
  requireAdminUser,
};
