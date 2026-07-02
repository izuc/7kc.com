-- Minimal SQLite schema mirroring the Phinx migrations, for fast isolated tests.
CREATE TABLE ingredients (
  id TEXT PRIMARY KEY, display TEXT, section TEXT, shelf_life_days INTEGER, aliases_json TEXT
);
CREATE TABLE users (
  id TEXT PRIMARY KEY, email TEXT, password_hash TEXT, display_name TEXT, group_id TEXT, created_at INTEGER,
  diet_json TEXT, last_seen_feed_at INTEGER, token_version INTEGER NOT NULL DEFAULT 0,
  digest_optin INTEGER NOT NULL DEFAULT 0, unsubscribe_token TEXT
);
CREATE TABLE shopping_lists (
  id TEXT PRIMARY KEY, owner_user_id TEXT, group_id TEXT, name TEXT, created_at INTEGER, archived_at INTEGER
);
CREATE TABLE shopping_list_items (
  id TEXT PRIMARY KEY, list_id TEXT, ingredient_id TEXT, custom_name TEXT, section TEXT, note TEXT,
  is_bought INTEGER DEFAULT 0, bought_by_user_id TEXT, bought_at INTEGER, added_by_user_id TEXT,
  added_at INTEGER, moved_to_pantry INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0
);
CREATE TABLE pantry_items (
  id TEXT PRIMARY KEY, owner_user_id TEXT, group_id TEXT, ingredient_id TEXT, custom_name TEXT,
  added_at INTEGER, expires_at INTEGER, running_low INTEGER DEFAULT 0, notes TEXT
);
CREATE TABLE recipes (
  id TEXT PRIMARY KEY, slug TEXT, title TEXT, description TEXT, prep_time INTEGER DEFAULT 0,
  cook_time INTEGER DEFAULT 0, servings INTEGER DEFAULT 2, difficulty TEXT, equipment_json TEXT,
  make_ahead TEXT, storage TEXT, leftovers TEXT, substitutions_json TEXT, tags_json TEXT, palette_json TEXT,
  source TEXT, image_url TEXT, sponsored_by TEXT, sponsored_url TEXT, view_count INTEGER DEFAULT 0,
  is_custom INTEGER DEFAULT 0, owner_user_id TEXT, group_id TEXT, created_at INTEGER, dish_form TEXT
);
CREATE TABLE recipe_ingredients (
  recipe_id TEXT, sort_order INTEGER, ingredient_id TEXT, amount_text TEXT, is_optional INTEGER DEFAULT 0
);
CREATE TABLE recipe_steps (
  recipe_id TEXT, sort_order INTEGER, title TEXT, content TEXT, detail TEXT, timer_seconds INTEGER,
  tips_json TEXT, warnings_json TEXT, ingredient_ids_json TEXT
);
CREATE TABLE recipe_favourites (
  user_id TEXT, recipe_id TEXT, created_at INTEGER, PRIMARY KEY (user_id, recipe_id)
);
CREATE TABLE group_feed_events (
  id TEXT PRIMARY KEY, group_id TEXT, user_id TEXT, kind TEXT, payload_json TEXT, created_at INTEGER
);
CREATE TABLE meal_plan (
  id TEXT PRIMARY KEY, owner_user_id TEXT, group_id TEXT, plan_date TEXT,
  recipe_id TEXT, recipe_title TEXT, created_at INTEGER,
  UNIQUE (owner_user_id, plan_date)
);
CREATE TABLE push_subscriptions (
  id TEXT PRIMARY KEY, user_id TEXT, endpoint TEXT, p256dh TEXT, auth TEXT, created_at INTEGER,
  UNIQUE (endpoint)
);
CREATE TABLE recipe_comments (
  id TEXT PRIMARY KEY, recipe_id TEXT, user_id TEXT, content TEXT, created_at INTEGER
);
CREATE TABLE rate_limits (
  bucket TEXT PRIMARY KEY, count INTEGER DEFAULT 0, window_start INTEGER
);
