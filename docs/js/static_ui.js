/**
 * Coin Quest — Standalone UI Controller for GitHub Pages
 * Zero-backend client-side persistence via localStorage for levels and high scores.
 */

(function () {
  'use strict';

  // Persistence helpers
  function getUnlockedLevels() {
    try {
      const stored = JSON.parse(localStorage.getItem('coinquest_unlocked_levels'));
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch (e) {}
    const def = [1];
    localStorage.setItem('coinquest_unlocked_levels', JSON.stringify(def));
    return def;
  }

  function unlockLevel(lvlNum) {
    const list = getUnlockedLevels();
    if (!list.includes(lvlNum)) {
      list.push(lvlNum);
      list.sort((a, b) => a - b);
      localStorage.setItem('coinquest_unlocked_levels', JSON.stringify(list));
    }
    return list;
  }

  function getHighScores() {
    try {
      const stored = JSON.parse(localStorage.getItem('coinquest_high_scores'));
      if (Array.isArray(stored)) return stored;
    } catch (e) {}
    // Default demo leaderboard entries
    const defaults = [
      { id: 1, playerName: 'CyberKnight', levelNumber: 5, levelTitle: 'The Neon Citadel', score: 5850, coins: 25, totalCoins: 25, time: 74.2, lives: 3, stars: 3, date: 'Oct 25' },
      { id: 2, playerName: 'StarLeaper', levelNumber: 4, levelTitle: 'Stormy Peaks', score: 4420, coins: 20, totalCoins: 20, time: 61.5, lives: 3, stars: 3, date: 'Oct 25' },
      { id: 3, playerName: 'PixelNinja', levelNumber: 3, levelTitle: 'Molten Core', score: 3790, coins: 18, totalCoins: 18, time: 54.8, lives: 2, stars: 2, date: 'Oct 26' },
      { id: 4, playerName: 'GoldFinder', levelNumber: 2, levelTitle: 'Crystal Caverns', score: 3100, coins: 15, totalCoins: 15, time: 42.1, lives: 3, stars: 3, date: 'Oct 26' },
      { id: 5, playerName: 'RookieBob', levelNumber: 1, levelTitle: 'Verdant Groves', score: 2450, coins: 10, totalCoins: 10, time: 31.0, lives: 2, stars: 2, date: 'Oct 26' },
    ];
    localStorage.setItem('coinquest_high_scores', JSON.stringify(defaults));
    return defaults;
  }

  function saveScore(scoreObj) {
    const list = getHighScores();
    list.push(scoreObj);
    list.sort((a, b) => b.score - a.score);
    localStorage.setItem('coinquest_high_scores', JSON.stringify(list.slice(0, 50)));
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Page section routing
    const views = {
      home: document.getElementById('view-home'),
      levels: document.getElementById('view-levels'),
      play: document.getElementById('view-play'),
      scores: document.getElementById('view-scores'),
      howToPlay: document.getElementById('view-how-to-play')
    };

    function showView(viewName) {
      Object.keys(views).forEach((key) => {
        if (views[key]) {
          views[key].style.display = key === viewName ? 'block' : 'none';
        }
      });

      // Update Nav active states
      document.querySelectorAll('.nav-link').forEach((link) => {
        if (link.getAttribute('data-view') === viewName) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      if (viewName === 'levels') renderLevelCards();
      if (viewName === 'scores') renderLeaderboard();
      if (viewName === 'home') renderHomeStats();
      window.scrollTo(0, 0);
    }

    // Hash or click based navigation
    document.querySelectorAll('[data-nav]').forEach((elem) => {
      elem.addEventListener('click', (e) => {
        e.preventDefault();
        const target = elem.getAttribute('data-nav');
        if (target.startsWith('play-')) {
          const lvl = parseInt(target.replace('play-', ''), 10);
          launchLevel(lvl);
        } else {
          showView(target);
        }
      });
    });

    // Sound toggle
    const soundToggle = document.getElementById('global-sound-toggle');
    const soundIcon = document.getElementById('sound-icon-display');
    function updateSoundIcons() {
      const isMuted = window.SoundManager ? SoundManager.isMuted() : false;
      const text = isMuted ? '🔇' : '🔊';
      if (soundIcon) soundIcon.textContent = text;
      const hudIcon = document.getElementById('hud-sound-icon');
      if (hudIcon) hudIcon.textContent = text;
    }
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        if (window.SoundManager) {
          SoundManager.toggleMute();
          updateSoundIcons();
          if (!SoundManager.isMuted()) SoundManager.playCoin();
        }
      });
    }
    updateSoundIcons();

    // Home Stats
    function renderHomeStats() {
      const unlocked = getUnlockedLevels();
      const maxLvl = Math.max(...unlocked);
      const playBtn = document.getElementById('hero-play-btn');
      if (playBtn) playBtn.innerHTML = `<span class="btn-icon-prefix">▶</span> Play Level ${maxLvl}`;
      
      const scores = getHighScores();
      const totalRunsElem = document.getElementById('home-total-runs');
      if (totalRunsElem) totalRunsElem.textContent = `${scores.length} Runs`;

      const previewTbody = document.getElementById('home-top-scores-tbody');
      if (previewTbody) {
        previewTbody.innerHTML = '';
        scores.slice(0, 5).forEach((sc, idx) => {
          const medal = idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `#${idx + 1}`;
          const medalClass = idx === 0 ? 'gold-medal' : idx === 1 ? 'silver-medal' : idx === 2 ? 'bronze-medal' : 'rank-num';
          const starsStr = sc.stars === 3 ? '★★★' : sc.stars === 2 ? '★★☆' : '★☆☆';
          const row = document.createElement('tr');
          row.innerHTML = `
            <td class="rank-col"><span class="medal ${medalClass}">${medal}</span></td>
            <td class="player-col"><span class="player-avatar">👤</span> <strong>${escapeHtml(sc.playerName)}</strong></td>
            <td><span class="level-tag">Lvl ${sc.levelNumber}: ${sc.levelTitle}</span></td>
            <td class="score-col">${sc.score}</td>
            <td>${sc.coins}/${sc.totalCoins}</td>
            <td>${sc.time.toFixed(1)}s</td>
            <td><span class="stars-gold">${starsStr}</span></td>
          `;
          previewTbody.appendChild(row);
        });
      }
    }

    // Level Select Grid
    function renderLevelCards() {
      const unlocked = getUnlockedLevels();
      const highest = Math.max(...unlocked);
      const progFill = document.getElementById('levels-progress-fill');
      const progText = document.getElementById('levels-highest-text');
      if (progFill) progFill.style.width = `calc(${highest} / 5 * 100%)`;
      if (progText) progText.textContent = `Level ${highest} of 5`;

      const grid = document.getElementById('level-cards-container');
      if (!grid) return;
      grid.innerHTML = '';

      const scores = getHighScores();

      [1, 2, 3, 4, 5].forEach((lvlNum) => {
        const lvl = window.LevelData[lvlNum];
        const isUnlocked = unlocked.includes(lvlNum);
        const best = scores.filter(s => s.levelNumber === lvlNum).sort((a,b) => b.score - a.score)[0];

        const card = document.createElement('div');
        card.className = `level-card ${isUnlocked ? 'card-unlocked' : 'card-locked'}`;

        const diffLower = lvl.difficulty ? lvl.difficulty.toLowerCase() : 'easy';
        card.innerHTML = `
          <div class="card-status-strip">
            <span class="card-lvl-num">LEVEL 0${lvlNum}</span>
            <span class="mini-diff-badge diff-${diffLower}">${lvl.difficulty}</span>
            <span class="status-badge ${isUnlocked ? 'unlocked-badge' : 'locked-badge'}">
              ${isUnlocked ? '🔓 Available' : '🔒 Locked'}
            </span>
          </div>
          <div class="card-main-content">
            <h2 class="card-realm-name">${lvl.title}</h2>
            <h3 class="card-realm-subtitle">${lvl.subtitle}</h3>
            <div class="realm-specs-grid">
              <div class="spec-item">
                <span class="spec-label">Target Coins</span>
                <span class="spec-value">🪙 ${lvl.targetCoins} of ${lvl.totalCoins}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Par Time</span>
                <span class="spec-value">⏱️ ${lvl.parTimeSeconds}s</span>
              </div>
            </div>
            ${best ? `
              <div class="best-score-banner">
                <span class="stars-gold">${best.stars === 3 ? '★★★' : best.stars === 2 ? '★★☆' : '★☆☆'}</span>
                <div class="best-score-details">
                  <span class="best-label">Best Record:</span>
                  <span class="best-val">${best.score} pts</span>
                </div>
              </div>
            ` : ''}
          </div>
          <div class="card-footer-action">
            ${isUnlocked ? `
              <button class="btn btn-primary btn-block" onclick="window.CoinQuestApp.launchLevel(${lvlNum})">
                ▶ Launch Realm
              </button>
            ` : `
              <button class="btn btn-disabled btn-block" disabled>
                🔒 Complete Level ${lvlNum - 1} to Unlock
              </button>
            `}
          </div>
        `;
        grid.appendChild(card);
      });
    }

    // Leaderboard
    let currentFilterLvl = null;
    function renderLeaderboard() {
      const scores = getHighScores();
      const filtered = currentFilterLvl ? scores.filter(s => s.levelNumber === currentFilterLvl) : scores;
      const tbody = document.getElementById('leaderboard-tbody');
      const emptyMsg = document.getElementById('leaderboard-empty');
      const tableWrap = document.getElementById('leaderboard-table-wrap');

      if (!tbody) return;
      tbody.innerHTML = '';

      if (filtered.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (tableWrap) tableWrap.style.display = 'none';
        return;
      }

      if (emptyMsg) emptyMsg.style.display = 'none';
      if (tableWrap) tableWrap.style.display = 'block';

      filtered.forEach((sc, idx) => {
        const medal = idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `#${idx + 1}`;
        const medalClass = idx === 0 ? 'gold-medal' : idx === 1 ? 'silver-medal' : idx === 2 ? 'bronze-medal' : 'rank-num';
        const starsStr = sc.stars === 3 ? '★★★' : sc.stars === 2 ? '★★☆' : '★☆☆';
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="rank-col"><span class="medal ${medalClass}">${medal}</span></td>
          <td class="player-col"><span class="player-avatar">👤</span> <strong>${escapeHtml(sc.playerName)}</strong></td>
          <td><span class="level-tag">Lvl ${sc.levelNumber}: ${sc.levelTitle}</span></td>
          <td class="score-col">${sc.score}</td>
          <td>🪙 ${sc.coins}/${sc.totalCoins}</td>
          <td>${sc.lives === 3 ? '❤️❤️❤️' : sc.lives === 2 ? '❤️❤️🖤' : '❤️🖤🖤'}</td>
          <td>⏱️ ${sc.time.toFixed(1)}s</td>
          <td><span class="stars-gold">${starsStr}</span></td>
          <td class="date-col">${sc.date || 'Recent'}</td>
        `;
        tbody.appendChild(row);
      });
    }

    // Tab filters on scores page
    document.querySelectorAll('.tab-pill[data-score-tab]').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.tab-pill[data-score-tab]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filterVal = tab.getAttribute('data-score-tab');
        currentFilterLvl = filterVal === 'all' ? null : parseInt(filterVal, 10);
        renderLeaderboard();
      });
    });

    // Reset Progress Button
    const resetBtn = document.getElementById('btn-static-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset your level progression back to Level 1? (Saved high scores are kept)')) {
          localStorage.setItem('coinquest_unlocked_levels', JSON.stringify([1]));
          renderLevelCards();
          renderHomeStats();
          alert('Progression reset to Level 1!');
        }
      });
    }

    // GAMEPLAY CONTROLLER
    let currentEngine = null;
    let currentLevelNum = 1;
    let lastCompletedRun = null;

    const canvas = document.getElementById('game-canvas');
    const hudCoins = document.getElementById('hud-coins');
    const hudTargetCoins = document.getElementById('hud-target-coins');
    const hudScore = document.getElementById('hud-score');
    const hudTimer = document.getElementById('hud-timer');
    const hudLvlTitle = document.getElementById('hud-lvl-title');
    const hudLvlNum = document.getElementById('hud-lvl-num');
    const hudHearts = [
      document.getElementById('heart-1'),
      document.getElementById('heart-2'),
      document.getElementById('heart-3')
    ];

    const pauseModal = document.getElementById('pause-modal');
    const victoryModal = document.getElementById('victory-modal');
    const gameoverModal = document.getElementById('gameover-modal');

    function formatTime(s) {
      const mins = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function launchLevel(lvlNum) {
      const unlocked = getUnlockedLevels();
      if (!unlocked.includes(lvlNum)) {
        alert(`Level ${lvlNum} is locked! Complete preceding levels first.`);
        showView('levels');
        return;
      }

      currentLevelNum = lvlNum;
      showView('play');

      if (currentEngine) {
        currentEngine.destroy();
        currentEngine = null;
      }

      const lvlData = window.LevelData[lvlNum] || window.LevelData[1];
      if (hudLvlNum) hudLvlNum.textContent = `LVL ${lvlNum}`;
      if (hudLvlTitle) hudLvlTitle.textContent = lvlData.title;
      if (hudTargetCoins) hudTargetCoins.textContent = lvlData.targetCoins;

      const objBanner = document.getElementById('objective-banner');
      if (objBanner) {
        objBanner.innerHTML = `<span class="obj-icon">🎯</span><span class="obj-text">Collect at least <strong>${lvlData.targetCoins} coins</strong> to activate the Exit Portal!</span>`;
        objBanner.classList.remove('fade-out');
        setTimeout(() => objBanner.classList.add('fade-out'), 4500);
      }

      currentEngine = new CoinQuestEngine(canvas, { levelNumber: lvlNum }, (evt, data) => {
        switch (evt) {
          case 'HUD_UPDATE':
            if (hudCoins) hudCoins.textContent = data.coins;
            if (hudScore) hudScore.textContent = data.score;
            if (hudTimer) hudTimer.textContent = formatTime(data.time);
            for (let i = 0; i < 3; i++) {
              if (hudHearts[i]) {
                if (i < data.lives) hudHearts[i].classList.remove('lost');
                else hudHearts[i].classList.add('lost');
              }
            }
            break;

          case 'PAUSED':
            if (pauseModal) {
              document.getElementById('pause-coins').textContent = `${data.coins} / ${lvlData.targetCoins}`;
              document.getElementById('pause-time').textContent = formatTime(data.time);
              document.getElementById('pause-score').textContent = data.score;
              pauseModal.classList.add('active');
            }
            break;

          case 'RESUMED':
            if (pauseModal) pauseModal.classList.remove('active');
            break;

          case 'RESTARTED':
            closeModals();
            break;

          case 'GAME_OVER':
            closeModals();
            if (gameoverModal) {
              document.getElementById('gameover-coins').textContent = data.coins;
              document.getElementById('gameover-time').textContent = formatTime(data.time);
              document.getElementById('gameover-score').textContent = data.score;
              gameoverModal.classList.add('active');
            }
            break;

          case 'LEVEL_CLEARED':
            closeModals();
            lastCompletedRun = data;
            // Unlock next level
            if (currentLevelNum < 5) {
              unlockLevel(currentLevelNum + 1);
            }
            showVictory(data, lvlData);
            break;
        }
      });

      currentEngine.start();
      canvas.focus();
    }

    function closeModals() {
      if (pauseModal) pauseModal.classList.remove('active');
      if (victoryModal) victoryModal.classList.remove('active');
      if (gameoverModal) gameoverModal.classList.remove('active');
    }

    function showVictory(data, lvlData) {
      if (!victoryModal) return;
      document.getElementById('victory-realm-name').textContent = `Level ${currentLevelNum}: ${lvlData.title}`;
      document.getElementById('victory-coins-summary').textContent = `${data.coinsCollected} / ${data.totalCoins}`;
      document.getElementById('victory-lives-summary').textContent = `${data.livesRemaining} / 3`;
      document.getElementById('victory-time-summary').textContent = `${data.timeTaken.toFixed(1)}s (Par: ${data.parTime}s)`;
      document.getElementById('victory-final-score').textContent = data.score;

      const stars = [document.getElementById('star-1'), document.getElementById('star-2'), document.getElementById('star-3')];
      stars.forEach((s, i) => {
        if (s) {
          if (i < data.stars) s.classList.add('earned');
          else s.classList.remove('earned');
        }
      });

      const nextBtn = document.getElementById('btn-next-level');
      if (nextBtn) {
        if (currentLevelNum < 5) {
          nextBtn.style.display = 'inline-flex';
          nextBtn.textContent = `Next Level (Lvl ${currentLevelNum + 1}) →`;
          nextBtn.onclick = () => launchLevel(currentLevelNum + 1);
        } else {
          nextBtn.style.display = 'inline-flex';
          nextBtn.textContent = 'View High Scores 🏆';
          nextBtn.onclick = () => { closeModals(); showView('scores'); };
        }
      }

      // Auto save run
      const nameInput = document.getElementById('player-name-input');
      const pName = (nameInput && nameInput.value.trim()) || 'Adventurer';
      saveRunRecord(pName, data, lvlData);

      victoryModal.classList.add('active');
    }

    function saveRunRecord(name, data, lvlData) {
      const now = new Date();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dateStr = `${monthNames[now.getMonth()]} ${now.getDate()}`;

      saveScore({
        id: Date.now(),
        playerName: name,
        levelNumber: currentLevelNum,
        levelTitle: lvlData.title,
        score: data.score,
        coins: data.coinsCollected,
        totalCoins: data.totalCoins,
        time: data.timeTaken,
        lives: data.livesRemaining,
        stars: data.stars,
        date: dateStr
      });

      const msg = document.getElementById('submit-status-msg');
      if (msg) {
        msg.textContent = `Record saved to Hall of Fame (${data.score} pts)! ✨`;
        msg.style.color = '#34d399';
      }
    }

    // Modal Action listeners
    document.getElementById('btn-resume-game')?.addEventListener('click', () => currentEngine?.resume());
    document.getElementById('btn-pause-restart')?.addEventListener('click', () => currentEngine?.restart());
    document.getElementById('hud-restart-btn')?.addEventListener('click', () => {
      if (confirm('Restart current realm?')) currentEngine?.restart();
    });
    document.getElementById('hud-pause-btn')?.addEventListener('click', () => currentEngine?.togglePause());
    document.getElementById('hud-sound-btn')?.addEventListener('click', () => {
      if (window.SoundManager) {
        SoundManager.toggleMute();
        updateSoundIcons();
      }
    });
    document.getElementById('btn-gameover-retry')?.addEventListener('click', () => currentEngine?.restart());
    document.getElementById('btn-victory-replay')?.addEventListener('click', () => currentEngine?.restart());
    document.getElementById('btn-save-score')?.addEventListener('click', () => {
      if (lastCompletedRun) {
        const nameInput = document.getElementById('player-name-input');
        const pName = (nameInput && nameInput.value.trim()) || 'Adventurer';
        const lvlData = window.LevelData[currentLevelNum];
        saveRunRecord(pName, lastCompletedRun, lvlData);
      }
    });

    // Touch controls
    function bindTouch(id, key) {
      const b = document.getElementById(id);
      if (!b) return;
      b.addEventListener('touchstart', (e) => { e.preventDefault(); currentEngine?.setTouchKey(key, true); }, { passive: false });
      b.addEventListener('touchend', (e) => { e.preventDefault(); currentEngine?.setTouchKey(key, false); }, { passive: false });
      b.addEventListener('mousedown', () => currentEngine?.setTouchKey(key, true));
      b.addEventListener('mouseup', () => currentEngine?.setTouchKey(key, false));
    }
    bindTouch('touch-btn-left', 'left');
    bindTouch('touch-btn-right', 'right');
    bindTouch('touch-btn-jump', 'jump');

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    // Global expose
    window.CoinQuestApp = {
      showView,
      launchLevel
    };

    // Default view
    showView('home');
  });
})();
