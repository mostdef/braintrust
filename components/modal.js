// components/modal.js
// Pure rendering functions for the movie detail modal.
// No state, no fetch calls — receives data and callbacks, emits DOM.

const ModalComponent = (() => {

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function mmNormalizeTitle(t) {
    return (t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // options.getActiveSessions() → now-watching data object | null
  function mmGetActiveSession(title, options) {
    if (typeof options.getActiveSessions === 'function') {
      const data = options.getActiveSessions();
      if (!data) return null;
      if (mmNormalizeTitle(data.title) !== mmNormalizeTitle(title)) return null;
      return data;
    }
    return null;
  }

  // options.getPastSessions() → array of session signal objects
  function mmGetSessions(title, options) {
    if (typeof options.getPastSessions === 'function') {
      const signals = options.getPastSessions();
      return (signals || []).filter(s => mmNormalizeTitle(s.title) === mmNormalizeTitle(title));
    }
    return [];
  }

  // ── Tab: Details ────────────────────────────────────────────────────────────

  function renderDetailsContent(container, movie, data) {
    if (data.genres?.length) {
      const genres = document.createElement('div');
      genres.className = 'mm-genres';
      data.genres.forEach(g => {
        const tag = document.createElement('span');
        tag.className = 'mm-genre-tag';
        tag.textContent = g;
        genres.appendChild(tag);
      });
      container.appendChild(genres);
    }

    if (data.tagline) {
      const tagline = document.createElement('div');
      tagline.className = 'mm-tagline';
      tagline.textContent = `"${data.tagline}"`;
      container.appendChild(tagline);
    }

    if (data.overview) {
      const overview = document.createElement('p');
      overview.className = 'mm-overview';
      overview.textContent = data.overview;
      container.appendChild(overview);
    }

    if (data.cast?.length) {
      const castLabel = document.createElement('div');
      castLabel.className = 'mm-section-label';
      castLabel.textContent = 'Cast';
      container.appendChild(castLabel);

      const castRow = document.createElement('div');
      castRow.className = 'mm-cast';
      data.cast.forEach(person => {
        const item = document.createElement('a');
        item.className = 'mm-cast-item';
        item.href = person.wiki;
        item.target = '_blank';
        item.rel = 'noopener noreferrer';
        const photo = document.createElement('div');
        photo.className = 'mm-cast-photo';
        if (person.photo) {
          const img = document.createElement('img');
          img.src = person.photo;
          img.alt = person.name;
          photo.appendChild(img);
        } else {
          photo.classList.add('mm-cast-photo-blank');
          photo.textContent = person.name[0];
        }
        const name = document.createElement('div');
        name.className = 'mm-cast-name';
        name.textContent = person.name;
        const character = document.createElement('div');
        character.className = 'mm-cast-character';
        character.textContent = person.character;
        item.append(photo, name, character);
        castRow.appendChild(item);
      });
      container.appendChild(castRow);
    }

    if (data.keyCrew?.length) {
      const crewLabel = document.createElement('div');
      crewLabel.className = 'mm-section-label';
      crewLabel.textContent = 'Key Crew';
      container.appendChild(crewLabel);

      const crewGrid = document.createElement('div');
      crewGrid.className = 'mm-crew';
      data.keyCrew.forEach(({ role, name, wiki }) => {
        const row = document.createElement('a');
        row.className = 'mm-crew-row';
        row.href = wiki;
        row.target = '_blank';
        row.rel = 'noopener noreferrer';
        row.innerHTML = `<span class="mm-crew-role">${role}</span><span class="mm-crew-name">${name}</span>`;
        crewGrid.appendChild(row);
      });
      container.appendChild(crewGrid);
    }
  }

  // ── Tab: Session ────────────────────────────────────────────────────────────

  function renderSessionContent(container, movie, options) {
    const activeSession = mmGetActiveSession(movie.title, options);
    const sessions = mmGetSessions(movie.title, options);

    // Use active session data if available, else most recent completed signal
    const sessionData = activeSession?.companion
      ? { facts: (activeSession.companion.facts || []).filter(f => f.delivered), chat_history: activeSession.companion.chat_history || [], timestamp: activeSession.startedAt, decision: null }
      : sessions[0] || null;

    const facts = sessionData?.facts || [];
    const chatHistory = sessionData?.chat_history || [];

    if (!sessionData) {
      const empty = document.createElement('div');
      empty.className = 'mm-session-empty';
      empty.textContent = 'No companion session yet — start watching to build a history.';
      container.appendChild(empty);
      return;
    }

    if (facts.length === 0 && chatHistory.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'mm-session-empty';
      empty.textContent = activeSession
        ? 'Companion is active — film notes will appear here as you watch.'
        : 'No notes or conversation recorded for this session.';
      container.appendChild(empty);
      return;
    }

    // Facts
    if (facts.length > 0) {
      const label = document.createElement('div');
      label.className = 'mm-section-label';
      label.textContent = 'Film notes from this session';
      container.appendChild(label);

      facts.forEach(f => {
        const card = document.createElement('div');
        card.className = 'mm-session-fact';
        card.innerHTML = `<div class="mm-session-fact-pct">~${f.pct}% in</div><div class="mm-session-fact-text">${f.text}</div>`;
        container.appendChild(card);
      });
    }

    // Chat history
    if (chatHistory.length > 0) {
      const label = document.createElement('div');
      label.className = 'mm-section-label';
      label.style.marginTop = facts.length > 0 ? '28px' : '0';
      label.textContent = 'Conversation';
      container.appendChild(label);

      const thread = document.createElement('div');
      thread.className = 'mm-session-thread';
      chatHistory.forEach(msg => {
        const bubble = document.createElement('div');
        bubble.className = `mm-session-msg mm-session-msg-${msg.role}`;
        bubble.textContent = msg.content;
        thread.appendChild(bubble);
      });
      container.appendChild(thread);
    }

    // Past sessions count
    if (sessions.length > 1) {
      const pastLabel = document.createElement('div');
      pastLabel.className = 'mm-section-label';
      pastLabel.style.marginTop = '28px';
      pastLabel.textContent = `${sessions.length} sessions total`;
      container.appendChild(pastLabel);
    }
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  /**
   * Render fully-loaded modal content into `container`.
   *
   * @param {HTMLElement} container  - The modal body element (will be cleared)
   * @param {Object}      movie      - { title, year, director, poster }
   * @param {Object}      data       - API response { genres, tagline, overview, imdb_rating,
   *                                   rt_score, runtime, cast, keyCrew, poster, imdb_id, director }
   * @param {Object}      options
   * @param {string}      [options.initialTab='details']        - 'details' | 'session'
   * @param {Function}    [options.onWatchTonight]              - called when Watch Tonight clicked
   * @param {Function}    [options.getActiveSessions]           - () => now-watching data | null
   * @param {Function}    [options.getPastSessions]             - () => array of past signals
   */
  function renderModal(container, movie, data, options = {}) {
    const {
      initialTab = 'details',
      onWatchTonight = null,
      getActiveSessions = () => null,
      getPastSessions = () => [],
    } = options;

    const resolvedOptions = { getActiveSessions, getPastSessions };

    container.innerHTML = '';

    // ── Poster column ──────────────────────────────────────────────────────────
    const posterCol = document.createElement('div');
    posterCol.className = 'mm-poster-col';

    const poster = document.createElement('img');
    poster.className = 'mm-poster';
    poster.src = data.poster || movie.poster;
    poster.alt = movie.title;
    posterCol.appendChild(poster);

    if (data.imdb_rating || data.rt_score) {
      const ratings = document.createElement('div');
      ratings.className = 'mm-ratings';
      if (data.imdb_rating) {
        const imdbLink = document.createElement('a');
        imdbLink.className = 'mm-rating-badge mm-rating-imdb';
        imdbLink.href = data.imdb_id ? `https://www.imdb.com/title/${data.imdb_id}` : '#';
        imdbLink.target = '_blank';
        imdbLink.rel = 'noopener noreferrer';
        imdbLink.innerHTML = `<span class="mm-rating-logo">IMDb</span><span>⭐ ${data.imdb_rating}</span>`;
        ratings.appendChild(imdbLink);
      }
      if (data.rt_score) {
        const pct = parseInt(data.rt_score);
        const fresh = pct >= 60;
        const rt = document.createElement('a');
        rt.className = 'mm-rating-badge mm-rating-rt';
        rt.href = `https://www.rottentomatoes.com/search?search=${encodeURIComponent(movie.title)}`;
        rt.target = '_blank';
        rt.rel = 'noopener noreferrer';
        rt.innerHTML = `<span>${fresh ? '🍅' : '🤢'}</span><span>${data.rt_score}</span>`;
        ratings.appendChild(rt);
      }
      posterCol.appendChild(ratings);
    }

    const watchBtn = document.createElement('button');
    watchBtn.className = 'mm-watch-btn';
    watchBtn.textContent = 'Watch Tonight';
    watchBtn.addEventListener('click', () => {
      if (typeof onWatchTonight === 'function') onWatchTonight(movie);
    });
    posterCol.appendChild(watchBtn);

    // ── Info column ────────────────────────────────────────────────────────────
    const info = document.createElement('div');
    info.className = 'mm-info';

    const titleEl = document.createElement('div');
    titleEl.className = 'mm-title';
    titleEl.textContent = movie.title;

    const meta = document.createElement('div');
    meta.className = 'mm-meta';
    const resolvedDirector = movie.director || data.director || '';
    const parts = [resolvedDirector, movie.year];
    if (data.runtime) parts.push(`${data.runtime} min`);
    meta.textContent = parts.filter(Boolean).join(' · ');

    const sessions = mmGetSessions(movie.title, resolvedOptions);
    const activeSession = mmGetActiveSession(movie.title, resolvedOptions);

    const titleRow = document.createElement('div');
    titleRow.className = 'mm-title-row';
    titleRow.appendChild(titleEl);
    if (activeSession) {
      const liveBadge = document.createElement('span');
      liveBadge.className = 'mm-live-badge';
      liveBadge.textContent = '● Session in progress';
      titleRow.appendChild(liveBadge);
    }
    info.append(titleRow, meta);

    // ── Tab bar ────────────────────────────────────────────────────────────────
    const hasSession = sessions.length > 0 || !!activeSession;

    const tabBar = document.createElement('div');
    tabBar.className = 'mm-tabs';

    const detailsTab = document.createElement('button');
    detailsTab.className = 'mm-tab mm-tab-active';
    detailsTab.textContent = 'Details';

    const sessionTab = document.createElement('button');
    sessionTab.className = 'mm-tab';
    sessionTab.innerHTML = hasSession ? 'Session <span class="mm-tab-dot"></span>' : 'Session';

    tabBar.append(detailsTab, sessionTab);
    info.appendChild(tabBar);

    // ── Tab content ────────────────────────────────────────────────────────────
    const tabContent = document.createElement('div');
    tabContent.className = 'mm-tab-content';
    info.appendChild(tabContent);

    function showTab(which) {
      detailsTab.classList.toggle('mm-tab-active', which === 'details');
      sessionTab.classList.toggle('mm-tab-active', which === 'session');
      tabContent.innerHTML = '';
      if (which === 'details') renderDetailsContent(tabContent, movie, data);
      else renderSessionContent(tabContent, movie, resolvedOptions);
    }

    detailsTab.addEventListener('click', () => showTab('details'));
    sessionTab.addEventListener('click', () => showTab('session'));

    showTab(initialTab);

    container.append(posterCol, info);
  }

  return { renderModal, renderDetailsContent, renderSessionContent, mmNormalizeTitle, mmGetSessions, mmGetActiveSession };
})();
