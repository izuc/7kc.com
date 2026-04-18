<?php
declare(strict_types=1);

use Phinx\Seed\AbstractSeed;
use Ramsey\Uuid\Uuid;

final class SeedIngredientsAndRecipes extends AbstractSeed
{
    public function run(): void
    {
        $existingIngredients = $this->getAdapter()->fetchRow('SELECT COUNT(*) AS c FROM ingredients');
        $existingRecipes = $this->getAdapter()->fetchRow('SELECT COUNT(*) AS c FROM recipes');
        if ((int)($existingIngredients['c'] ?? 0) > 0 || (int)($existingRecipes['c'] ?? 0) > 0) {
            return;
        }

        $sharedDir = dirname(__DIR__, 3) . '/shared';
        $ingredients = json_decode((string)file_get_contents($sharedDir . '/ingredients.json'), true);
        $aliases = json_decode((string)file_get_contents($sharedDir . '/aliases.json'), true);
        $recipes = json_decode((string)file_get_contents($sharedDir . '/recipes.json'), true);

        // group aliases by ingredient id
        $aliasesByIngredient = [];
        foreach ($aliases as $alias => $ingredientId) {
            $aliasesByIngredient[$ingredientId] ??= [];
            $aliasesByIngredient[$ingredientId][] = $alias;
        }

        $ingRows = [];
        foreach ($ingredients as $i) {
            $ingRows[] = [
                'id' => $i['id'],
                'display' => $i['display'],
                'section' => $i['section'],
                'shelf_life_days' => $i['shelf_life_days'],
                'aliases_json' => json_encode($aliasesByIngredient[$i['id']] ?? [], JSON_UNESCAPED_UNICODE),
            ];
        }
        $this->table('ingredients')->insert($ingRows)->save();

        $now = time();
        $recipeRows = [];
        $recipeIngRows = [];
        $recipeStepRows = [];

        foreach ($recipes as $r) {
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

        $this->table('recipes')->insert($recipeRows)->save();
        $this->table('recipe_ingredients')->insert($recipeIngRows)->save();
        $this->table('recipe_steps')->insert($recipeStepRows)->save();
    }
}
