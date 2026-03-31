(async function () {
  'use strict';

  const summaryGrid = document.getElementById('summary-grid');
  const notesEl = document.getElementById('dashboard-notes');
  const recentUsersBody = document.getElementById('recent-users-body');
  const noticeEl = document.getElementById('dashboard-notice');
  const adminEmailEl = document.getElementById('admin-email');
  const generatedAtEl = document.getElementById('generated-at');

  function formatInt(value) {
    return new Intl.NumberFormat().format(Number(value || 0));
  }

  function formatCurrency(value, digits) {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function setNotice(text, variant) {
    noticeEl.hidden = false;
    noticeEl.className = 'dashboard-notice dashboard-notice-' + variant;
    noticeEl.textContent = text;
  }

  function renderSummaryCards(summary) {
    const cards = [
      ['Total users', formatInt(summary.total_users), 'Accounts known to auth'],
      ['Synced users', formatInt(summary.synced_users), 'Users with persisted collection data'],
      ['Active 30d', formatInt(summary.active_30d), 'Based on collection updates'],
      ['Signed in 30d', formatInt(summary.signed_in_30d), 'Based on auth metadata'],
      ['Taste profiles', formatInt(summary.taste_profile_users), 'Users with generated taste context'],
      ['Snapshot users', formatInt(summary.snapshot_users), 'Users who saved at least one snapshot'],
      ['Avg collection', formatInt(summary.avg_collection_size), 'Average saved collection size'],
      ['Avg watchlist', formatInt(summary.avg_watchlist_size), 'Average queued films per synced user'],
      ['Avg total items', formatInt(summary.avg_total_items), 'Across collection + other lists'],
      ['Tracked cost', formatCurrency(summary.total_tracked_cost, 2), 'Total recorded Anthropic spend'],
      ['Avg cost', formatCurrency(summary.avg_tracked_cost, 2), 'Per synced user'],
      ['Total snapshots', formatInt(summary.total_snapshots), 'Persisted across the userbase'],
    ];

    summaryGrid.innerHTML = cards.map(([label, value, sub]) => `
      <article class="dashboard-stat-card">
        <div class="dashboard-stat-label">${label}</div>
        <div class="dashboard-stat-value">${value}</div>
        <div class="dashboard-stat-sub">${sub}</div>
      </article>
    `).join('');
  }

  function renderNotes(notes, summary, mode) {
    const derived = [];
    if (summary.total_users > 0) {
      derived.push(`${formatInt(summary.users_with_collection)} of ${formatInt(summary.total_users)} users have at least one film in their collection.`);
      derived.push(`${formatInt(summary.active_7d)} users updated their collection in the last 7 days, and ${formatInt(summary.active_30d)} in the last 30 days.`);
      derived.push(`${formatInt(summary.taste_profile_users)} users have a taste profile and ${formatInt(summary.snapshot_users)} have used snapshots.`);
    }
    if (mode === 'local') {
      derived.unshift('Local mode is active. Real userbase metrics require Supabase admin credentials in the environment.');
    }

    const items = derived.concat(notes || []);
    notesEl.innerHTML = items.length
      ? items.map((note) => `<div class="dashboard-note-item">${note}</div>`).join('')
      : '<div class="dashboard-empty">No dashboard notes available.</div>';
  }

  function renderRecentUsers(users) {
    if (!users.length) {
      recentUsersBody.innerHTML = '<tr><td colspan="8" class="dashboard-empty-cell">No users to display.</td></tr>';
      return;
    }

    recentUsersBody.innerHTML = users.map((user) => `
      <tr>
        <td>
          <div class="dashboard-user-cell">
            <div class="dashboard-user-email">${user.email || 'Unknown email'}</div>
            <div class="dashboard-user-meta">${formatDate(user.created_at)}</div>
          </div>
        </td>
        <td>${formatDate(user.updated_at || user.last_sign_in_at)}</td>
        <td>${formatInt(user.collection_count)}</td>
        <td>${formatInt(user.watchlist_count)}</td>
        <td>${formatInt(user.total_items)}</td>
        <td>${formatInt(user.snapshot_count)}</td>
        <td>${user.has_taste_profile ? 'Yes' : 'No'}</td>
        <td>${formatCurrency(user.total_cost, 2)}</td>
      </tr>
    `).join('');
  }

  async function load() {
    const authed = await requireAuth();
    if (!authed) return;

    const session = await getSession();
    const user = session && session.user ? session.user : null;
    adminEmailEl.textContent = user && user.email ? user.email : 'Unknown';

    const token = await getAuthToken();
    const res = await fetch('/api/admin-userbase', {
      headers: { Authorization: 'Bearer ' + token },
    });

    if (res.status === 403) {
      setNotice('This dashboard is restricted to allowlisted admin emails.', 'error');
      summaryGrid.innerHTML = '';
      notesEl.innerHTML = '<div class="dashboard-empty">Access denied.</div>';
      recentUsersBody.innerHTML = '<tr><td colspan="8" class="dashboard-empty-cell">Access denied.</td></tr>';
      return;
    }

    if (!res.ok) throw new Error('Failed to load dashboard data.');

    const data = await res.json();
    generatedAtEl.textContent = formatDate(data.generated_at);
    renderSummaryCards(data.summary || {});
    renderNotes(data.notes || [], data.summary || {}, data.mode);
    renderRecentUsers(data.recent_users || []);

    if (data.mode === 'local') {
      setNotice('Local mode is active. Set Supabase admin env vars to inspect the real userbase.', 'info');
    }
  }

  try {
    await load();
  } catch (err) {
    console.error('[dashboard]', err);
    setNotice(err.message || 'Unable to load dashboard.', 'error');
    notesEl.innerHTML = '<div class="dashboard-empty">Dashboard data could not be loaded.</div>';
    recentUsersBody.innerHTML = '<tr><td colspan="8" class="dashboard-empty-cell">Dashboard data could not be loaded.</td></tr>';
  }
})();
