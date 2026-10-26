/**
 * Coin Quest — UI Controller, HUD Synchronizer, and Score Submitter
 * Connects Canvas engine events with DOM elements and handles CSRF AJAX score recording.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const metaTag = document.getElementById('current-level-meta');

    if (!canvas || !metaTag) {
      return; // Not on the play page
    }

    let levelMeta = {};
    try {
      levelMeta = JSON.parse(metaTag.textContent);
    } catch (err) {
      console.error('Failed to parse level metadata:', err);
      return;
    }

    // DOM Elements - HUD
    const hudCoins = document.getElementById('hud-coins');
    const hudTargetCoins = document.getElementById('hud-target-coins');
    const hudScore = document.getElementById('hud-score');
    const hudTimer = document.getElementById('hud-timer');
    const hudHearts = [
      document.getElementById('heart-1'),
      document.getElementById('heart-2'),
      document.getElementById('heart-3')
    ];
    const hudPauseBtn = document.getElementById('hud-pause-btn');
    const hudRestartBtn = document.getElementById('hud-restart-btn');
    const hudSoundBtn = document.getElementById('hud-sound-btn');
    const hudSoundIcon = document.getElementById('hud-sound-icon');
    const objectiveBanner = document.getElementById('objective-banner');

    // Modals
    const pauseModal = document.getElementById('pause-modal');
    const btnResumeGame = document.getElementById('btn-resume-game');
    const btnPauseRestart = document.getElementById('btn-pause-restart');
    const pauseCoins = document.getElementById('pause-coins');
    const pauseTime = document.getElementById('pause-time');
    const pauseScore = document.getElementById('pause-score');

    const victoryModal = document.getElementById('victory-modal');
    const victoryCoinsSummary = document.getElementById('victory-coins-summary');
    const victoryLivesSummary = document.getElementById('victory-lives-summary');
    const victoryTimeSummary = document.getElementById('victory-time-summary');
    const victoryFinalScore = document.getElementById('victory-final-score');
    const playerNameInput = document.getElementById('player-name-input');
    const btnSaveScore = document.getElementById('btn-save-score');
    const submitStatusMsg = document.getElementById('submit-status-msg');
    const btnVictoryReplay = document.getElementById('btn-victory-replay');
    const victoryStars = [
      document.getElementById('star-1'),
      document.getElementById('star-2'),
      document.getElementById('star-3')
    ];

    const gameoverModal = document.getElementById('gameover-modal');
    const btnGameoverRetry = document.getElementById('btn-gameover-retry');
    const gameoverCoins = document.getElementById('gameover-coins');
    const gameoverTime = document.getElementById('gameover-time');
    const gameoverScore = document.getElementById('gameover-score');

    // Last completed run cache for resubmission
    let lastCompletedRun = null;

    // Helper: format seconds to MM:SS
    function formatTime(totalSeconds) {
      const mins = Math.floor(totalSeconds / 60);
      const secs = Math.floor(totalSeconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Helper: update Sound Button display
    function updateSoundBtn() {
      if (hudSoundIcon && window.SoundManager) {
        hudSoundIcon.textContent = SoundManager.isMuted() ? '🔇' : '🔊';
      }
    }
    updateSoundBtn();

    // Fade out objective banner after 4.5 seconds
    if (objectiveBanner) {
      setTimeout(() => {
        objectiveBanner.classList.add('fade-out');
      }, 4500);
    }

    // Initialize Game Engine
    const engine = new CoinQuestEngine(canvas, levelMeta, (eventType, data) => {
      switch (eventType) {
        case 'HUD_UPDATE':
          if (hudCoins) hudCoins.textContent = data.coins;
          if (hudScore) hudScore.textContent = data.score;
          if (hudTimer) hudTimer.textContent = formatTime(data.time);

          // Update Hearts
          for (let i = 0; i < 3; i++) {
            if (hudHearts[i]) {
              if (i < data.lives) {
                hudHearts[i].classList.remove('lost');
              } else {
                hudHearts[i].classList.add('lost');
              }
            }
          }
          break;

        case 'PORTAL_ACTIVATED':
          if (objectiveBanner) {
            objectiveBanner.innerHTML = '<span class="obj-icon">✨</span><span class="obj-text">Portal is open! Step into the vortex to advance!</span>';
            objectiveBanner.classList.remove('fade-out');
          }
          break;

        case 'PAUSED':
          if (pauseModal) {
            if (pauseCoins) pauseCoins.textContent = `${data.coins} / ${levelMeta.targetCoins}`;
            if (pauseTime) pauseTime.textContent = formatTime(data.time);
            if (pauseScore) pauseScore.textContent = data.score;
            pauseModal.classList.add('active');
            pauseModal.setAttribute('aria-hidden', 'false');
          }
          break;

        case 'RESUMED':
          if (pauseModal) {
            pauseModal.classList.remove('active');
            pauseModal.setAttribute('aria-hidden', 'true');
          }
          break;

        case 'RESTARTED':
          closeAllModals();
          if (objectiveBanner) {
            objectiveBanner.classList.remove('fade-out');
            setTimeout(() => {
              objectiveBanner.classList.add('fade-out');
            }, 4500);
          }
          break;

        case 'GAME_OVER':
          closeAllModals();
          if (gameoverModal) {
            if (gameoverCoins) gameoverCoins.textContent = data.coins;
            if (gameoverTime) gameoverTime.textContent = formatTime(data.time);
            if (gameoverScore) gameoverScore.textContent = data.score;
            gameoverModal.classList.add('active');
            gameoverModal.setAttribute('aria-hidden', 'false');
          }
          break;

        case 'LEVEL_CLEARED':
          closeAllModals();
          lastCompletedRun = data;
          showVictoryModal(data);
          // Automatically submit score with current adventurer name
          submitScoreRun(data);
          break;
      }
    });

    function closeAllModals() {
      if (pauseModal) {
        pauseModal.classList.remove('active');
        pauseModal.setAttribute('aria-hidden', 'true');
      }
      if (victoryModal) {
        victoryModal.classList.remove('active');
        victoryModal.setAttribute('aria-hidden', 'true');
      }
      if (gameoverModal) {
        gameoverModal.classList.remove('active');
        gameoverModal.setAttribute('aria-hidden', 'true');
      }
    }

    function showVictoryModal(data) {
      if (!victoryModal) return;

      if (victoryCoinsSummary) {
        victoryCoinsSummary.textContent = `${data.coinsCollected} / ${data.totalCoins}`;
      }
      if (victoryLivesSummary) {
        victoryLivesSummary.textContent = `${data.livesRemaining} / 3`;
      }
      if (victoryTimeSummary) {
        victoryTimeSummary.textContent = `${data.timeTaken.toFixed(1)}s (Par: ${data.parTime}s)`;
      }
      if (victoryFinalScore) {
        victoryFinalScore.textContent = data.score;
      }

      // Render Earned Stars
      victoryStars.forEach((starElem, idx) => {
        if (starElem) {
          if (idx < data.stars) {
            starElem.classList.add('earned');
          } else {
            starElem.classList.remove('earned');
          }
        }
      });

      victoryModal.classList.add('active');
      victoryModal.setAttribute('aria-hidden', 'false');
    }

    // CSRF-protected AJAX score submission
    function submitScoreRun(data) {
      if (!data || !levelMeta.submitScoreUrl) return;

      if (submitStatusMsg) {
        submitStatusMsg.textContent = 'Saving record to Hall of Fame...';
        submitStatusMsg.style.color = '#38bdf8';
      }

      const payload = {
        level_number: levelMeta.levelNumber,
        coins_collected: data.coinsCollected,
        time_taken_seconds: parseFloat(data.timeTaken.toFixed(2)),
        lives_remaining: data.livesRemaining,
        player_name: (playerNameInput && playerNameInput.value.trim()) || 'Adventurer',
        client_score: data.score
      };

      fetch(levelMeta.submitScoreUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': levelMeta.csrfToken
        },
        body: JSON.stringify(payload)
      })
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success) {
            if (submitStatusMsg) {
              const extra = resData.is_global_high
                ? ' 🥇 New All-Time Record!'
                : resData.is_personal_best
                ? ' 🌟 Personal Best!'
                : '';
              submitStatusMsg.textContent = `Score saved (${resData.score} pts)!${extra}`;
              submitStatusMsg.style.color = '#34d399';
            }
          } else {
            if (submitStatusMsg) {
              submitStatusMsg.textContent = resData.error || 'Failed to record score.';
              submitStatusMsg.style.color = '#f87171';
            }
          }
        })
        .catch((err) => {
          console.error('Score submission error:', err);
          if (submitStatusMsg) {
            submitStatusMsg.textContent = 'Network error saving score.';
            submitStatusMsg.style.color = '#f87171';
          }
        });
    }

    // Button Listeners
    if (hudPauseBtn) {
      hudPauseBtn.addEventListener('click', () => {
        engine.togglePause();
      });
    }

    if (hudRestartBtn) {
      hudRestartBtn.addEventListener('click', () => {
        if (confirm('Restart current realm from the beginning?')) {
          engine.restart();
        }
      });
    }

    if (hudSoundBtn) {
      hudSoundBtn.addEventListener('click', () => {
        if (window.SoundManager) {
          SoundManager.toggleMute();
          updateSoundBtn();
        }
      });
    }

    if (btnResumeGame) {
      btnResumeGame.addEventListener('click', () => {
        engine.resume();
      });
    }

    if (btnPauseRestart) {
      btnPauseRestart.addEventListener('click', () => {
        engine.restart();
      });
    }

    if (btnGameoverRetry) {
      btnGameoverRetry.addEventListener('click', () => {
        engine.restart();
      });
    }

    if (btnVictoryReplay) {
      btnVictoryReplay.addEventListener('click', () => {
        engine.restart();
      });
    }

    if (btnSaveScore && playerNameInput) {
      btnSaveScore.addEventListener('click', () => {
        if (lastCompletedRun) {
          submitScoreRun(lastCompletedRun);
        }
      });
    }

    // Virtual Touch Controls
    const touchBtnLeft = document.getElementById('touch-btn-left');
    const touchBtnRight = document.getElementById('touch-btn-right');
    const touchBtnJump = document.getElementById('touch-btn-jump');

    function bindTouchButton(btn, keyName) {
      if (!btn) return;

      const down = (e) => {
        e.preventDefault();
        engine.setTouchKey(keyName, true);
      };
      const up = (e) => {
        e.preventDefault();
        engine.setTouchKey(keyName, false);
      };

      btn.addEventListener('touchstart', down, { passive: false });
      btn.addEventListener('touchend', up, { passive: false });
      btn.addEventListener('touchcancel', up, { passive: false });
      btn.addEventListener('mousedown', down);
      btn.addEventListener('mouseup', up);
      btn.addEventListener('mouseleave', up);
    }

    bindTouchButton(touchBtnLeft, 'left');
    bindTouchButton(touchBtnRight, 'right');
    bindTouchButton(touchBtnJump, 'jump');

    // Canvas click to focus
    canvas.addEventListener('click', () => {
      canvas.focus();
    });

    // Start Game Engine
    engine.start();
    canvas.focus();
  });
})();
