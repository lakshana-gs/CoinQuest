/**
 * Coin Quest — Core Canvas 2D Platform Engine
 * 60 FPS deterministic physics, procedural vector adventurer,
 * particles, moving platforms, patrol enemies, coins, and portal.
 */

(function () {
  'use strict';

  class CoinQuestEngine {
    constructor(canvas, levelMeta, onGameEvent) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.levelMeta = levelMeta;
      this.onGameEvent = onGameEvent || function () {};

      // Load specific level config from LevelData or generate sensible fallback
      const lvlNum = levelMeta.levelNumber || 1;
      this.level = (window.LevelData && window.LevelData[lvlNum]) || window.LevelData[1];

      // Game state
      this.state = 'PLAYING'; // 'PLAYING', 'PAUSED', 'LEVEL_CLEARED', 'GAME_OVER'
      this.elapsedTime = 0;
      this.coinsCollected = 0;
      this.score = 0;
      this.lives = 3;

      // Camera
      this.camera = { x: 0, y: 0 };

      // Particles & floating popups
      this.particles = [];
      this.floatingTexts = [];

      // Background stars
      this.stars = this.generateStars(60);

      // Input keys
      this.keys = {
        left: false,
        right: false,
        jump: false,
        jumpPressedThisFrame: false
      };

      // Virtual / Touch keys
      this.touchKeys = {
        left: false,
        right: false,
        jump: false
      };

      // Player setup
      this.initPlayer();

      // Deep copy platforms, coins, and hazards so resets don't mutate base data
      this.initLevelEntities();

      // Animation loop handle
      this.lastTime = performance.now();
      this.animationFrameId = null;

      // Bind input events
      this.bindInputs();
    }

    initPlayer() {
      const spawn = this.level.spawn || { x: 100, y: 400 };
      this.player = {
        x: spawn.x,
        y: spawn.y,
        w: 26,
        h: 38,
        vx: 0,
        vy: 0,
        speed: 5.6,
        accel: 0.9,
        friction: 0.82,
        airFriction: 0.92,
        gravity: 0.52,
        jumpStrength: -11.2,
        isGrounded: false,
        facing: 1, // 1: right, -1: left
        walkCycle: 0,
        coyoteTimer: 0,
        jumpBufferTimer: 0,
        jumpHeld: false,
        invulnerableTimer: 0,
        squashY: 1,
        stretchX: 1,
        ridingPlatform: null
      };
    }

    initLevelEntities() {
      // Clone platforms
      this.platforms = JSON.parse(JSON.stringify(this.level.platforms || []));
      this.platforms.forEach((p) => {
        p.startX = p.x;
        p.startY = p.y;
        p.timeOffset = Math.random() * 10;
      });

      // Clone coins
      this.coins = JSON.parse(JSON.stringify(this.level.coins || []));
      this.coins.forEach((c) => {
        c.collected = false;
        c.baseY = c.y;
        c.animOffset = Math.random() * Math.PI * 2;
      });

      // Clone hazards
      this.hazards = JSON.parse(JSON.stringify(this.level.hazards || []));
      this.hazards.forEach((h) => {
        if (h.type === 'patrol') {
          h.dir = 1;
        }
      });

      // Portal setup
      this.portal = Object.assign({}, this.level.portal);
      this.portal.angle = 0;
      this.portal.active = false;
    }

    generateStars(count) {
      const stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          radius: Math.random() * 1.6 + 0.5,
          twinkle: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.05 + 0.02
        });
      }
      return stars;
    }

    bindInputs() {
      this.keyDownHandler = (e) => {
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
          if (!this.keys.jump) {
            this.keys.jumpPressedThisFrame = true;
            this.player.jumpBufferTimer = 8; // Buffer jump for ~8 frames
          }
          this.keys.jump = true;
        }
        if (e.code === 'Escape' || e.code === 'KeyP') {
          this.togglePause();
        }
        if (e.code === 'KeyR') {
          this.restart();
        }
      };

      this.keyUpHandler = (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
          this.keys.jump = false;
          // Variable jump: cut upward velocity if released early
          if (this.player.vy < -3.5) {
            this.player.vy *= 0.5;
          }
        }
      };

      window.addEventListener('keydown', this.keyDownHandler);
      window.addEventListener('keyup', this.keyUpHandler);
    }

    setTouchKey(key, isDown) {
      if (this.touchKeys.hasOwnProperty(key)) {
        this.touchKeys[key] = isDown;
        if (key === 'jump' && isDown) {
          this.player.jumpBufferTimer = 8;
        } else if (key === 'jump' && !isDown) {
          if (this.player.vy < -3.5) {
            this.player.vy *= 0.5;
          }
        }
      }
    }

    start() {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      if (!this.animationFrameId) {
        this.loop = this.loop.bind(this);
        this.animationFrameId = requestAnimationFrame(this.loop);
      }
    }

    pause() {
      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
        this.onGameEvent('PAUSED', {
          score: this.score,
          coins: this.coinsCollected,
          time: this.elapsedTime
        });
      }
    }

    resume() {
      if (this.state === 'PAUSED') {
        this.state = 'PLAYING';
        this.lastTime = performance.now();
        this.onGameEvent('RESUMED', {});
      }
    }

    togglePause() {
      if (this.state === 'PLAYING') this.pause();
      else if (this.state === 'PAUSED') this.resume();
    }

    restart() {
      this.state = 'PLAYING';
      this.elapsedTime = 0;
      this.coinsCollected = 0;
      this.score = 0;
      this.lives = 3;
      this.particles = [];
      this.floatingTexts = [];
      this.initPlayer();
      this.initLevelEntities();
      this.lastTime = performance.now();
      this.onGameEvent('RESTARTED', {
        lives: this.lives,
        coins: this.coinsCollected,
        score: this.score
      });
    }

    destroy() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      window.removeEventListener('keydown', this.keyDownHandler);
      window.removeEventListener('keyup', this.keyUpHandler);
    }

    loop(currentTime) {
      const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05); // Cap to 50ms to prevent spiral of death
      this.lastTime = currentTime;

      if (this.state === 'PLAYING') {
        this.update(dt);
      }

      this.render();

      this.animationFrameId = requestAnimationFrame(this.loop);
    }

    update(dt) {
      this.elapsedTime += dt;
      const p = this.player;

      // Update Invulnerability
      if (p.invulnerableTimer > 0) {
        p.invulnerableTimer -= dt;
      }

      // Update Moving Platforms
      this.updateMovingPlatforms(dt);

      // Handle Horizontal Movement Inputs
      const moveLeft = this.keys.left || this.touchKeys.left;
      const moveRight = this.keys.right || this.touchKeys.right;
      const jumpInput = this.keys.jump || this.touchKeys.jump;

      if (moveLeft && !moveRight) {
        p.vx -= p.accel;
        if (p.vx < -p.speed) p.vx = -p.speed;
        p.facing = -1;
        p.walkCycle += 0.25;
        if (p.isGrounded && Math.random() < 0.25) {
          this.addDustParticle(p.x + p.w / 2, p.y + p.h, 1, -0.5);
        }
      } else if (moveRight && !moveLeft) {
        p.vx += p.accel;
        if (p.vx > p.speed) p.vx = p.speed;
        p.facing = 1;
        p.walkCycle += 0.25;
        if (p.isGrounded && Math.random() < 0.25) {
          this.addDustParticle(p.x + p.w / 2, p.y + p.h, -1, -0.5);
        }
      } else {
        // Friction
        const fric = p.isGrounded ? p.friction : p.airFriction;
        p.vx *= fric;
        if (Math.abs(p.vx) < 0.1) p.vx = 0;
      }

      // Coyote time & Jump Buffering
      if (p.isGrounded) {
        p.coyoteTimer = 6; // 6 frames allowance
      } else if (p.coyoteTimer > 0) {
        p.coyoteTimer--;
      }

      if (p.jumpBufferTimer > 0) {
        p.jumpBufferTimer--;
      }

      // Execute Jump if buffered and within coyote time
      if ((p.jumpBufferTimer > 0 || (jumpInput && !p.jumpHeld)) && p.coyoteTimer > 0) {
        p.vy = p.jumpStrength;
        p.isGrounded = false;
        p.coyoteTimer = 0;
        p.jumpBufferTimer = 0;
        p.squashY = 1.3;
        p.stretchX = 0.8;
        if (window.SoundManager) SoundManager.playJump();
        // Jump burst particles
        for (let i = 0; i < 6; i++) {
          this.addDustParticle(p.x + p.w / 2 + (Math.random() - 0.5) * 16, p.y + p.h, (Math.random() - 0.5) * 2, -Math.random() * 2);
        }
      }
      p.jumpHeld = jumpInput;

      // Apply Gravity
      p.vy += p.gravity;
      if (p.vy > 12) p.vy = 12; // Terminal velocity

      // If riding a moving platform, translate by its delta
      if (p.ridingPlatform && p.isGrounded) {
        p.x += p.ridingPlatform.dx || 0;
        p.y += p.ridingPlatform.dy || 0;
      }
      p.ridingPlatform = null; // will be re-assigned in collision if still touching

      // Horizontal Collision & Movement
      p.x += p.vx;
      this.handleHorizontalCollisions();

      // Vertical Collision & Movement
      const wasGrounded = p.isGrounded;
      p.isGrounded = false;
      p.y += p.vy;
      this.handleVerticalCollisions();

      // Squash on landing
      if (!wasGrounded && p.isGrounded) {
        p.squashY = 0.75;
        p.stretchX = 1.25;
        for (let i = 0; i < 4; i++) {
          this.addDustParticle(p.x + p.w / 2 + (Math.random() - 0.5) * 12, p.y + p.h, (Math.random() - 0.5) * 3, -Math.random() * 1.5);
        }
      }

      // Ease squash and stretch back to 1.0
      p.squashY += (1 - p.squashY) * 0.2;
      p.stretchX += (1 - p.stretchX) * 0.2;

      // Check Fall Into Abyss
      if (p.y > this.level.worldHeight + 80) {
        this.handlePlayerDamage('Fell into the abyss');
        // Respawn player
        p.x = this.level.spawn.x;
        p.y = this.level.spawn.y;
        p.vx = 0;
        p.vy = 0;
      }

      // Update Hazards (Patrols)
      this.updateHazards(dt);

      // Check Hazard Collisions
      this.checkHazardCollisions();

      // Check Coin Collisions
      this.checkCoinCollisions();

      // Check Exit Portal
      this.updateAndCheckPortal(dt);

      // Smooth Camera Tracking (Lerp)
      this.updateCamera();

      // Update Particles & Floating Text
      this.updateParticles(dt);

      // Notify UI of HUD changes
      this.onGameEvent('HUD_UPDATE', {
        lives: this.lives,
        coins: this.coinsCollected,
        targetCoins: this.level.targetCoins,
        totalCoins: this.level.totalCoins,
        score: this.score,
        time: this.elapsedTime
      });
    }

    updateMovingPlatforms(dt) {
      this.platforms.forEach((plat) => {
        if (plat.type === 'moving') {
          const oldX = plat.x;
          const oldY = plat.y;
          plat.timeOffset += dt;

          if (plat.vx && plat.rangeX) {
            plat.x = plat.startX + Math.sin(plat.timeOffset * plat.vx) * plat.rangeX;
          }
          if (plat.vy && plat.rangeY) {
            plat.y = plat.startY + Math.sin(plat.timeOffset * plat.vy) * plat.rangeY;
          }

          plat.dx = plat.x - oldX;
          plat.dy = plat.y - oldY;
        }
      });
    }

    handleHorizontalCollisions() {
      const p = this.player;
      // World boundary constraints
      if (p.x < 0) {
        p.x = 0;
        p.vx = 0;
      } else if (p.x + p.w > this.level.worldWidth) {
        p.x = this.level.worldWidth - p.w;
        p.vx = 0;
      }

      this.platforms.forEach((plat) => {
        if (plat.type === 'oneway') return; // One-way platforms don't block horizontally

        // AABB test
        if (
          p.x < plat.x + plat.w &&
          p.x + p.w > plat.x &&
          p.y < plat.y + plat.h &&
          p.y + p.h > plat.y
        ) {
          if (p.vx > 0) {
            p.x = plat.x - p.w;
            p.vx = 0;
          } else if (p.vx < 0) {
            p.x = plat.x + plat.w;
            p.vx = 0;
          }
        }
      });
    }

    handleVerticalCollisions() {
      const p = this.player;

      this.platforms.forEach((plat) => {
        // Horizontal overlap
        const overlapsX = p.x + p.w - 4 > plat.x && p.x + 4 < plat.x + plat.w;
        if (!overlapsX) return;

        if (plat.type === 'oneway') {
          // Landing from above onto one-way platform
          const feetPreviousY = p.y - p.vy + p.h;
          if (p.vy >= 0 && feetPreviousY <= plat.y + 8 && p.y + p.h >= plat.y) {
            p.y = plat.y - p.h;
            p.vy = 0;
            p.isGrounded = true;
            p.ridingPlatform = plat;
          }
        } else {
          // Solid / Moving platform
          if (
            p.x < plat.x + plat.w &&
            p.x + p.w > plat.x &&
            p.y < plat.y + plat.h &&
            p.y + p.h > plat.y
          ) {
            if (p.vy > 0) {
              // Landing on top
              p.y = plat.y - p.h;
              p.vy = 0;
              p.isGrounded = true;
              p.ridingPlatform = plat;
            } else if (p.vy < 0) {
              // Head hit ceiling
              p.y = plat.y + plat.h;
              p.vy = 0;
            }
          }
        }
      });
    }

    updateHazards(dt) {
      this.hazards.forEach((h) => {
        if (h.type === 'patrol') {
          h.x += (h.speed || 1.2) * (h.dir || 1);
          if (h.x <= h.minX) {
            h.x = h.minX;
            h.dir = 1;
          } else if (h.x + h.w >= h.maxX) {
            h.x = h.maxX - h.w;
            h.dir = -1;
          }
        }
      });
    }

    checkHazardCollisions() {
      const p = this.player;
      if (p.invulnerableTimer > 0) return;

      for (let h of this.hazards) {
        // Generous hitbox inset for fair play feel
        const hBox = {
          x: h.x + 4,
          y: h.y + 4,
          w: h.w - 8,
          h: h.h - 8
        };

        if (
          p.x < hBox.x + hBox.w &&
          p.x + p.w > hBox.x &&
          p.y < hBox.y + hBox.h &&
          p.y + p.h > hBox.y
        ) {
          this.handlePlayerDamage('Hazard hit');
          // Knockback
          p.vy = -7;
          p.vx = (p.x < h.x) ? -5 : 5;
          break;
        }
      }
    }

    handlePlayerDamage(reason) {
      this.lives--;
      this.player.invulnerableTimer = 1.6; // 1.6s invulnerability
      if (window.SoundManager) SoundManager.playHurt();

      // Damage particles
      for (let i = 0; i < 12; i++) {
        this.addSparks(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, '#ef4444');
      }

      if (this.lives <= 0) {
        this.triggerGameOver(reason);
      } else {
        this.onGameEvent('LIFE_LOST', {
          lives: this.lives,
          reason: reason
        });
      }
    }

    checkCoinCollisions() {
      const p = this.player;
      const coinRadius = 14;

      this.coins.forEach((c) => {
        if (c.collected) return;

        // Coin position includes gentle float bob
        const coinY = c.baseY + Math.sin(this.elapsedTime * 3 + c.animOffset) * 4;

        const distX = (p.x + p.w / 2) - c.x;
        const distY = (p.y + p.h / 2) - coinY;
        const distSq = distX * distX + distY * distY;

        if (distSq < (coinRadius + p.w / 2) * (coinRadius + p.w / 2)) {
          c.collected = true;
          this.coinsCollected++;
          this.score += 100;
          if (window.SoundManager) SoundManager.playCoin();

          // Sparkle burst
          for (let i = 0; i < 10; i++) {
            this.addSparks(c.x, coinY, '#fbbf24');
          }

          // Floating score text
          this.addFloatingText(c.x, coinY - 10, '+100', '#fbbf24');

          // Check if portal has just awakened
          if (this.coinsCollected === this.level.targetCoins && !this.portal.active) {
            this.portal.active = true;
            if (window.SoundManager) SoundManager.playPortalActive();
            this.onGameEvent('PORTAL_ACTIVATED', {
              targetCoins: this.level.targetCoins
            });
          }
        }
      });
    }

    updateAndCheckPortal(dt) {
      this.portal.angle += dt * 2.5;

      // Check if unlocked
      if (this.coinsCollected >= this.level.targetCoins) {
        this.portal.active = true;
      }

      // Collision with player
      if (this.portal.active && this.state === 'PLAYING') {
        const p = this.player;
        const port = this.portal;

        if (
          p.x < port.x + port.w &&
          p.x + p.w > port.x &&
          p.y < port.y + port.h &&
          p.y + p.h > port.y
        ) {
          this.triggerVictory();
        }
      }
    }

    triggerVictory() {
      this.state = 'LEVEL_CLEARED';
      if (window.SoundManager) SoundManager.playLevelClear();

      // Compute run summary
      const parTime = this.level.parTimeSeconds || 60;
      const timeBonus = Math.max(0, Math.floor((parTime * 1.5 - this.elapsedTime) * 10));
      const coinPoints = this.coinsCollected * 100;
      const lifePoints = this.lives * 500;
      const finalScore = coinPoints + lifePoints + timeBonus;

      // Star calculation
      let stars = 1;
      if (this.coinsCollected >= this.level.totalCoins && this.elapsedTime <= parTime) {
        stars = 3;
      } else if (this.coinsCollected >= this.level.targetCoins && this.lives >= 2) {
        stars = 2;
      }

      this.onGameEvent('LEVEL_CLEARED', {
        levelNumber: this.level.levelNumber,
        score: finalScore,
        coinsCollected: this.coinsCollected,
        totalCoins: this.level.totalCoins,
        timeTaken: this.elapsedTime,
        parTime: parTime,
        livesRemaining: this.lives,
        stars: stars
      });
    }

    triggerGameOver(reason) {
      this.state = 'GAME_OVER';
      if (window.SoundManager) SoundManager.playGameOver();
      this.onGameEvent('GAME_OVER', {
        reason: reason,
        coins: this.coinsCollected,
        time: this.elapsedTime,
        score: this.score
      });
    }

    updateCamera() {
      const targetCamX = this.player.x + this.player.w / 2 - this.canvas.width * 0.45;
      const targetCamY = this.player.y + this.player.h / 2 - this.canvas.height * 0.55;

      // Smooth lerp
      this.camera.x += (targetCamX - this.camera.x) * 0.12;
      this.camera.y += (targetCamY - this.camera.y) * 0.12;

      // Clamp camera
      const maxCamX = Math.max(0, this.level.worldWidth - this.canvas.width);
      const maxCamY = Math.max(0, this.level.worldHeight - this.canvas.height);

      if (this.camera.x < 0) this.camera.x = 0;
      if (this.camera.x > maxCamX) this.camera.x = maxCamX;
      if (this.camera.y < 0) this.camera.y = 0;
      if (this.camera.y > maxCamY) this.camera.y = maxCamY;
    }

    addDustParticle(x, y, vx, vy) {
      this.particles.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        radius: Math.random() * 3 + 2,
        color: 'rgba(255, 255, 255, 0.4)',
        life: 0.35,
        maxLife: 0.35
      });
    }

    addSparks(x, y, color) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        radius: Math.random() * 2.5 + 1.5,
        color: color,
        life: 0.45,
        maxLife: 0.45
      });
    }

    addFloatingText(x, y, text, color) {
      this.floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        vy: -1.2,
        life: 0.8,
        maxLife: 0.8
      });
    }

    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= dt;
        if (pt.life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y += ft.vy;
        ft.life -= dt;
        if (ft.life <= 0) {
          this.floatingTexts.splice(i, 1);
        }
      }
    }

    // =========================================================================
    // RENDERING
    // =========================================================================

    render() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // 1. Clear Screen & Draw Parallax Sky Background
      this.renderBackground(ctx, w, h);

      // Save context and apply Camera translation for world rendering
      ctx.save();
      ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));

      // 2. Render Platforms
      this.renderPlatforms(ctx);

      // 3. Render Hazards & Enemies
      this.renderHazards(ctx);

      // 4. Render Exit Portal
      this.renderPortal(ctx);

      // 5. Render Collectible Coins
      this.renderCoins(ctx);

      // 6. Render Particles
      this.renderParticles(ctx);

      // 7. Render Player Character
      this.renderPlayer(ctx);

      // 8. Render Floating Texts
      this.renderFloatingTexts(ctx);

      ctx.restore();
    }

    renderBackground(ctx, w, h) {
      const theme = this.level.theme || { bgTop: '#0a0f1d', bgBottom: '#02050c', mountainColor: '#162035' };

      // Vertical Sky Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, theme.bgTop);
      grad.addColorStop(1, theme.bgBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Twinkling stars
      ctx.fillStyle = '#ffffff';
      this.stars.forEach((st) => {
        st.twinkle += st.speed;
        const alpha = 0.3 + Math.sin(st.twinkle) * 0.4;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Parallax Distant Mountain Silhouettes (Layer 1: 0.15x camera speed)
      ctx.save();
      const paraX1 = -(this.camera.x * 0.15) % 400;
      ctx.fillStyle = theme.mountainColor;
      ctx.beginPath();
      ctx.moveTo(-100, h);
      for (let x = -100 + paraX1; x < w + 400; x += 180) {
        ctx.lineTo(x + 90, h - 160 - Math.sin(x) * 40);
        ctx.lineTo(x + 180, h);
      }
      ctx.closePath();
      ctx.fill();

      // Parallax Midground Ridge (Layer 2: 0.3x camera speed)
      const paraX2 = -(this.camera.x * 0.3) % 300;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.moveTo(-100, h);
      for (let x = -100 + paraX2; x < w + 300; x += 120) {
        ctx.lineTo(x + 60, h - 90 - Math.cos(x) * 25);
        ctx.lineTo(x + 120, h);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    renderPlatforms(ctx) {
      const theme = this.level.theme || {};
      const topCol = theme.platformTop || '#10b981';
      const bodyCol = theme.platformBody || '#1e293b';

      this.platforms.forEach((p) => {
        // Platform Body with depth shadow
        ctx.fillStyle = bodyCol;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, [8, 8, 4, 4]);
        ctx.fill();

        // Shaded side bevel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(p.x + p.w - 6, p.y + 8, 6, p.h - 8);

        // Platform Top Surface Strip
        ctx.fillStyle = topCol;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, Math.min(8, p.h), [8, 8, 0, 0]);
        ctx.fill();

        // One-way platform distinct chevron dashes
        if (p.type === 'oneway') {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(p.x + 8, p.y + 4);
          ctx.lineTo(p.x + p.w - 8, p.y + 4);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Moving platform indicator arrows
        if (p.type === 'moving') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.beginPath();
          ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    renderHazards(ctx) {
      this.hazards.forEach((h) => {
        if (h.type === 'spike') {
          // Sharp triangular spikes
          const count = Math.max(1, Math.floor(h.w / 16));
          const toothW = h.w / count;
          ctx.fillStyle = '#ef4444';

          for (let i = 0; i < count; i++) {
            const sx = h.x + i * toothW;
            ctx.beginPath();
            if (h.direction === 'down') {
              ctx.moveTo(sx, h.y);
              ctx.lineTo(sx + toothW / 2, h.y + h.h);
              ctx.lineTo(sx + toothW, h.y);
            } else {
              ctx.moveTo(sx, h.y + h.h);
              ctx.lineTo(sx + toothW / 2, h.y);
              ctx.lineTo(sx + toothW, h.y + h.h);
            }
            ctx.closePath();
            ctx.fill();

            // Highlight bevel
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath();
            if (h.direction === 'down') {
              ctx.moveTo(sx, h.y);
              ctx.lineTo(sx + toothW / 2, h.y + h.h);
              ctx.lineTo(sx + toothW / 2, h.y);
            } else {
              ctx.moveTo(sx, h.y + h.h);
              ctx.lineTo(sx + toothW / 2, h.y);
              ctx.lineTo(sx + toothW / 2, h.y + h.h);
            }
            ctx.fill();
            ctx.fillStyle = '#ef4444';
          }
        } else if (h.type === 'patrol') {
          // Patrolling Sentry / Slime / Drone
          ctx.save();
          const cx = h.x + h.w / 2;
          const cy = h.y + h.h / 2;

          // Body
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.roundRect(h.x, h.y + 4, h.w, h.h - 4, [10, 10, 6, 6]);
          ctx.fill();

          // Glowing eye that looks in the patrol direction
          const eyeOffsetX = (h.dir || 1) * 4;
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(cx + eyeOffsetX, cy - 2, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(cx + eyeOffsetX + (h.dir || 1) * 2, cy - 2, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Spiky crest or antenna
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.moveTo(cx - 5, h.y + 4);
          ctx.lineTo(cx, h.y - 4);
          ctx.lineTo(cx + 5, h.y + 4);
          ctx.fill();

          ctx.restore();
        }
      });
    }

    renderPortal(ctx) {
      const port = this.portal;
      const cx = port.x + port.w / 2;
      const cy = port.y + port.h / 2;
      const active = port.active;

      ctx.save();

      // Outer Glow
      const glowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 45);
      if (active) {
        glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.7)');
        glowGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.4)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        glowGrad.addColorStop(0, 'rgba(100, 116, 139, 0.3)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 45, 0, Math.PI * 2);
      ctx.fill();

      // Swirling Vortex Rings
      ctx.translate(cx, cy);
      ctx.rotate(port.angle);

      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, port.w * 0.45 - r * 4, port.h * 0.5 - r * 6, (r * Math.PI) / 3, 0, Math.PI * 2);
        ctx.strokeStyle = active ? (r % 2 === 0 ? '#fbbf24' : '#22d3ee') : '#64748b';
        ctx.lineWidth = 3 - r * 0.5;
        ctx.stroke();
      }

      ctx.restore();

      // Status Tag above Portal
      ctx.font = '700 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      if (active) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('PORTAL OPEN!', cx, port.y - 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('▼ ENTER ▼', cx, port.y - 2);
      } else {
        ctx.fillStyle = '#94a3b8';
        const needed = Math.max(0, this.level.targetCoins - this.coinsCollected);
        ctx.fillText(`LOCKED (${needed} more 🪙)`, cx, port.y - 8);
      }
    }

    renderCoins(ctx) {
      this.coins.forEach((c) => {
        if (c.collected) return;

        const cy = c.baseY + Math.sin(this.elapsedTime * 3 + c.animOffset) * 4;

        ctx.save();
        ctx.translate(c.x, cy);

        // 3D rotation scale
        const scaleX = Math.abs(Math.cos(this.elapsedTime * 4 + c.animOffset));
        ctx.scale(Math.max(0.15, scaleX), 1.0);

        // Coin Shadow / Glow
        ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
        ctx.shadowBlur = 8;

        // Coin Rim
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        // Coin Face
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        // Inner Emboss Star
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });
    }

    renderPlayer(ctx) {
      const p = this.player;

      // Invulnerability flicker
      if (p.invulnerableTimer > 0 && Math.floor(this.elapsedTime * 15) % 2 === 0) {
        return; // skip frame to blink
      }

      ctx.save();

      // Ground Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(p.x + p.w / 2, p.y + p.h + 2, p.w * 0.6, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Position & Squash / Stretch
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h; // anchor at feet
      ctx.translate(cx, cy);
      ctx.scale(p.stretchX, p.squashY);

      // Facing Direction (-1 or 1)
      ctx.scale(p.facing, 1);

      // Adventurer Body & Cape
      // Flowing Cape
      const capeWave = Math.sin(this.elapsedTime * 10) * (Math.abs(p.vx) > 0.5 ? 6 : 2);
      ctx.fillStyle = '#f59e0b'; // Gold hero cape
      ctx.beginPath();
      ctx.moveTo(-4, -p.h + 14);
      ctx.lineTo(-12 - capeWave, -10);
      ctx.lineTo(-4, -14);
      ctx.closePath();
      ctx.fill();

      // Tunic / Armor
      ctx.fillStyle = '#0284c7'; // Cyan hero suit
      ctx.beginPath();
      ctx.roundRect(-p.w / 2 + 2, -p.h + 12, p.w - 4, p.h - 18, [6, 6, 4, 4]);
      ctx.fill();

      // Belt
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-p.w / 2 + 2, -14, p.w - 4, 4);

      // Belt Buckle
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-2, -14, 4, 4);

      // Head / Hood
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.arc(0, -p.h + 8, 9, 0, Math.PI * 2);
      ctx.fill();

      // Visor / Friendly Eye
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(2, -p.h + 6, 6, 4, [2, 2, 2, 2]);
      ctx.fill();

      // Legs / Feet with running cycle
      const legBob = Math.sin(p.walkCycle) * (Math.abs(p.vx) > 0.5 ? 5 : 0);
      ctx.fillStyle = '#0f172a';
      // Left leg
      ctx.fillRect(-6, -6, 5, 6 + legBob);
      // Right leg
      ctx.fillRect(1, -6, 5, 6 - legBob);

      ctx.restore();
    }

    renderParticles(ctx) {
      this.particles.forEach((pt) => {
        const alpha = pt.life / pt.maxLife;
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
    }

    renderFloatingTexts(ctx) {
      ctx.font = '800 13px Outfit, sans-serif';
      ctx.textAlign = 'center';

      this.floatingTexts.forEach((ft) => {
        const alpha = ft.life / ft.maxLife;
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.globalAlpha = 1.0;
    }
  }

  // Export engine globally
  window.CoinQuestEngine = CoinQuestEngine;
})();
