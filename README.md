# Rhythm.play — Phonk Chase

An original **mouse-and-touch cursor chase** arcade, not a four-lane rhythm game. Moving, glowing dots enter the screen from all four sides. Move the cursor into them to collect points. On mobile, drag a finger through the dots. No clicking and no D/F/J/K timing controls.

## Features

- **Moving targets** with curved paths, off-screen entrances, beat-paced spawning, changing speed, and collectible collisions.
- **Cursor collision detection**, including sweeping through targets between pointer events. On touch devices, drag across the canvas.
- **Original drift-phonk-style soundtrack** made at runtime using Web Audio, with a 150 BPM dark cowbell melody, kick, distorted 808-style bass, claps and hats. No prerecorded or copyrighted songs.
- **Scoring** for collected dots, consecutive-hit combos, accuracy, missed targets, letter grades, and personal bests.
- **Monochrome interface** with focused colored note dots and additive bloom. No rainbow backgrounds, no neon gradients on normal panels.
- **Pause/resume** by Space or the pause control. Browser audio is synced to the game timeline and pauses with gameplay.
- **Skin shop**, earnable coins, player profile, local score history, and a Zuzify Supabase global leaderboard.
- **Mobile responsive** playfield, touch input, fullscreen button, and reduced-motion support.
- Static HTML/CSS/JavaScript, no dependencies or audio downloads.

## Controls

| Input | Action |
|---|---|
| Move mouse | Move the targeting ring; touch dots to collect |
| Touch and drag | Collect dots on a phone or tablet |
| Space | Pause / resume |
| Pause button | Pause / resume |
| Fullscreen | Expand the playfield |

The game starts its original audio when you click the Start button, according to browser audio-autoplay rules. **The gameplay itself does not require clicking.**

## Running and deploying

Open `index.html` in a modern browser, or run `python -m http.server 8000` in the repository and open http://localhost:8000.

For Vercel, connect this GitHub repository, choose Framework Preset **Other**, keep the project root as the Root Directory, and leave the Build Command empty. The app can be hosted as plain static assets.

Run the zero-dependency test with `node scripts/check.mjs`. It is also part of the GitHub Actions workflow.

## Zuzify Supabase integration

Uses the existing project **zuzify**. All game-specific tables use the `rhythm_` prefix.

- `rhythm_scores`: globally readable, guest-submitted scores. Entries for the new phonk game use track `Midnight Run`. Old `Neon Side Street` entries are retained, but filtered out of the new leaderboards.
- `rhythm_skins`: server-managed, publicly readable skin catalog (clients cannot alter prices).
- Browser-safe public URL and **publishable** key are in `config.js`. Do not add service-role keys or private credentials.

Server constraints and RLS are enabled. Guest scores are **unverified** because the browser reports the result. Do not use global rankings as a basis for cash prizes, valuable items, or high-stakes competition without authenticated server-side verification and rate limiting.

Coins and purchased cosmetic skins are currently saved in localStorage on each device. They do not sync to the database or other devices; secure shared wallets require account authentication and server-authoritative accounting.

## File layout

- `index.html` — redesigned phonk arcade markup
- `cursor-style.css` — clean black-and-white responsive interface
- `cursor-game.js` — procedural original phonk audio, animation, cursor collision game, HUD
- `rhythmplus.js` — skins, coins, profile, local/global rankings
- `rhythmplus.css` — skins, profile, and leaderboard components
- `config.js` — Zuzify Supabase public configuration
- `supabase/schema.sql` — `rhythm_` tables and row-level-security policies
- `scripts/check.mjs` — syntax and startup validation
- `.github/workflows/ci.yml` — CI verification on push

© 2026 Rhythm.play. Original music and game assets.
