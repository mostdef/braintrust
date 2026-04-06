# The Collection

A personal film curation tool for reflective movie watching. Not a streaming app or social network — a private archive for deepening understanding of your own taste through deliberate selection, real-time companionship while watching, and AI-assisted reflection.

---

## What it does

- **Curate** your collection across five categories: Collection, To Watch, Wildcard, Meh, Don't Recommend — each reachable by direct link with sort preserved in the URL
- **Anticipated** — track unreleased films with a countdown to their theatrical premiere; notifies you when something you were waiting for has arrived; Coming Soon strip always shows five upcoming films, auto-refilling as you act on suggestions
- **Reference films** — pin up to 12 standards that anchor your taste and inform recommendations
- **AI features** — recommendations, companion chat, and persona — controlled by a master AI toggle in the nav; off by default; sessions buffered while off and analysed on re-enable
- **Now Watching widget** — track a live session with a real-time timer, pause/resume, and a film companion (timed facts + chat)
- **Companion** — spoiler-aware film notes and freeform chat during a watch session
- **Watching Diary** — a private timeline of every viewing: what you watched, when you stopped, and how it ended; covers both films and TV with season/episode tracking; synced to the cloud
- **Session Journal** — companion-enriched session signals with a re-enrich option for sessions recorded while AI was off
- **Persona** — AI-generated taste portrait that evolves with your collection
- **Where to watch** — per-film tab showing streaming availability by country, with direct deep links to each platform
- **Snapshots** — point-in-time backups of your full collection state, including watch log

---

## Stack

- Vanilla JS / HTML / CSS — no framework, no build step
- Vercel serverless functions for API routes
- Supabase for auth and cloud sync
- Claude (Anthropic) for recommendations, companion, and persona
- TMDB + OMDB for movie metadata and ratings

---

## Dev

```sh
vercel dev
```

Runs the app at `localhost:3000` with API functions and browser-sync live reload.

---

## Structure

```
movies.html          # Main app
movies-app.js        # All client-side logic
styles.css           # All styles
settings.html        # Settings page
components/          # Extracted UI components (Card, Modal, NWW)
sandbox/             # Component development sandbox (dev only)
api/                 # Vercel serverless functions
snapshots/           # Server-side snapshot storage
taste-profile.json   # Curator-generated taste profile
```

See `CLAUDE.md` for full architecture reference, localStorage keys, and development conventions.

---

## Release notes

See `RELEASE.md`.
