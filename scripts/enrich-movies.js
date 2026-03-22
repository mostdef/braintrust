#!/usr/bin/env node
// Enriches movies-data.js (collection) and the latest snapshot (all lists)
// with imdb_id, imdb_rating, rt_score from TMDB + OMDB.
// Run: node scripts/enrich-movies.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const fs   = require('fs');
const path = require('path');

const TMDB_BASE    = 'https://api.themoviedb.org/3';
const TMDB_HEADERS = { Authorization: `Bearer ${process.env.TMDB_TOKEN}` };
const SNAPSHOT_DIR = path.join(__dirname, '..', 'snapshots');

async function fetchRatings(title, year) {
  const url = `${TMDB_BASE}/search/movie?query=${encodeURIComponent(title)}&year=${year || ''}&language=en-US`;
  const searchRes = await fetch(url, { headers: TMDB_HEADERS });
  const search = await searchRes.json();
  const tmdbMovie = search.results?.[0];
  if (!tmdbMovie) return { imdb_id: null, imdb_rating: null, rt_score: null };

  const detRes = await fetch(`${TMDB_BASE}/movie/${tmdbMovie.id}?language=en-US`, { headers: TMDB_HEADERS });
  const det = await detRes.json();
  const imdbId = det.imdb_id || null;
  if (!imdbId) return { imdb_id: null, imdb_rating: null, rt_score: null };

  const omdbRes = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${process.env.OMDB_KEY}`);
  const omdb = await omdbRes.json();
  if (omdb.Response !== 'True') return { imdb_id: imdbId, imdb_rating: null, rt_score: null };

  const rt = omdb.Ratings?.find(r => r.Source === 'Rotten Tomatoes');
  return {
    imdb_id:     imdbId,
    imdb_rating: omdb.imdbRating !== 'N/A' ? omdb.imdbRating : null,
    rt_score:    rt ? rt.Value : null,
  };
}

async function enrichList(list, label) {
  const results = [];
  for (const movie of list) {
    // Skip if already fully enriched
    if (movie.imdb_id && movie.imdb_rating && movie.rt_score) {
      process.stdout.write(`  [skip] ${movie.title}\n`);
      results.push(movie);
      continue;
    }
    process.stdout.write(`  ${movie.title} (${movie.year})… `);
    try {
      const ratings = await fetchRatings(movie.title, movie.year);
      results.push({ ...movie, ...ratings });
      console.log(`IMDb ${ratings.imdb_rating || '—'}  RT ${ratings.rt_score || '—'}`);
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
      results.push(movie);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  return results;
}

async function main() {
  // ── 1. Enrich movies-data.js ─────────────────────────────────────────────
  console.log('\n── movies-data.js (collection) ──');
  const dataPath = path.join(__dirname, '..', 'movies-data.js');
  const raw = fs.readFileSync(dataPath, 'utf8');
  const match = raw.match(/const movies\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) { console.error('Could not parse movies-data.js'); process.exit(1); }

  const movies = eval(match[1]);
  const enrichedMovies = await enrichList(movies, 'collection');

  const lines = enrichedMovies.map(m => {
    const fields = [
      `title: ${JSON.stringify(m.title)}`,
      `year: ${m.year}`,
      `director: ${JSON.stringify(m.director)}`,
      `poster: ${JSON.stringify(m.poster)}`,
    ];
    if (m.imdb_id)     fields.push(`imdb_id: ${JSON.stringify(m.imdb_id)}`);
    if (m.imdb_rating) fields.push(`imdb_rating: ${JSON.stringify(m.imdb_rating)}`);
    if (m.rt_score)    fields.push(`rt_score: ${JSON.stringify(m.rt_score)}`);
    for (const [k, v] of Object.entries(m)) {
      if (!['title','year','director','poster','imdb_id','imdb_rating','rt_score'].includes(k)) {
        fields.push(`${k}: ${JSON.stringify(v)}`);
      }
    }
    return `  { ${fields.join(', ')} }`;
  });
  fs.writeFileSync(dataPath, `const movies = [\n${lines.join(',\n')},\n];\n`, 'utf8');
  console.log(`Wrote ${enrichedMovies.length} movies to movies-data.js`);

  // ── 2. Enrich latest snapshot ────────────────────────────────────────────
  const snapFiles = fs.readdirSync(SNAPSHOT_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();
  if (!snapFiles.length) { console.log('No snapshots found, done.'); return; }

  const snapPath = path.join(SNAPSHOT_DIR, snapFiles[0]);
  const snap = JSON.parse(fs.readFileSync(snapPath, 'utf8'));

  for (const listKey of ['movies', 'watchlist', 'maybe', 'meh', 'banned']) {
    if (!Array.isArray(snap[listKey]) || snap[listKey].length === 0) continue;
    console.log(`\n── snapshot: ${listKey} (${snap[listKey].length}) ──`);
    snap[listKey] = await enrichList(snap[listKey], listKey);
  }

  fs.writeFileSync(snapPath, JSON.stringify(snap, null, 2), 'utf8');
  console.log(`\nWrote enriched snapshot to ${snapFiles[0]}`);
  console.log('\nDone. Restore the snapshot from Settings to apply to all lists.');
}

main().catch(e => { console.error(e); process.exit(1); });
