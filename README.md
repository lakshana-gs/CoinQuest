# 🪙 Coin Quest — 2D Platform Adventure

A vibrant, fast-paced 2D platform adventure game built with **Django**, **HTML5 Canvas**, and **Vanilla JavaScript**.

Leap across floating platforms, snatch gleaming gold coins, dodge sharp crystalline spikes and patrolling sentries, and enter the mystic exit portal to unlock new realms!

---

## 🎮 Game Features

- **60 FPS Canvas Physics Engine**: Responsive movement, gravity, variable jump height, coyote time, and jump buffering.
- **5 Handcrafted Realms**:
  - **Level 1 (Verdant Groves)**: Tutorial jumps and accessible coins.
  - **Level 2 (Crystal Caverns)**: Wider chasms and sharp floor spikes.
  - **Level 3 (Molten Core)**: Moving platforms and patrolling lava slimes.
  - **Level 4 (Stormy Peaks)**: High-altitude narrow ledges and patrol drones.
  - **Level 5 (The Neon Citadel)**: Cyber gauntlet over the abyss with multiple sentries.
- **Synthesized 8-Bit Audio**: Web Audio API synthesizer for jump sweeps, coin chimes, damage buzzes, and triumph fanfares without external audio files.
- **Server-Side Validation**: Authoritative score calculations and progression unlocks.
- **Responsive Controls**: Full keyboard support and ergonomic on-screen touch controls for mobile.

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Move Left / Right** | <kbd>A</kbd> / <kbd>D</kbd> or <kbd>←</kbd> / <kbd>→</kbd> | **◀** / **▶** buttons |
| **Jump** | <kbd>Space</kbd> / <kbd>W</kbd> / <kbd>↑</kbd> | **▲ JUMP** button |
| **Pause / Resume** | <kbd>ESC</kbd> or <kbd>P</kbd> | ⏸️ button |
| **Restart Level** | <kbd>R</kbd> | 🔄 button |
| **Mute / Unmute** | <kbd>M</kbd> | 🔊 button |

---

## 🚀 Running Locally (Django)

1. **Activate virtual environment:**
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

2. **Run migrations and seed default levels:**
   ```powershell
   python manage.py migrate
   ```

3. **Start the local server:**
   ```powershell
   python manage.py runserver 127.0.0.1:8080 --noreload
   ```

4. **Open in browser:**
   ```text
   http://127.0.0.1:8080/
   ```

5. **Run automated test suite:**
   ```powershell
   python manage.py test
   ```

---

## 🌐 Deployment Options

This repository is pre-configured for **both** GitHub Pages (instant static hosting) and Cloud Hosting (Full Django backend):

### Option 1: Deploy Instantly to GitHub Pages (Free)

The repository includes a ready-to-run static build in the [`docs/`](docs/) folder with browser `localStorage` saving for levels and high scores!

1. **Initialize Git & Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial release of Coin Quest"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - In your GitHub repository, click **Settings** → **Pages** (in the left sidebar).
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Under **Branch**, select **`main`** (or `master`) and change the folder from `/(root)` to **`/docs`**.
   - Click **Save**.

3. **Play Online:**
   Within 1 minute, your game will be live at:
   `https://<your-username>.github.io/<your-repo-name>/`

---

### Option 2: Deploy to Vercel (1-Click Free Hosting)

The repository includes [`vercel.json`](vercel.json) and `.vercelignore` pre-configured for Vercel's Python serverless runtime.

1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** → **Project**.
3. Select your `CoinQuest` repository (`lakshana-gs/CoinQuest`).
4. Click **Deploy**. Vercel will build the serverless functions and provide your live URL!

---

### Option 3: Deploy Full Django Backend (Render / Railway)

The project includes `requirements.txt`, `Procfile`, `render.yaml`, and `whitenoise` for static file compression.

#### Deploy on Render (Free)
1. Push your code to GitHub.
2. Go to [Render.com](https://render.com) and log in with your GitHub account.
3. Click **New +** → **Blueprint** and select your `CoinQuest` repository.
4. Render will automatically read `render.yaml`, install dependencies, run migrations, collect static files, and launch your live Django app!

