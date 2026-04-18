# 7KC API v1

Base URL: `/api/v1`. All bodies are JSON. Authenticated endpoints require `Authorization: Bearer <jwt>`.

## Auth

| Method | Path | Auth | Body |
| --- | --- | --- | --- |
| POST | `/auth/register` | no | `{ email, password, display_name? }` |
| POST | `/auth/login` | no | `{ email, password }` |
| GET | `/auth/me` | yes | — |

Both auth endpoints return `{ token, user }`.

## Ingredients

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/ingredients?q=...` | no | fuzzy search, returns `{ items: Ingredient[] }` |
| POST | `/ingredients/parse` | no | body `{ text }`, returns parsed preview |

## Shopping lists

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/lists` | yes | own + group lists |
| POST | `/lists` | yes | `{ name, share_with_group? }` |
| GET | `/lists/:id` | yes | |
| PATCH | `/lists/:id` | yes | `{ name?, archived? }` |
| DELETE | `/lists/:id` | yes | archives (soft delete) |
| POST | `/lists/:id/items` | yes | `{ items: [{ ingredient_id?, custom_name?, section? }] }` |
| DELETE | `/lists/:id/items/:itemId` | yes | |
| POST | `/lists/:id/items/:itemId/toggle-bought` | yes | |
| POST | `/lists/:id/mark-all-bought` | yes | |
| POST | `/lists/:id/move-bought-to-pantry` | yes | `{ exclude_item_ids?: string[] }` |

## Pantry

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/pantry` | yes | all items (own + group) |
| POST | `/pantry/items` | yes | `{ ingredient_id? | custom_name?, expires_at?, running_low? }` |
| PATCH | `/pantry/items/:id` | yes | `{ expires_at?, running_low?, notes? }` |
| DELETE | `/pantry/items/:id` | yes | |

## Recipes

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/recipes?q=&tags=` | yes | |
| GET | `/recipes/:slug` | yes | full recipe with ingredients + steps |
| GET | `/recipes/suggestions` | yes | ranked by pantry match + expiring boost |
| POST | `/recipes` | yes | custom recipe |
| POST | `/recipes/:slug/cook` | yes | `{ remove_ingredient_ids: string[] }` |

## Groups

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/groups` | yes | `{ name }` — creates group, makes you owner |
| GET | `/groups/mine` | yes | current group (or `null`) |
| POST | `/groups/join` | yes | `{ token }` |
| POST | `/groups/leave` | yes | |
| GET | `/groups/feed` | yes | recent events for your group |
| GET | `/groups/suggestions` | yes | |
| POST | `/groups/suggestions` | yes | `{ recipe_slug? | recipe_title, suggested_for_date? }` |
| POST | `/groups/suggestions/:id/like` | yes | toggles like |
| POST | `/groups/suggestions/:id/comment` | yes | `{ content }` |

## Errors

All errors return `{ error: code, message: string }` with a suitable HTTP status:

- `400 bad_request`
- `401 unauthorized`
- `403 forbidden`
- `404 not_found`
- `409 conflict`
- `422 unprocessable`
- `500 internal_error`
