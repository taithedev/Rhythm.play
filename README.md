# Rhythm.play — Phonk Chase

An original **mouse-and-touch cursor chase** arcade, not a four-lane rhythm game. Moving, glowing dots enter the screen from all four sides. Move the cursor into them to collect points. On mobile, drag a finger through the dots. No clicking and no D/F/J/K timing controls.

## Features

- **Moving targets** with curved paths, off-screen entrances, beat-paced spawning, changing speed, and collectible collisions.
- **Cursor collision detection**, including sweeping through targets between pointer events. On touch devices, drag across the canvas.
- **Original drift-phonk-style soundtrack** made at runtime using Web Audio, with a 150 BPM dark cowbell melody, kick, distorted 808-style bass, claps and hats. No prerecorded or copyrighted songs.
- **Scoring** for collected dots, consecutive-hit combos, accuracy, missed targets, letter grades, and personal bests.
- **Monochrome interface** with focused colored note dots and additive bloom. No rainbow backgrounds, no neon gradients on normal panels.
- **Pause/resume** by Space or the pause control. Browser audio is synced to the game timeline and pauses with gameplay.
- **Skin shop**, earnable coins, player profile, local score history, and a Neon-backed global leaderboard.
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

## Neon leaderboard migration (staged)

This migration branch uses the Neon **Zuzify App Data** project (`young-truth-44623930`), database `zuzify` with the Neon Data API. We created `rhythm_scores` and `rhythm_skins` and copied **1 historical score and 6 skins** from Supabase, preserving their original IDs. The source Supabase database has **not** been deleted or modified.

- `config.js` contains a **public** Neon Data API URL, not a database password or server secret. Only the leaderboard and skins are cloud-backed; coins and progress stay local to the device.
- Scores are guest-supplied and **unverified**; they must not determine real prizes or financial rewards. Public launch should add server-side score validation and rate limiting.
- Before merging, configure Neon Data API CORS for the actual production HTTPS origin, run `node scripts/check.mjs`, and test GET leaderboard, POST score, and GET skins in a browser preview. The live origin was not confirmed in this branch.
- At release time, perform a final delta copy of any new historical Supabase scores, reconcile counts, and only then switch the production frontend. Keep Supabase as rollback until stable.

## File layout

- `index.html` — redesigned phonk arcade markup
- `cursor-style.css` — clean black-and-white responsive interface
- `cursor-game.js` — procedural original phonk audio, animation, cursor collision game, HUD
- `rhythmplus.js` — skins, coins, profile, local/global rankings
- `rhythmplus.css` — skins, profile, and leaderboard components
- `config.js` — public Neon Data API configuration
- `supabase/schema.sql` — archived Supabase schema; Neon schema uses the anonymous role
- `scripts/check.mjs` — syntax and startup validation
- `.github/workflows/ci.yml` — CI verification on push

© 2026 Rhythm.play. Original music and game assets.
