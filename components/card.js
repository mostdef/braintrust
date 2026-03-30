// components/card.js
// Card rendering component — pure DOM factory, no global state dependencies.
// Depends on: getCachedTextures() being available globally (from movies-app.js)
// Usage: CardComponent.renderCard(movie, options)

const CardComponent = (() => {

  // ── Tilt + sheen effect ────────────────────────────────────────────────────
  function addTilt(card) {
    const sheen = document.createElement('div');
    sheen.className = 'card-sheen';
    card.appendChild(sheen);

    let tiltFrame = null;
    card.addEventListener('mousemove', (e) => {
      if (tiltFrame) return;
      const cx = e.clientX, cy = e.clientY;
      tiltFrame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = (cx - rect.left) / rect.width - 0.5;
        const y = (cy - rect.top) / rect.height - 0.5;

        card.style.transition = 'transform 0.05s linear, box-shadow 0.05s linear';
        card.style.transform = `perspective(800px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) scale(1.02)`;
        card.style.boxShadow = `${-x * 10}px ${y * 10}px 24px rgba(0,0,0,0.2)`;

        sheen.style.opacity = '1';
        sheen.style.background = `radial-gradient(circle at ${(0.5 - x) * 100}% ${(0.5 - y) * 100}%, rgba(255,255,255,0.12) 0%, transparent 65%)`;
        tiltFrame = null;
      });
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
      card.style.transform = '';
      card.style.boxShadow = '';
      sheen.style.opacity = '0';
    });
  }

  // ── Fold textures ──────────────────────────────────────────────────────────
  function addTexturesToPoster(posterWrap, key) {
    const textures = getCachedTextures(key);
    const hlDiv = document.createElement('div');
    hlDiv.className = 'poster-texture poster-texture-hl';
    hlDiv.style.backgroundImage = `url(${textures.hl})`;
    const shDiv = document.createElement('div');
    shDiv.className = 'poster-texture poster-texture-sh';
    shDiv.style.backgroundImage = `url(${textures.sh})`;
    posterWrap.appendChild(hlDiv);
    posterWrap.appendChild(shDiv);
  }

  // ── IMDb / RT rating badges ────────────────────────────────────────────────
  function appendCardRatings(info, movie) {
    // Always wrap title+meta in a left column so card-info (flex row) is consistent
    const left = document.createElement('div');
    left.className = 'card-info-left';
    while (info.firstChild) left.appendChild(info.firstChild);
    info.appendChild(left);

    const ratingsEnabled = localStorage.getItem('thecollection_card_ratings') === 'true';
    if (!ratingsEnabled) return;
    if (!movie.imdb_rating && !movie.rt_score) return;

    const ratings = document.createElement('div');
    ratings.className = 'card-ratings';
    if (movie.imdb_rating) {
      const imdb = document.createElement('span');
      imdb.className = 'card-rating card-rating-imdb';
      imdb.textContent = `IMDb ${movie.imdb_rating}`;
      ratings.appendChild(imdb);
    }
    if (movie.rt_score) {
      const rt = document.createElement('span');
      rt.className = 'card-rating card-rating-rt';
      rt.textContent = `\uD83C\uDF45 ${movie.rt_score}`;
      ratings.appendChild(rt);
    }
    info.appendChild(ratings);
  }

  // ── Main card factory ──────────────────────────────────────────────────────
  //
  // renderCard(movie, options) → HTMLElement
  //
  // movie: { title, year, director, poster, imdb_rating?, rt_score? }
  //
  // options: {
  //   view: 'collection'|'watchlist'|'maybe'|'meh'|'banned',
  //   isLive: boolean,       // adds movie-card--live (golden border)
  //   onRemove: fn|null,     // if provided, shows ✕ remove button; called with (e) on click
  //   onStarClick: fn|null,  // if provided, shows ★ star button (collection only); called with (e) on click
  //   onCardClick: fn|null,  // optional — attached as click listener on the card element
  //                          // (in addition to the global delegation in movies-app.js)
  // }
  //
  // Notes:
  //   - No references to globals like `movies`, `loadMovies`, `gridView`, etc.
  //   - Card click delegation (openMovieModal) remains in movies-app.js using
  //     card.dataset.view + .card-name — this component sets both correctly.
  //   - addLiveBorder() does not exist as a function in the original codebase;
  //     the live state is purely the CSS class movie-card--live, set via isLive.

  function renderCard(movie, options) {
    const {
      view       = 'collection',
      isLive     = false,
      onRemove   = null,
      onStarClick = null,
      onCardClick = null,
    } = options || {};

    // Card root
    const card = document.createElement('div');
    card.className = 'card movie-card';
    card.dataset.title = movie.title;
    card.dataset.view = view;
    if (isLive) card.classList.add('movie-card--live');

    // Poster wrap
    const posterWrap = document.createElement('div');
    posterWrap.className = 'poster-wrap';

    const img = document.createElement('img');
    img.className = 'card-image movie-poster';
    img.draggable = false;
    img.src = movie.poster;
    img.alt = movie.title;

    posterWrap.appendChild(img);
    addTexturesToPoster(posterWrap, movie.title);

    // Star button (collection view — add to Reference Films)
    if (onStarClick) {
      const starBtn = document.createElement('button');
      starBtn.className = 'card-star-btn';
      starBtn.title = 'Add to Reference Films';
      starBtn.innerHTML = '\u2605';
      starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onStarClick(e);
      });
      posterWrap.appendChild(starBtn);
    }

    // Remove button (watchlist / maybe / meh / banned)
    if (onRemove) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'card-remove-btn';
      removeBtn.innerHTML = '\u2715';
      const removeTitles = {
        watchlist: 'Remove from To Watch',
        maybe:     'Remove from Wildcard',
        meh:       'Remove from Meh',
        banned:    'Remove from Don\'t Recommend',
      };
      removeBtn.title = removeTitles[view] || 'Remove';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onRemove(e);
      });
      posterWrap.appendChild(removeBtn);
    }

    // Card info
    const info = document.createElement('div');
    info.className = 'card-info';

    const titleEl = document.createElement('span');
    titleEl.className = 'card-name';
    titleEl.textContent = movie.title;

    const meta = document.createElement('span');
    meta.className = 'card-trade';
    meta.textContent = [movie.director, movie.year].filter(Boolean).join(', ');

    info.appendChild(titleEl);
    info.appendChild(meta);
    appendCardRatings(info, movie);

    card.appendChild(posterWrap);
    card.appendChild(info);

    // Optional explicit click handler (supplements delegation)
    if (onCardClick) {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-remove-btn, .card-star-btn')) return;
        onCardClick(e);
      });
    }

    addTilt(card);

    return card;
  }

  return {
    renderCard,
    addTilt,
    addTexturesToPoster,
    appendCardRatings,
  };
})();
