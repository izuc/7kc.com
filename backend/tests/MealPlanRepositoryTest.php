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

    public function testADayHoldsMultipleMealsInAddOrder(): void
    {
        $repo = $this->repo();
        $repo->addEntry('userA', '2026-06-15', 'r1', 'Porridge', 'Breakfast');
        $repo->addEntry('userA', '2026-06-15', 'r2', 'Sandwich', 'Lunch');
        $repo->addEntry('userA', '2026-06-15', 'r3', 'Bolognese', null);

        $rows = $repo->forRange('userA', '2026-06-15', '2026-06-15');
        $this->assertCount(3, $rows, 'a day is not limited to one meal');
        $this->assertSame(['Porridge', 'Sandwich', 'Bolognese'], array_column($rows, 'recipe_title'));
        $this->assertSame([0, 1, 2], array_column($rows, 'sort_order'));
        $this->assertSame(['Breakfast', 'Lunch', null], array_column($rows, 'meal_label'));
    }

    public function testUpdateEntryReplacesRecipeAndLabelOwnerScoped(): void
    {
        $repo = $this->repo();
        $id = $repo->addEntry('userA', '2026-06-15', 'r1', 'Original', 'Lunch');

        $this->assertFalse($repo->updateEntry('userB', $id, 'r2', 'Hijacked', null), 'other users cannot touch the entry');
        $this->assertTrue($repo->updateEntry('userA', $id, 'r2', 'Replaced', 'Dinner'));

        $rows = $repo->forRange('userA', '2026-06-15', '2026-06-15');
        $this->assertCount(1, $rows);
        $this->assertSame('r2', $rows[0]['recipe_id']);
        $this->assertSame('Replaced', $rows[0]['recipe_title']);
        $this->assertSame('Dinner', $rows[0]['meal_label']);
    }

    public function testRemoveEntryDeletesOnlyThatMeal(): void
    {
        $repo = $this->repo();
        $breakfast = $repo->addEntry('userA', '2026-06-15', 'r1', 'Porridge', 'Breakfast');
        $repo->addEntry('userA', '2026-06-15', 'r2', 'Bolognese', 'Dinner');

        $this->assertFalse($repo->removeEntry('userB', $breakfast), 'other users cannot delete the entry');
        $this->assertTrue($repo->removeEntry('userA', $breakfast));

        $rows = $repo->forRange('userA', '2026-06-15', '2026-06-15');
        $this->assertCount(1, $rows);
        $this->assertSame('Bolognese', $rows[0]['recipe_title']);
    }

    public function testForRangeScopesToOwnerAndDateWindow(): void
    {
        $repo = $this->repo();
        $repo->addEntry('userA', '2026-06-15', 'r1', 'in', null);
        $repo->addEntry('userA', '2026-06-21', 'r2', 'in', null);
        $repo->addEntry('userA', '2026-06-22', 'r3', 'out-of-range', null);
        $repo->addEntry('userB', '2026-06-16', 'r4', 'other-user', null);

        $rows = $repo->forRange('userA', '2026-06-15', '2026-06-21');
        $this->assertCount(2, $rows);
        $this->assertSame(['2026-06-15', '2026-06-21'], array_column($rows, 'plan_date'));
    }

    public function testClearDayRemovesAllMealsOnThatDayOnly(): void
    {
        $repo = $this->repo();
        $repo->addEntry('userA', '2026-06-15', 'r1', 'a', 'Breakfast');
        $repo->addEntry('userA', '2026-06-15', 'r2', 'b', 'Dinner');
        $repo->addEntry('userA', '2026-06-16', 'r3', 'c', null);
        $repo->clearDay('userA', '2026-06-15');

        $rows = $repo->forRange('userA', '2026-06-15', '2026-06-21');
        $this->assertCount(1, $rows);
        $this->assertSame('2026-06-16', $rows[0]['plan_date']);
    }

    public function testIngredientIdsForRangeDedupesAcrossPlannedRecipes(): void
    {
        $this->seedRecipeWithIngredients('r1', ['eggs', 'flour', 'milk']);
        $this->seedRecipeWithIngredients('r2', ['flour', 'butter']); // flour overlaps r1

        $repo = $this->repo();
        $repo->addEntry('userA', '2026-06-15', 'r1', 'a', 'Breakfast');
        $repo->addEntry('userA', '2026-06-15', 'r2', 'b', 'Dinner'); // same day, second meal
        $repo->addEntry('userA', '2026-06-25', 'r1', 'out-of-range', null);

        $ids = $repo->ingredientIdsForRange('userA', '2026-06-15', '2026-06-21');
        sort($ids);
        $this->assertSame(['butter', 'eggs', 'flour', 'milk'], $ids);
    }
}
