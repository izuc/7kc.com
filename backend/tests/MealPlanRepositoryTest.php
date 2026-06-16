<?php
declare(strict_types=1);

namespace SevenKC\Tests;

use SevenKC\Domain\Repository\MealPlanRepository;

final class MealPlanRepositoryTest extends TestCase
{
    private function repo(): MealPlanRepository
    {
        return new MealPlanRepository($this->db);
    }

    private function seedRecipeWithIngredients(string $recipeId, array $ingredientIds): void
    {
        $this->db->insert('recipes', [
            'id' => $recipeId, 'slug' => $recipeId, 'title' => ucfirst($recipeId),
            'is_custom' => 0, 'created_at' => time(),
        ]);
        foreach ($ingredientIds as $i => $ing) {
            $this->db->insert('recipe_ingredients', [
                'recipe_id' => $recipeId, 'sort_order' => $i, 'ingredient_id' => $ing,
            ]);
        }
    }

    public function testUpsertReplacesTheSameDaySlot(): void
    {
        $repo = $this->repo();
        $id1 = $repo->upsertSlot('userA', '2026-06-15', 'r1', 'Monday meal');
        $id2 = $repo->upsertSlot('userA', '2026-06-15', 'r2', 'Replaced');

        $this->assertSame($id1, $id2, 'same (owner,date) should update, not insert a new row');
        $rows = $repo->forRange('userA', '2026-06-15', '2026-06-15');
        $this->assertCount(1, $rows);
        $this->assertSame('r2', $rows[0]['recipe_id']);
        $this->assertSame('Replaced', $rows[0]['recipe_title']);
    }

    public function testForRangeScopesToOwnerAndDateWindow(): void
    {
        $repo = $this->repo();
        $repo->upsertSlot('userA', '2026-06-15', 'r1', 'in');
        $repo->upsertSlot('userA', '2026-06-21', 'r2', 'in');
        $repo->upsertSlot('userA', '2026-06-22', 'r3', 'out-of-range');
        $repo->upsertSlot('userB', '2026-06-16', 'r4', 'other-user');

        $rows = $repo->forRange('userA', '2026-06-15', '2026-06-21');
        $this->assertCount(2, $rows);
        $this->assertSame(['2026-06-15', '2026-06-21'], array_column($rows, 'plan_date'));
    }

    public function testClearSlotRemovesOnlyThatDay(): void
    {
        $repo = $this->repo();
        $repo->upsertSlot('userA', '2026-06-15', 'r1', 'a');
        $repo->upsertSlot('userA', '2026-06-16', 'r2', 'b');
        $repo->clearSlot('userA', '2026-06-15');

        $rows = $repo->forRange('userA', '2026-06-15', '2026-06-21');
        $this->assertCount(1, $rows);
        $this->assertSame('2026-06-16', $rows[0]['plan_date']);
    }

    public function testIngredientIdsForRangeDedupesAcrossPlannedRecipes(): void
    {
        $this->seedRecipeWithIngredients('r1', ['eggs', 'flour', 'milk']);
        $this->seedRecipeWithIngredients('r2', ['flour', 'butter']); // flour overlaps r1

        $repo = $this->repo();
        $repo->upsertSlot('userA', '2026-06-15', 'r1', 'a');
        $repo->upsertSlot('userA', '2026-06-16', 'r2', 'b');
        $repo->upsertSlot('userA', '2026-06-25', 'r1', 'out-of-range');

        $ids = $repo->ingredientIdsForRange('userA', '2026-06-15', '2026-06-21');
        sort($ids);
        $this->assertSame(['butter', 'eggs', 'flour', 'milk'], $ids);
    }
}
