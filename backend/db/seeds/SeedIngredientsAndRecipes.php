<?php
declare(strict_types=1);

use Phinx\Seed\AbstractSeed;
use Ramsey\Uuid\Uuid;

/**
 * Idempotent seed. Ingredients are inserted if missing (by id), aliases
 * refreshed every run. Recipes are inserted if missing (by slug). Every run
 * also does a backfill pass that updates `content` and `detail` on existing
 * seeded recipe steps whenever the JSON provides an object-form step — so
 * we can progressively add beginner walkthrough text to older recipes
 * without touching user-created customs.
 *
 * Recipe steps in recipes.json can be:
 *   - a plain string (short content, no detail), or
 *   - { "content": "...", "detail": "..." }
 */
final class SeedIngredientsAndRecipes extends AbstractSeed
{
    public function run(): void
    {
        $sharedDir = dirname(__DIR__, 3) . '/shared';
        $ingredients = json_decode((string)file_get_contents($sharedDir . '/ingredients.json'), true);
        $aliases = json_decode((string)file_get_contents($sharedDir . '/aliases.json'), true);
        $recipes = json_decode((string)file_get_contents($sharedDir . '/recipes.json'), true);

        $aliasesByIngredient = [];
        foreach ($aliases as $alias => $ingredientId) {
            $aliasesByIngredient[$ingredientId] ??= [];
            $aliasesByIngredient[$ingredientId][] = $alias;
        }

        // ---------- ingredients ----------
        $existingIngIds = array_column(
            $this->getAdapter()->fetchAll('SELECT id FROM ingredients'),
            'id'
        );
        $existingIngIdSet = array_flip($existingIngIds);
        $pdo = $this->getAdapter()->getConnection();

        $ingRows = [];
        foreach ($ingredients as $i) {
            $aliasesJson = json_encode($aliasesByIngredient[$i['id']] ?? [], JSON_UNESCAPED_UNICODE);
            if (isset($existingIngIdSet[$i['id']])) {
                // Re-sync ALL editable columns (not just aliases) so an in-place edit to
                // shared/ingredients.json — display, section, shelf_life_days — lands on an
                // existing DB without a reset. section in particular drives the DERIVED diet
                // flags, so a stale value silently mis-tags every recipe using the ingredient.
                $this->getAdapter()->execute(
                    'UPDATE ingredients SET display = ' . $pdo->quote((string)$i['display']) .
                    ', section = ' . $pdo->quote((string)$i['section']) .
                    ', shelf_life_days = ' . (int)$i['shelf_life_days'] .
                    ', aliases_json = ' . $pdo->quote($aliasesJson) .
                    ' WHERE id = ' . $pdo->quote($i['id'])
                );
                continue;
            }
            $ingRows[] = [
                'id' => $i['id'],
                'display' => $i['display'],
                'section' => $i['section'],
                'shelf_life_days' => $i['shelf_life_days'],
                'aliases_json' => $aliasesJson,
            ];
        }
        if ($ingRows) {
            $this->table('ingredients')->insert($ingRows)->save();
        }

        // ---------- recipes ----------
        $existingRecipeRows = $this->getAdapter()->fetchAll('SELECT id, slug FROM recipes');
        $idBySlug = [];
        foreach ($existingRecipeRows as $r) $idBySlug[$r['slug']] = $r['id'];

        $now = time();
        $recipeRows = [];
        $recipeIngRows = [];
        $recipeStepRows = [];

        foreach ($recipes as $r) {
            if (isset($idBySlug[$r['slug']])) continue;
            $rid = Uuid::uuid4()->toString();
            $idBySlug[$r['slug']] = $rid;
            $recipeRows[] = [
                'id' => $rid,
                'slug' => $r['slug'],
                'title' => $r['title'],
                'description' => $r['description'],
                'prep_time' => $r['prep_time'],
                'cook_time' => $r['cook_time'],
                'servings' => $r['servings'],
                'difficulty' => $r['difficulty'] ?? null,
                'equipment_json' => isset($r['equipment']) ? json_encode($r['equipment'], JSON_UNESCAPED_UNICODE) : null,
                'make_ahead' => $r['make_ahead'] ?? null,
                'storage' => $r['storage'] ?? null,
                'leftovers' => $r['leftovers'] ?? null,
                'substitutions_json' => isset($r['substitutions']) ? json_encode($r['substitutions'], JSON_UNESCAPED_UNICODE) : null,
                'tags_json' => json_encode($r['tags']),
                'palette_json' => json_encode($r['palette']),
                'dish_form' => $r['dish_form'] ?? null,
                'source' => null,
                'image_url' => null,
                'is_custom' => 0,
                'owner_user_id' => null,
                'group_id' => null,
                'created_at' => $now,
            ];
            foreach ($r['ingredients'] as $idx => $ing) {
                $recipeIngRows[] = [
                    'recipe_id' => $rid,
                    'sort_order' => $idx,
                    'ingredient_id' => $ing['id'],
                    'amount_text' => $ing['amount'],
                    // Read from data when authored (pipeline ready for is_optional backfill).
                    'is_optional' => !empty($ing['is_optional']) ? 1 : 0,
                ];
            }
            foreach ($r['steps'] as $idx => $step) {
                [$content, $detail] = self::normaliseStep($step);
                $recipeStepRows[] = [
                    'recipe_id' => $rid,
                    'sort_order' => $idx,
                    'content' => $content,
                    'detail' => $detail,
                    // Read from data when authored (pipeline ready for timer_seconds backfill).
                    'timer_seconds' => is_array($step) && isset($step['timer_seconds']) ? (int)$step['timer_seconds'] : null,
                ] + self::guidedStepColumns($step);
            }
        }

        // Insert in chunks so a large catalogue (1000+ recipes → thousands of
        // step rows with long detail text) never builds a single INSERT that
        // exceeds MySQL's max_allowed_packet.
        foreach (array_chunk($recipeRows, 200) as $chunk) $this->table('recipes')->insert($chunk)->save();
        foreach (array_chunk($recipeIngRows, 500) as $chunk) $this->table('recipe_ingredients')->insert($chunk)->save();
        foreach (array_chunk($recipeStepRows, 150) as $chunk) $this->table('recipe_steps')->insert($chunk)->save();

        // ---------- metadata + detail sync ----------
        // For every recipe in the JSON, sync editable metadata (title,
        // description, prep/cook times, servings, tags, palette) on the
        // existing DB row — so bug fixes like "&amp;" → "&" on a title
        // land without a reset. Also updates step content+detail when the
        // JSON provides the object form.
        foreach ($recipes as $r) {
            $rid = $idBySlug[$r['slug']] ?? null;
            if (!$rid) continue;

            $this->getAdapter()->execute(
                'UPDATE recipes SET title = ' . $pdo->quote((string)$r['title']) .
                ', description = ' . $pdo->quote((string)($r['description'] ?? '')) .
                ', prep_time = ' . (int)$r['prep_time'] .
                ', cook_time = ' . (int)$r['cook_time'] .
                ', servings = ' . (int)$r['servings'] .
                ', difficulty = ' . (isset($r['difficulty']) ? $pdo->quote((string)$r['difficulty']) : 'NULL') .
                ', equipment_json = ' . (isset($r['equipment']) ? $pdo->quote(json_encode($r['equipment'], JSON_UNESCAPED_UNICODE)) : 'NULL') .
                ', make_ahead = ' . (isset($r['make_ahead']) ? $pdo->quote((string)$r['make_ahead']) : 'NULL') .
                ', storage = ' . (isset($r['storage']) ? $pdo->quote((string)$r['storage']) : 'NULL') .
                ', leftovers = ' . (isset($r['leftovers']) ? $pdo->quote((string)$r['leftovers']) : 'NULL') .
                ', substitutions_json = ' . (isset($r['substitutions']) ? $pdo->quote(json_encode($r['substitutions'], JSON_UNESCAPED_UNICODE)) : 'NULL') .
                ', tags_json = ' . $pdo->quote(json_encode($r['tags'])) .
                ', palette_json = ' . $pdo->quote(json_encode($r['palette'])) .
                // NULL-consistent with the insert path (don't coerce a missing form to '').
                ', dish_form = ' . (empty($r['dish_form']) ? 'NULL' : $pdo->quote((string)$r['dish_form'])) .
                ' WHERE id = ' . $pdo->quote($rid)
            );

            // Fully re-sync ingredients + steps from the JSON so recipe CORRECTIONS
            // (added/removed/swapped ingredients, edited or re-ordered steps) land
            // on existing rows without a DB reset — the repo JSON is authoritative.
            $this->getAdapter()->execute('DELETE FROM recipe_ingredients WHERE recipe_id = ' . $pdo->quote($rid));
            foreach ($r['ingredients'] as $idx => $ing) {
                $this->getAdapter()->execute(
                    'INSERT INTO recipe_ingredients (recipe_id, sort_order, ingredient_id, amount_text, is_optional) VALUES ('
                    . $pdo->quote($rid) . ', ' . (int)$idx . ', '
                    . $pdo->quote((string)$ing['id']) . ', '
                    . $pdo->quote((string)$ing['amount']) . ', '
                    . (!empty($ing['is_optional']) ? 1 : 0) . ')'
                );
            }

            $this->getAdapter()->execute('DELETE FROM recipe_steps WHERE recipe_id = ' . $pdo->quote($rid));
            foreach ($r['steps'] as $idx => $step) {
                [$content, $detail] = self::normaliseStep($step);
                $timer = is_array($step) && isset($step['timer_seconds']) ? (int)$step['timer_seconds'] : null;
                $g = self::guidedStepColumns($step);
                $this->getAdapter()->execute(
                    'INSERT INTO recipe_steps (recipe_id, sort_order, content, detail, timer_seconds, title, tips_json, warnings_json, ingredient_ids_json) VALUES ('
                    . $pdo->quote($rid) . ', ' . (int)$idx . ', '
                    . $pdo->quote($content) . ', '
                    . ($detail === null || $detail === '' ? 'NULL' : $pdo->quote($detail)) . ', '
                    . ($timer === null ? 'NULL' : (int)$timer) . ', '
                    . ($g['title'] === null ? 'NULL' : $pdo->quote($g['title'])) . ', '
                    . ($g['tips_json'] === null ? 'NULL' : $pdo->quote($g['tips_json'])) . ', '
                    . ($g['warnings_json'] === null ? 'NULL' : $pdo->quote($g['warnings_json'])) . ', '
                    . ($g['ingredient_ids_json'] === null ? 'NULL' : $pdo->quote($g['ingredient_ids_json'])) . ')'
                );
            }
        }
    }

    /** @param mixed $step  @return array{0:string, 1:string|null} */
    private static function normaliseStep($step): array
    {
        if (is_array($step)) {
            return [(string)($step['content'] ?? ''), $step['detail'] ?? null];
        }
        return [(string)$step, null];
    }

    /**
     * Guided-cooking step columns (title / tips / warnings / per-step
     * ingredient ids). Always returns all four keys so bulk-insert rows stay
     * homogeneous; empty arrays are stored as NULL, not "[]".
     *
     * @param mixed $step
     * @return array{title: ?string, tips_json: ?string, warnings_json: ?string, ingredient_ids_json: ?string}
     */
    private static function guidedStepColumns($step): array
    {
        $arr = is_array($step) ? $step : [];
        $json = fn (?array $v) => ($v !== null && $v !== []) ? json_encode($v, JSON_UNESCAPED_UNICODE) : null;
        $title = isset($arr['title']) && $arr['title'] !== '' ? (string)$arr['title'] : null;
        return [
            'title' => $title,
            'tips_json' => $json($arr['tips'] ?? null),
            'warnings_json' => $json($arr['warnings'] ?? null),
            'ingredient_ids_json' => $json($arr['ingredient_ids'] ?? null),
        ];
    }
}
