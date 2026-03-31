const { requireAdminUser } = require('./_admin');

function isoDaysAgo(days) {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function round(value, digits) {
  return Number(Number(value || 0).toFixed(digits));
}

function summarizeUsers(authUsers, userDataRows, tasteProfiles, snapshots) {
  const userDataById = new Map(userDataRows.map((row) => [row.user_id, row]));
  const tasteById = new Map(tasteProfiles.map((row) => [row.user_id, row]));
  const snapshotsByUser = new Map();

  snapshots.forEach((row) => {
    const count = snapshotsByUser.get(row.user_id) || 0;
    snapshotsByUser.set(row.user_id, count + 1);
  });

  const sevenDaysAgo = isoDaysAgo(7);
  const thirtyDaysAgo = isoDaysAgo(30);

  const users = authUsers.map((authUser) => {
    const data = userDataById.get(authUser.id) || null;
    const movies = safeArray(data && data.movies);
    const watchlist = safeArray(data && data.watchlist);
    const maybe = safeArray(data && data.maybe);
    const meh = safeArray(data && data.meh);
    const banned = safeArray(data && data.banned);
    const standards = safeArray(data && data.standards);
    const updatedAt = data && data.updated_at ? Date.parse(data.updated_at) : null;
    const lastSignInAt = authUser.last_sign_in_at ? Date.parse(authUser.last_sign_in_at) : null;
    const snapshotCount = snapshotsByUser.get(authUser.id) || 0;
    const hasTasteProfile = tasteById.has(authUser.id);
    const totalCost = Number(data && data.total_cost ? data.total_cost : 0);

    return {
      id: authUser.id,
      email: authUser.email || '',
      created_at: authUser.created_at || null,
      last_sign_in_at: authUser.last_sign_in_at || null,
      updated_at: data && data.updated_at ? data.updated_at : null,
      snapshot_count: snapshotCount,
      has_taste_profile: hasTasteProfile,
      collection_count: movies.length,
      watchlist_count: watchlist.length,
      maybe_count: maybe.length,
      meh_count: meh.length,
      banned_count: banned.length,
      standards_count: standards.length,
      total_items: movies.length + watchlist.length + maybe.length + meh.length + banned.length,
      total_cost: totalCost,
      has_any_data: !!data,
      has_collection: movies.length > 0,
      active_7d: !!updatedAt && updatedAt >= sevenDaysAgo,
      active_30d: !!updatedAt && updatedAt >= thirtyDaysAgo,
      signed_in_30d: !!lastSignInAt && lastSignInAt >= thirtyDaysAgo,
      freshness_ts: updatedAt || lastSignInAt || Date.parse(authUser.created_at || '') || 0,
    };
  });

  const syncedUsers = users.filter((user) => user.has_any_data);
  const withCollection = users.filter((user) => user.has_collection);
  const snapshotUsers = users.filter((user) => user.snapshot_count > 0);
  const tasteUsers = users.filter((user) => user.has_taste_profile);
  const active7d = users.filter((user) => user.active_7d);
  const active30d = users.filter((user) => user.active_30d);
  const signedIn30d = users.filter((user) => user.signed_in_30d);
  const totalTrackedCost = syncedUsers.reduce((sum, user) => sum + user.total_cost, 0);
  const denom = syncedUsers.length || 1;

  const recentUsers = users
    .slice()
    .sort((a, b) => b.freshness_ts - a.freshness_ts)
    .slice(0, 25)
    .map((user) => ({
      id: user.id,
      email: user.email,
      updated_at: user.updated_at,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      collection_count: user.collection_count,
      watchlist_count: user.watchlist_count,
      maybe_count: user.maybe_count,
      meh_count: user.meh_count,
      banned_count: user.banned_count,
      standards_count: user.standards_count,
      total_items: user.total_items,
      total_cost: round(user.total_cost, 4),
      snapshot_count: user.snapshot_count,
      has_taste_profile: user.has_taste_profile,
    }));

  return {
    summary: {
      total_users: users.length,
      synced_users: syncedUsers.length,
      users_with_collection: withCollection.length,
      active_7d: active7d.length,
      active_30d: active30d.length,
      signed_in_30d: signedIn30d.length,
      snapshot_users: snapshotUsers.length,
      taste_profile_users: tasteUsers.length,
      total_snapshots: snapshots.length,
      total_tracked_cost: round(totalTrackedCost, 4),
      avg_collection_size: round(syncedUsers.reduce((sum, user) => sum + user.collection_count, 0) / denom, 1),
      avg_watchlist_size: round(syncedUsers.reduce((sum, user) => sum + user.watchlist_count, 0) / denom, 1),
      avg_total_items: round(syncedUsers.reduce((sum, user) => sum + user.total_items, 0) / denom, 1),
      avg_tracked_cost: round(totalTrackedCost / denom, 4),
    },
    recent_users: recentUsers,
  };
}

async function listAllUsers(supabaseAdmin) {
  const allUsers = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = (data && data.users) || [];
    allUsers.push.apply(allUsers, users);
    if (users.length < perPage) break;
    page += 1;
  }

  return allUsers;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  try {
    const { user, email } = await requireAdminUser(req);

    let supabaseAdmin;
    try {
      supabaseAdmin = require('./_supabase');
    } catch (err) {
      if (email === 'local') {
        return res.json({
          mode: 'local',
          generated_at: new Date().toISOString(),
          admin_email: email,
          summary: {
            total_users: 0,
            synced_users: 0,
            users_with_collection: 0,
            active_7d: 0,
            active_30d: 0,
            signed_in_30d: 0,
            snapshot_users: 0,
            taste_profile_users: 0,
            total_snapshots: 0,
            total_tracked_cost: 0,
            avg_collection_size: 0,
            avg_watchlist_size: 0,
            avg_total_items: 0,
            avg_tracked_cost: 0,
          },
          recent_users: [],
          notes: [
            'Supabase admin env vars are missing, so local mode cannot inspect the real userbase.',
            'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to view production-like metrics locally.',
          ],
        });
      }
      throw err;
    }

    const [authUsers, userDataResult, tasteProfilesResult, snapshotsResult] = await Promise.all([
      listAllUsers(supabaseAdmin),
      supabaseAdmin.from('user_data').select('user_id, movies, watchlist, maybe, meh, banned, standards, total_cost, updated_at'),
      supabaseAdmin.from('taste_profiles').select('user_id, updated_at'),
      supabaseAdmin.from('snapshots').select('user_id'),
    ]);

    if (userDataResult.error) throw userDataResult.error;
    if (tasteProfilesResult.error) throw tasteProfilesResult.error;
    if (snapshotsResult.error) throw snapshotsResult.error;

    const payload = summarizeUsers(
      authUsers,
      userDataResult.data || [],
      tasteProfilesResult.data || [],
      snapshotsResult.data || []
    );

    res.json({
      mode: 'supabase',
      generated_at: new Date().toISOString(),
      admin_email: user.email || email,
      notes: [
        'Metrics reflect persisted account state, not fine-grained behavioral analytics.',
        'Activity is derived from user_data.updated_at and auth last_sign_in_at.',
      ],
      summary: payload.summary,
      recent_users: payload.recent_users,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    if (statusCode >= 500) console.error('[admin-userbase]', err);
    res.status(statusCode).json({ error: err.message || 'Server error' });
  }
};
