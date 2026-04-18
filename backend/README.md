# 7KC Backend

Slim 4 + Doctrine DBAL + Phinx + Firebase JWT.

```bash
composer install
cp .env.example .env
composer migrate
composer seed
composer serve      # http://localhost:8000
```

## Configuration

`.env` keys:

- `DB_DRIVER` — `sqlite` (default) or `mysql`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` — for MySQL
- `DB_SQLITE_PATH` — for SQLite (default `var/sevenkc.sqlite`)
- `JWT_SECRET` — HS256 secret
- `JWT_TTL_HOURS` — default 168 (7 days)
- `CORS_ALLOW_ORIGIN` — your frontend origin

## Structure

```
src/
├── Action/          one class per HTTP endpoint
├── Domain/Repository/  DBAL-backed repositories
├── Infrastructure/
│   ├── Auth/        JWT service
│   ├── Database/    DBAL connection factory
│   └── Http/        auth middleware, JSON parser, error handler
└── Support/         ingredient parser, uuid helpers
```

## Schema

Single migration creates every table. See `db/migrations/20260101000000_initial_schema.php`.

Key tables:
- `users`, `groups`, `group_members`
- `ingredients` (seeded from `shared/ingredients.json`)
- `shopping_lists`, `shopping_list_items`
- `pantry_items`
- `recipes`, `recipe_ingredients`, `recipe_steps`
- `cooked_meals`
- `meal_suggestions`, `suggestion_likes`, `suggestion_comments`
- `group_feed_events`

All `group_id` columns are nullable — `null` = private to the user, set = shared with group.

## Seeding

`composer seed` loads `shared/ingredients.json` and `shared/recipes.json` into the database. Safe to re-run on a fresh install.
