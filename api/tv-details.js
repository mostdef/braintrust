require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const TMDB_BASE = 'https://api.themoviedb.org/3';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  let getAuthenticatedUser;
  try { getAuthenticatedUser = require('./_auth'); } catch {}
  if (getAuthenticatedUser) {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
  }

  const tmdbId = parseInt(req.query.tmdb_id, 10);
  const seasonNumber = parseInt(req.query.season_number, 10);
  if (!tmdbId) return res.status(400).json({ error: 'tmdb_id is required' });

  const headers = { Authorization: `Bearer ${process.env.TMDB_TOKEN}` };

  try {
    if (seasonNumber) {
      const seasonRes = await fetch(
        `${TMDB_BASE}/tv/${tmdbId}/season/${seasonNumber}?language=en-US`,
        { headers }
      );
      if (!seasonRes.ok) return res.status(seasonRes.status).json({ error: 'season_lookup_failed' });
      const season = await seasonRes.json();
      return res.json({
        season_number: season.season_number,
        episodes: (season.episodes || []).map((episode) => ({
          episode_number: episode.episode_number,
          name: episode.name,
          air_date: episode.air_date || null,
        })),
      });
    }

    const seriesRes = await fetch(`${TMDB_BASE}/tv/${tmdbId}?language=en-US`, { headers });
    if (!seriesRes.ok) return res.status(seriesRes.status).json({ error: 'series_lookup_failed' });
    const series = await seriesRes.json();
    return res.json({
      id: series.id,
      name: series.name,
      seasons: (series.seasons || []).map((season) => ({
        season_number: season.season_number,
        name: season.name,
        episode_count: season.episode_count,
      })),
    });
  } catch (error) {
    console.error('tv-details error:', error);
    return res.status(500).json({ error: 'api_error' });
  }
};
