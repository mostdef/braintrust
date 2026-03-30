// components/nww.js
// Pure visual rendering snapshots for each NWW widget state.
// These functions do NOT wire up timers or state transitions — they just
// stamp the correct DOM into `container`. The sandbox can call them directly
// with mock data to preview any state in isolation.

const NWWComponent = (() => {

  // ── Idle ────────────────────────────────────────────────────────────────────

  /**
   * Render the idle button state.
   * Matches: .nww.nww--idle → #nww-idle-btn visible
   *
   * @param {HTMLElement} container
   */
  function renderIdle(container) {
    container.innerHTML = `
      <button class="nww-idle-btn" id="nww-idle-btn">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
          <line x1="7" y1="2" x2="7" y2="22"/>
          <line x1="17" y1="2" x2="17" y2="22"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <line x1="2" y1="7" x2="7" y2="7"/>
          <line x1="2" y1="17" x2="7" y2="17"/>
          <line x1="17" y1="17" x2="22" y2="17"/>
          <line x1="17" y1="7" x2="22" y2="7"/>
        </svg>
      </button>`;
  }

  // ── Pill (collapsed / playing) ───────────────────────────────────────────────

  /**
   * Render the pill (collapsed) state shown while a film is playing.
   * Matches: .nww.nww--playing → #nww-pill visible
   *
   * @param {HTMLElement} container
   * @param {Object} opts
   * @param {string}  opts.title     - Film title
   * @param {string}  [opts.poster]  - Poster URL
   * @param {string}  opts.elapsed   - Formatted elapsed time string e.g. "1:23:45"
   * @param {string}  opts.runtime   - Formatted runtime string e.g. "2:04:00"
   * @param {number}  opts.barFill   - Progress bar fill percentage (0–100)
   */
  function renderPill(container, { title, poster, elapsed, runtime, barFill }) {
    container.innerHTML = `
      <div class="nww-pill" id="nww-pill">
        <div class="nww-pill-poster" id="nww-pill-poster">
          ${poster ? `<img src="${poster}" alt="">` : ''}
        </div>
        <span class="nww-pill-title" id="nww-pill-title">${title || ''}</span>
        <span class="nww-pill-time" id="nww-pill-time">${elapsed || '0:00'} / ${runtime || '0:00'}</span>
        <div class="nww-pill-bar">
          <div class="nww-pill-bar-fill" id="nww-pill-bar-fill" style="width:${barFill || 0}%"></div>
        </div>
      </div>`;
  }

  // ── Playing / expanded panel ─────────────────────────────────────────────────

  /**
   * Render the playing/expanded panel showing poster, progress and controls.
   * Matches: .nww.nww--expanded → #nww-panel → #nww-playing visible, controls shown
   *
   * @param {HTMLElement} container
   * @param {Object} movie   - { title, year, director, poster }
   * @param {Object} opts
   * @param {string}   opts.elapsed         - Formatted elapsed time string
   * @param {string}   opts.runtime         - Formatted runtime string
   * @param {number}   opts.progressPct     - Fill percentage (0–100)
   * @param {boolean}  [opts.paused]        - Whether currently paused
   * @param {Function} [opts.onPause]       - Pause/Resume button callback
   * @param {Function} [opts.onDone]        - Done button callback
   * @param {Function} [opts.onAbandon]     - Abandon button callback
   * @param {Function} [opts.onCompanionOpen] - Companion button callback
   */
  function renderPlaying(container, movie, { elapsed, runtime, progressPct, paused, onPause, onDone, onAbandon, onCompanionOpen }) {
    container.innerHTML = '';

    const panel = document.createElement('div');
    panel.className = 'nww-panel';
    panel.id = 'nww-panel';

    const playing = document.createElement('div');
    playing.className = 'nww-playing';
    playing.id = 'nww-playing';

    // Poster
    const posterWrap = document.createElement('div');
    posterWrap.className = 'nww-poster-wrap';
    posterWrap.id = 'nww-poster-wrap';
    const posterImg = document.createElement('img');
    posterImg.className = 'nww-poster';
    posterImg.id = 'nww-poster';
    posterImg.src = movie.poster || '';
    posterImg.alt = movie.title || '';
    const posterGlow = document.createElement('div');
    posterGlow.className = 'nww-poster-glow';
    posterWrap.append(posterImg, posterGlow);

    // Title / meta
    const titleEl = document.createElement('div');
    titleEl.className = 'nww-title';
    titleEl.id = 'nww-title';
    titleEl.textContent = movie.title || '';

    const metaEl = document.createElement('div');
    metaEl.className = 'nww-meta';
    metaEl.id = 'nww-meta';
    metaEl.textContent = [movie.director, movie.year].filter(Boolean).join(' · ');

    // Progress
    const progressWrap = document.createElement('div');
    progressWrap.className = 'nww-progress-wrap';
    progressWrap.id = 'nww-progress-wrap';
    const progressBar = document.createElement('div');
    progressBar.className = 'nww-progress-bar';
    progressBar.id = 'nww-progress-bar';
    const progressFill = document.createElement('div');
    progressFill.className = 'nww-progress-fill';
    progressFill.id = 'nww-progress-fill';
    progressFill.style.width = (progressPct || 0) + '%';
    progressBar.appendChild(progressFill);
    const timeRow = document.createElement('div');
    timeRow.className = 'nww-time-row';
    timeRow.innerHTML = `<span id="nww-elapsed">${elapsed || '0:00'}</span><span id="nww-runtime">${runtime || '0:00'}</span>`;
    progressWrap.append(progressBar, timeRow);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'nww-controls';
    controls.id = 'nww-controls';
    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'nww-btn nww-btn-pause';
    pauseBtn.id = 'nww-pause-btn';
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    if (typeof onPause === 'function') pauseBtn.addEventListener('click', onPause);
    const doneBtn = document.createElement('button');
    doneBtn.className = 'nww-btn nww-btn-done';
    doneBtn.id = 'nww-done-btn';
    doneBtn.textContent = 'Done';
    if (typeof onDone === 'function') doneBtn.addEventListener('click', onDone);
    const abandonBtn = document.createElement('button');
    abandonBtn.className = 'nww-btn nww-btn-abandon';
    abandonBtn.id = 'nww-abandon-btn';
    abandonBtn.textContent = 'Abandon';
    if (typeof onAbandon === 'function') abandonBtn.addEventListener('click', onAbandon);
    controls.append(pauseBtn, doneBtn, abandonBtn);

    // Companion open button
    const companionOpenBtn = document.createElement('button');
    companionOpenBtn.className = 'nww-companion-open-btn';
    companionOpenBtn.id = 'nww-companion-open-btn';
    companionOpenBtn.textContent = '◎ Companion';
    if (typeof onCompanionOpen === 'function') companionOpenBtn.addEventListener('click', onCompanionOpen);

    // Decisions (hidden in playing state)
    const decisions = document.createElement('div');
    decisions.className = 'nww-decisions';
    decisions.id = 'nww-decisions';
    decisions.style.display = 'none';
    decisions.innerHTML = `
      <div class="nww-decisions-label">How was it?</div>
      <button class="nww-dec-btn nww-dec-collection" id="nww-dec-collection">Collection</button>
      <button class="nww-dec-btn nww-dec-meh" id="nww-dec-meh">Meh</button>
      <button class="nww-dec-btn nww-dec-ban" id="nww-dec-ban">Don't Recommend</button>`;

    const confirmation = document.createElement('div');
    confirmation.className = 'nww-confirmation';
    confirmation.id = 'nww-confirmation';
    confirmation.style.display = 'none';

    playing.append(posterWrap, titleEl, metaEl, progressWrap, controls, companionOpenBtn, decisions, confirmation);
    panel.appendChild(playing);
    container.appendChild(panel);
  }

  // ── Companion panel ──────────────────────────────────────────────────────────

  /**
   * Render the companion panel (film notes + chat).
   * The companion lives alongside the playing panel (.nww--companion-open modifier).
   *
   * @param {HTMLElement} container
   * @param {Object} opts
   * @param {Array}    opts.facts            - Array of { pct, text, delivered } fact objects
   * @param {Array}    opts.chatHistory      - Array of { role, content } messages
   * @param {boolean}  [opts.spoilersOk]     - Whether spoiler toggle is checked
   * @param {string}   [opts.model]          - 'sonnet' | 'haiku'
   * @param {number}   [opts.elapsedPct]     - Elapsed percentage (for fact dot positions)
   * @param {Function} [opts.onClose]        - Close button callback
   * @param {Function} [opts.onSpoilerToggle] - Spoiler checkbox change callback
   * @param {Function} [opts.onModelSwitch]  - (model) => void, called when model btn clicked
   * @param {Function} [opts.onSendChat]     - (message) => void
   */
  function renderCompanion(container, { facts = [], chatHistory = [], spoilersOk = false, model = 'sonnet', elapsedPct = 0, onClose, onSpoilerToggle, onModelSwitch, onSendChat }) {
    container.innerHTML = '';

    const companion = document.createElement('div');
    companion.className = 'nww-companion';
    companion.id = 'nww-companion';

    // Header
    const header = document.createElement('div');
    header.className = 'nww-companion-header';
    const headerControls = document.createElement('div');
    headerControls.className = 'nww-companion-header-controls';

    // Spoiler toggle
    const spoilerLabel = document.createElement('label');
    spoilerLabel.className = 'nww-companion-toggle-wrap';
    const spoilerCb = document.createElement('input');
    spoilerCb.type = 'checkbox';
    spoilerCb.id = 'nww-companion-spoiler';
    spoilerCb.checked = !!spoilersOk;
    if (typeof onSpoilerToggle === 'function') spoilerCb.addEventListener('change', onSpoilerToggle);
    const spoilerSwitch = document.createElement('span');
    spoilerSwitch.className = 'nww-pill-switch';
    const spoilerLabelText = document.createElement('span');
    spoilerLabelText.className = 'nww-companion-toggle-label';
    spoilerLabelText.textContent = 'Spoil me';
    spoilerLabel.append(spoilerCb, spoilerSwitch, spoilerLabelText);

    // Model toggle
    const modelToggle = document.createElement('div');
    modelToggle.className = 'nww-model-toggle';
    const sonnetBtn = document.createElement('button');
    sonnetBtn.className = 'nww-model-btn' + (model !== 'haiku' ? ' active' : '');
    sonnetBtn.dataset.model = 'sonnet';
    sonnetBtn.id = 'nww-model-sonnet';
    sonnetBtn.textContent = 'Sonnet';
    const haikuBtn = document.createElement('button');
    haikuBtn.className = 'nww-model-btn' + (model === 'haiku' ? ' active' : '');
    haikuBtn.dataset.model = 'haiku';
    haikuBtn.id = 'nww-model-haiku';
    haikuBtn.textContent = 'Haiku';
    if (typeof onModelSwitch === 'function') {
      sonnetBtn.addEventListener('click', () => onModelSwitch('sonnet'));
      haikuBtn.addEventListener('click', () => onModelSwitch('haiku'));
    }
    modelToggle.append(sonnetBtn, haikuBtn);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'nww-companion-close';
    closeBtn.id = 'nww-companion-close';
    closeBtn.textContent = '✕';
    if (typeof onClose === 'function') closeBtn.addEventListener('click', onClose);

    headerControls.append(spoilerLabel, modelToggle, closeBtn);
    header.appendChild(headerControls);

    // Facts section
    const factsSection = document.createElement('div');
    factsSection.className = 'nww-facts-section';
    const factsLabel = document.createElement('div');
    factsLabel.className = 'nww-facts-label';
    factsLabel.textContent = 'FILM NOTES';
    const factsList = document.createElement('div');
    factsList.className = 'nww-facts-list';
    factsList.id = 'nww-facts-list';

    if (facts.length > 0) {
      facts.forEach(f => {
        const card = document.createElement('div');
        card.className = 'nww-fact-card' + (!f.delivered ? ' nww-fact-upcoming' : '');
        card.dataset.pct = f.pct;
        card.innerHTML = `<div class="nww-fact-pct">~${f.pct}% in</div><div class="nww-fact-text">${f.text}</div>`;
        factsList.appendChild(card);
      });
    } else {
      factsList.innerHTML = `
        <div class="nww-facts-loading" id="nww-facts-loading">
          <div class="nww-facts-skeleton"></div>
          <div class="nww-facts-skeleton"></div>
        </div>`;
    }

    factsSection.append(factsLabel, factsList);

    // Divider
    const divider = document.createElement('div');
    divider.className = 'nww-companion-divider';

    // Chat thread
    const chatThread = document.createElement('div');
    chatThread.className = 'nww-chat-thread';
    chatThread.id = 'nww-chat-thread';
    chatHistory.forEach(msg => {
      const msgEl = document.createElement('div');
      msgEl.className = `nww-msg nww-msg-${msg.role} no-anim`;
      const bubble = document.createElement('div');
      bubble.className = 'nww-msg-bubble';
      bubble.textContent = msg.content;
      msgEl.appendChild(bubble);
      chatThread.appendChild(msgEl);
    });

    // Chat input area
    const chatInputArea = document.createElement('div');
    chatInputArea.className = 'nww-chat-input-area';
    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.className = 'nww-chat-input';
    chatInput.id = 'nww-chat-input';
    chatInput.placeholder = 'Ask anything about this film…';
    chatInput.autocomplete = 'off';
    const chatSend = document.createElement('button');
    chatSend.className = 'nww-chat-send';
    chatSend.id = 'nww-chat-send';
    chatSend.textContent = '↑';
    if (typeof onSendChat === 'function') {
      chatSend.addEventListener('click', () => {
        const msg = chatInput.value.trim();
        if (msg) { chatInput.value = ''; onSendChat(msg); }
      });
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const msg = chatInput.value.trim();
          if (msg) { chatInput.value = ''; onSendChat(msg); }
        }
      });
    }
    chatInputArea.append(chatInput, chatSend);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'nww-companion-footer';
    footer.id = 'nww-companion-footer';

    companion.append(header, factsSection, divider, chatThread, chatInputArea, footer);
    container.appendChild(companion);

    // Scroll chat to bottom
    chatThread.scrollTop = chatThread.scrollHeight;
  }

  // ── Deciding ────────────────────────────────────────────────────────────────

  /**
   * Render the deciding state — decisions shown, controls hidden.
   * Matches: .nww.nww--deciding → decisions visible inside #nww-playing
   *
   * @param {HTMLElement} container
   * @param {Object} movie   - { title, year, director, poster }
   * @param {Object} opts
   * @param {Function} [opts.onCollection]  - Collection button callback
   * @param {Function} [opts.onMeh]         - Meh button callback
   * @param {Function} [opts.onBan]         - Don't Recommend button callback
   */
  function renderDeciding(container, movie, { onCollection, onMeh, onBan }) {
    container.innerHTML = '';

    const panel = document.createElement('div');
    panel.className = 'nww-panel';
    panel.id = 'nww-panel';

    const playing = document.createElement('div');
    playing.className = 'nww-playing';
    playing.id = 'nww-playing';

    // Poster
    const posterWrap = document.createElement('div');
    posterWrap.className = 'nww-poster-wrap';
    posterWrap.id = 'nww-poster-wrap';
    const posterImg = document.createElement('img');
    posterImg.className = 'nww-poster';
    posterImg.id = 'nww-poster';
    posterImg.src = movie.poster || '';
    posterImg.alt = movie.title || '';
    const posterGlow = document.createElement('div');
    posterGlow.className = 'nww-poster-glow';
    posterWrap.append(posterImg, posterGlow);

    const titleEl = document.createElement('div');
    titleEl.className = 'nww-title';
    titleEl.id = 'nww-title';
    titleEl.textContent = movie.title || '';

    const metaEl = document.createElement('div');
    metaEl.className = 'nww-meta';
    metaEl.id = 'nww-meta';
    metaEl.textContent = [movie.director, movie.year].filter(Boolean).join(' · ');

    // Controls (hidden)
    const controls = document.createElement('div');
    controls.className = 'nww-controls';
    controls.id = 'nww-controls';
    controls.style.display = 'none';

    // Decisions
    const decisions = document.createElement('div');
    decisions.className = 'nww-decisions';
    decisions.id = 'nww-decisions';
    const decisionsLabel = document.createElement('div');
    decisionsLabel.className = 'nww-decisions-label';
    decisionsLabel.textContent = 'How was it?';
    const collectionBtn = document.createElement('button');
    collectionBtn.className = 'nww-dec-btn nww-dec-collection';
    collectionBtn.id = 'nww-dec-collection';
    collectionBtn.textContent = 'Collection';
    if (typeof onCollection === 'function') collectionBtn.addEventListener('click', onCollection);
    const mehBtn = document.createElement('button');
    mehBtn.className = 'nww-dec-btn nww-dec-meh';
    mehBtn.id = 'nww-dec-meh';
    mehBtn.textContent = 'Meh';
    if (typeof onMeh === 'function') mehBtn.addEventListener('click', onMeh);
    const banBtn = document.createElement('button');
    banBtn.className = 'nww-dec-btn nww-dec-ban';
    banBtn.id = 'nww-dec-ban';
    banBtn.textContent = "Don't Recommend";
    if (typeof onBan === 'function') banBtn.addEventListener('click', onBan);
    decisions.append(decisionsLabel, collectionBtn, mehBtn, banBtn);

    const confirmation = document.createElement('div');
    confirmation.className = 'nww-confirmation';
    confirmation.id = 'nww-confirmation';
    confirmation.style.display = 'none';

    playing.append(posterWrap, titleEl, metaEl, controls, decisions, confirmation);
    panel.appendChild(playing);
    container.appendChild(panel);
  }

  return { renderIdle, renderPill, renderPlaying, renderCompanion, renderDeciding };
})();
