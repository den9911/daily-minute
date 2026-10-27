# Daily Minute

A tiny daily puzzle for everyone. Find the odd word, track your results, and challenge friends.

English, Spanish, and Russian interfaces, selected from browser language preferences or a saved manual choice. Light, dark, and system themes. Independent, lightweight HTML/CSS/JavaScript with no third-party browser dependencies, remote fonts, analytics, or CDN.

## Quick start

Requires Node.js 24+. No install or build step.

```sh
npm start
```

Open http://localhost:3000. The root opens this application; unrelated app routes and APIs are disabled. Data persists in `data/minute.sqlite`.

```sh
npm test
npm run check
```

## Deploy

Set `PUBLIC_ORIGIN` to the exact HTTPS origin, give the process a persistent `DATA_DIR`, and put an HTTPS reverse proxy in front. Example Dockerfile, Caddy config, environment file, and systemd unit are included. Each independent project needs its own port and data directory. `.env` is not loaded automatically: use exported variables or `node --env-file=.env server/index.mjs`. See [OPERATIONS.md](OPERATIONS.md) for backups, moderation, identity limitations, and storage details.

A shared daily 5×5 word puzzle, server-checked attempts, elapsed time, result sharing, and 60 days of browser-local history. The seven word pairs rotate; the timer measures completion without enforcing a one-minute cutoff. This is an entertainment game, not a cheat-proof competition.
