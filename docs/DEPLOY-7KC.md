# Deploying 7kc.com (single domain: SPA at `/`, API at `/api`)

This is the concrete recipe for hosting the whole app on one domain — the React
app served at `https://7kc.com/` and the PHP API answering under
`https://7kc.com/api` on the same origin (so there's no CORS to configure).

## Final layout on the web root

```
<web root of 7kc.com>/
├── index.html            ┐
├── assets/               │
├── r/  collection/       ├─ everything from frontend/dist/  (the built app)
├── sw.js  manifest…      │
├── .htaccess             ┘  ← ships inside the build; routes /api and the SPA
└── api/                  ← the whole backend/ folder (entry: api/public/index.php)
    ├── public/index.php
    ├── vendor/ config/ src/ db/ var/ .env
    └── …
```

The bundled `.htaccess` sends every `/api/...` request to `api/public/index.php`
without changing the URL, so Slim's routes (grouped under `/api/v1`) match with
no base-path config. It also means a direct request to `api/.env`, `api/config`
or `api/vendor` is handed to Slim and 404s — the backend internals are shielded.

## 1. Frontend (already built)

The production build is in **`frontend/dist/`** — built with the API base set to
the relative `/api/v1`, so it works on whatever host serves it. Just upload the
**contents** of `frontend/dist/` to the web root (including the hidden
`.htaccess`).

To rebuild later: `cd frontend && npm run build` (uses `.env.production`).

## 2. Backend

Copy the **whole `backend/` folder** to `<web root>/api/`, then:

```bash
cd <web root>/api
composer install --no-dev --optimize-autoloader   # if the host has Composer
cp .env.example .env
```

No Composer on the host? Upload your local `backend/vendor/` along with the rest
(it works, it just also carries the dev tools).

Edit `api/.env` for production:

```ini
APP_ENV=production
APP_DEBUG=false

# MySQL (recommended for a live site)
DB_DRIVER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=sevenkc
DB_USER=<db user>
DB_PASS=<db password>
# …or SQLite (zero-config): DB_DRIVER=sqlite  (writes api/var/sevenkc.sqlite)

JWT_SECRET=<paste 40+ random chars>          # e.g. `openssl rand -base64 40`
CORS_ALLOW_ORIGIN=https://7kc.com            # same-origin, but set it anyway

# Optional AI photo scanning — leave blank to keep it off (the app hides the
# AI options). A localhost LM Studio/Ollama only works if it's reachable from
# THIS server; a remote box needs a routable endpoint.
AI_SCAN_ENDPOINT=
AI_SCAN_MODEL=
AI_SCAN_ENABLED=true
```

Then create the schema + seed the 1000 recipes, and make the data dir writable:

```bash
cd <web root>/api
php vendor/bin/phinx migrate -c config/phinx.php
php vendor/bin/phinx seed:run -c config/phinx.php
chmod -R u+w var                             # SQLite/db + cache need to be writable
```

(For MySQL, create the database first: `CREATE DATABASE sevenkc CHARACTER SET utf8mb4;`)

## 3. Verify

- `https://7kc.com/` → the app loads.
- `https://7kc.com/api/v1/public/recipes` → JSON with 1000 recipes.
- `https://7kc.com/r/spaghetti-bolognese` → a prerendered recipe page.
- `https://7kc.com/api/.env` → a 404 (not the file), confirming the shield works.

## Notes

- **Same server only** — the `.htaccess` assumes Apache with `mod_rewrite`. On
  Nginx, route `location /api { try_files $uri /api/public/index.php$is_args$args; }`
  and add the usual SPA `try_files $uri /index.html;` for everything else.
- **HTTPS**: serve over TLS; the PWA/service worker requires it in production.
- **Redeploys**: overwrite `dist/*`; the service worker auto-updates on next visit.
  `index.html`/`sw.js` are sent `no-cache` (see the `.htaccess`) so updates land fast.
