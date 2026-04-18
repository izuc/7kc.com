# 7KC Admin Guide

Day-two operations: backups, secret rotation, resetting users, DB introspection.

## First-time install

```bash
php install.php
```

The installer is idempotent — safe to re-run. `--check` just validates the environment, `--reset` drops and recreates the database.

```bash
php install.php --check
php install.php --driver=sqlite --yes --no-frontend
php install.php --driver=mysql --db-user=root --db-pass=secret --frontend-url=https://7kc.com
php install.php --reset     # ⚠ drops the DB
```

## Backups

### SQLite
```bash
cp backend/var/sevenkc.sqlite backups/sevenkc-$(date +%F_%H%M).sqlite
```
Run via cron nightly; rotate with `find backups -name 'sevenkc-*.sqlite' -mtime +30 -delete`.

### MySQL
```bash
mysqldump --single-transaction --routines sevenkc > backups/sevenkc-$(date +%F).sql
gzip backups/sevenkc-$(date +%F).sql
```

## Rotating the JWT secret

Generate a new secret and write it to `.env`:
```bash
php -r "echo rtrim(strtr(base64_encode(random_bytes(40)),'+/','-_'),'=');" > /tmp/secret
```
Replace `JWT_SECRET` in `backend/.env` and restart. **All existing sessions invalidate** — users must log back in. Schedule quarterly, or immediately on suspected leak.

## Common SQL recipes

### How many users are on the pantry step?
```sql
SELECT
  (SELECT COUNT(*) FROM users) AS total,
  (SELECT COUNT(DISTINCT owner_user_id) FROM pantry_items) AS with_pantry,
  (SELECT COUNT(DISTINCT user_id) FROM cooked_meals) AS have_cooked,
  (SELECT COUNT(*) FROM users WHERE group_id IS NOT NULL) AS in_group;
```

### Most-cooked recipes this month
```sql
SELECT r.title, COUNT(*) AS times_cooked
FROM cooked_meals cm
JOIN recipes r ON r.id = cm.recipe_id
WHERE cm.cooked_at > UNIX_TIMESTAMP() - 2592000
GROUP BY r.id
ORDER BY times_cooked DESC
LIMIT 20;
```

### Trending public recipe pages
```sql
SELECT slug, title, view_count
FROM recipes
WHERE is_custom = 0 AND view_count > 0
ORDER BY view_count DESC
LIMIT 20;
```

## Managing users

### Reset a user's password
```sql
UPDATE users
SET password_hash = '$2y$10$...'   -- generate with PHP: password_hash('newpass', PASSWORD_BCRYPT)
WHERE email = 'user@example.com';
```

Quick helper:
```bash
php -r "echo password_hash('newpass', PASSWORD_BCRYPT), PHP_EOL;"
```

### Unlock a user stuck in a full group
```sql
UPDATE users SET group_id = NULL WHERE email = 'user@example.com';
DELETE FROM group_members WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com');
```

### Delete a user (hard)
```sql
SET @uid = (SELECT id FROM users WHERE email = 'user@example.com');

DELETE FROM suggestion_comments WHERE user_id = @uid;
DELETE FROM suggestion_likes WHERE user_id = @uid;
DELETE FROM meal_suggestions WHERE suggested_by_user_id = @uid;
DELETE FROM group_feed_events WHERE user_id = @uid;
DELETE FROM cooked_meals WHERE user_id = @uid;
DELETE FROM pantry_items WHERE owner_user_id = @uid;
DELETE FROM shopping_list_items WHERE added_by_user_id = @uid;
DELETE FROM shopping_lists WHERE owner_user_id = @uid;
DELETE FROM group_members WHERE user_id = @uid;
DELETE FROM recipes WHERE owner_user_id = @uid;
DELETE FROM users WHERE id = @uid;
```

## Retailer / affiliate admin

### Enable an affiliate partner
```sql
UPDATE retailers
SET affiliate_id = 'your-tag-here', enabled = 1
WHERE id = 'woolworths';
```

### Add a new retailer
```sql
INSERT INTO retailers (id, display, region, basket_url_template, affiliate_id, enabled, sort_order)
VALUES ('uber_eats', 'Uber Eats Grocery', 'AU',
        'https://www.ubereats.com/au/search?q={query}', NULL, 1, 5);
```

## Sponsored recipe placement

```sql
UPDATE recipes
SET sponsored_by = 'Coles Fresh',
    sponsored_url = 'https://coles.com.au/campaign/7kc'
WHERE slug = 'sunday-roast-chook';
```

## Health check

```bash
curl http://localhost:8000/                     # {"name":"7KC API","version":"v1"}
curl http://localhost:8000/api/v1/ingredients   # 100+ items
curl http://localhost:8000/sitemap.xml          # urlset with every recipe
```

## Log locations

- PHP dev server: stdout / captured via systemd journal
- Production: your web server's error log; `$settings['app']['debug']` = `true` puts traces in API responses — **switch off in prod**
- Frontend: browser console for PWA / service worker issues; check Application → Service Workers in DevTools

## Updating after a git pull

```bash
git pull
cd backend && composer install --no-dev
composer migrate
cd ../frontend && npm install && npm run build
# restart PHP, flush Cloudflare cache if applicable
```

The service worker will auto-update on next visit (registerType: `autoUpdate`).
