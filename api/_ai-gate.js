// Shared AI gate — checks ai_enabled flag and spend cap for a resolved user.
// Returns { error: 'ai_disabled' | 'budget_exhausted' } if blocked, null if allowed.
// Pass user = null (local dev, no auth) to skip all checks.

let supabaseAdmin;
try { supabaseAdmin = require('./_supabase'); } catch {}

module.exports = async function checkAiGate(user) {
  if (!user || user.id === 'local' || !supabaseAdmin) return null;

  let data;
  try {
    const result = await supabaseAdmin
      .from('user_data')
      .select('ai_enabled, spend_month, spend_cap')
      .eq('user_id', user.id)
      .maybeSingle();
    data = result.data;
  } catch { return null; } // DB error → fail open, don't block the user

  if (!data) return null; // no row yet → new user, allow

  if (data.ai_enabled === false) return { error: 'ai_disabled' };

  const cap   = typeof data.spend_cap   === 'number' ? data.spend_cap   : 3.00;
  const spent = typeof data.spend_month === 'number' ? data.spend_month : 0;
  if (spent >= cap) return { error: 'budget_exhausted' };

  return null;
};
