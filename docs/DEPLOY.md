# Deploy

## Backend (PHP 8.2+)

Any PHP host that supports Slim will work: shared hosting with `.htaccess` rewrite, a DigitalOcean droplet, Hetzner, Fly.io, Render, etc.

Requirements:
- PHP 8.2 with `pdo_mysql` (and/or `pdo_sqlite`) and `json` extensions
- Composer
- (Optional) MySQL 8+

Steps:

```bash
cd backend
composer install --no-dev --optimize-autoloader
cp .env.example .env && $EDITOR .env
composer migrate
composer seed
```

Then point your web server's document root at `backend/public/`. The included `.htaccess` handles URL rewriting on Apache. For Nginx, drop in:

```
location / {
  try_files $uri /index.php$is_args$args;
}
location ~ \.php$ {
  fastcgi_pass unix:/run/php/php8.2-fpm.sock;
  fastcgi_index index.php;
  include fastcgi_params;
  fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

SQLite mode stores the database at `backend/var/sevenkc.sqlite` by default. Make sure that directory is writable by the web user. Back it up like any other file.

MySQL mode: create the database (`CREATE DATABASE sevenkc CHARACTER SET utf8mb4;`), then `composer migrate && composer seed`.

### Secrets

- **`JWT_SECRET`** — at least 32 bytes of entropy. Rotating invalidates all sessions.
- **`CORS_ALLOW_ORIGIN`** — set to your frontend's origin in production (e.g. `https://7kc.com`).

## Frontend

Build static assets:

```bash
cd frontend
npm install
VITE_API_URL=https://api.7kc.com/api/v1 npm run build
```

Deploy the `dist/` folder to any static host — Cloudflare Pages, Netlify, Vercel, S3 + CloudFront, nginx.

PWA behaviour:
- Service worker is registered with `autoUpdate` — users get the new build on their next visit after deploy.
- Ingredient/recipe reads use `StaleWhileRevalidate` so browsing recipes works offline.
- Shopping list mutations require network; queue support is planned in Phase 5.

## Database migrations

Phinx handles both MySQL and SQLite with the same migration file. To apply pending migrations on an existing install:

```bash
composer migrate
```

Rollback (if you need to):

```bash
cd backend
vendor/bin/phinx rollback -c config/phinx.php
```

## Backups

- SQLite: `cp backend/var/sevenkc.sqlite backups/sevenkc-$(date +%F).sqlite`
- MySQL: `mysqldump sevenkc > backups/sevenkc-$(date +%F).sql`

Schedule via cron; retain 30 days.
