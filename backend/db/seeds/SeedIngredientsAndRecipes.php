<?php
declare(strict_types=1);

use Phinx\Seed\AbstractSeed;
use Ramsey\Uuid\Uuid;

/**
 * Idempotent seed. Inserts ingredients, recipes, recipe_ingredients and
 * recipe_steps that don't already exist (keyed by id / slug). Safe to re-run
 * on a populated database — existing rows are left untouched, aliases_json
 * is refreshed in case we've grown the alias set.
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
                // refresh aliases only (keeps your hand-edited shelf life etc. intact)
                $this->getAdapter()->execute(
                    'UPDATE ingredients SET aliases_json = ' . $pdo->quote($aliasesJson) .
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
        $existingSlugs = array_column(
            $this->getAdapter()->fetchAll('SELECT slug FROM recipes'),
            'slug'
        );
        $existingSlugSet = array_flip($existingSlugs);

        $now = time();
        $recipeRows = [];
        $recipeIngRows = [];
        $recipeStepRows = [];

        foreach ($recipes as $r) {
            if (isset($existingSlugSet[$r['slug']])) continue;
            $rid = Uuid::uuid4()->toString();
            $recipeRows[] = [
                'id' => $rid,
                'slug' => $r['slug'],
                'title' => $r['title'],
                'description' => $r['description'],
                'prep_time' => $r['prep_time'],
                'cook_time' => $r['cook_time'],
                'servings' => $r['servings'],
                'tags_json' => json_encode($r['tags']),
                'palette_json' => json_encode($r['palette']),
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
                    'is_optional' => 0,
                ];
            }
            foreach ($r['steps'] as $idx => $step) {
                $recipeStepRows[] = [
                    'recipe_id' => $rid,
                    'sort_order' => $idx,
                    'content' => $step,
                    'timer_seconds' => null,
                ];
            }
        }

        if ($recipeRows) $this->table('recipes')->insert($recipeRows)->save();
        if ($recipeIngRows) $this->table('recipe_ingredients')->insert($recipeIngRows)->save();
        if ($recipeStepRows) $this->table('recipe_steps')->insert($recipeStepRows)->save();
    }
}
