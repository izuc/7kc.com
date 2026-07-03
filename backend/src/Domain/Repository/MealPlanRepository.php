<?php
declare(strict_types=1);

namespace SevenKC\Domain\Repository;

use Doctrine\DBAL\Connection;
use SevenKC\Support\Uid;

/**
 * Solo week meal-planner. A day holds any number of meals — each entry has an
 * optional label ("Breakfast", "Dinner"…) and a per-day sort position.
 * plan_date is an ISO 'YYYY-MM-DD' string so lexicographic range filters are
 * correct.
 */
final class MealPlanRepository
{
    public function __construct(private readonly Connection $db) {}

    /** @return list<array{id:string,plan_date:string,meal_label:?string,sort_order:int,recipe_id:?string,recipe_title:?string,created_at:int}> */
    public function forRange(string $userId, string $start, string $end): array
    {
        $rows = $this->db->fetchAllAssociative(
            'SELECT * FROM meal_plan
             WHERE owner_user_id = ? AND plan_date >= ? AND plan_date <= ?
             ORDER BY plan_date ASC, sort_order ASC, created_at ASC',
            [$userId, $start, $end]
        );
        return array_map(fn ($r) => [
            'id' => $r['id'],
            'plan_date' => $r['plan_date'],
            'meal_label' => $r['meal_label'] !== null && $r['meal_label'] !== '' ? (string)$r['meal_label'] : null,
            'sort_order' => (int)$r['sort_order'],
            'recipe_id' => $r['recipe_id'],
            'recipe_title' => $r['recipe_title'],
            'created_at' => (int)$r['created_at'],
        ], $rows);
    }

    /** Append a meal to a day. Returns the new row id. */
    public function addEntry(string $userId, string $date, ?string $recipeId, ?string $recipeTitle, ?string $label): string
    {
        $next = (int)$this->db->fetchOne(
            'SELECT COALESCE(MAX(sort_order), -1) + 1 FROM meal_plan WHERE owner_user_id = ? AND plan_date = ?',
            [$userId, $date]
        );
        $id = Uid::new();
        $this->db->insert('meal_plan', [
            'id' => $id,
            'owner_user_id' => $userId,
            'group_id' => null,
            'plan_date' => $date,
            'meal_label' => $label,
            'sort_order' => $next,
            'recipe_id' => $recipeId,
            'recipe_title' => $recipeTitle,
            'created_at' => time(),
        ]);
        return $id;
    }

    /** Replace an entry's recipe and label. Owner-scoped; false when not found. */
    public function updateEntry(string $userId, string $id, ?string $recipeId, ?string $recipeTitle, ?string $label): bool
    {
        $count = $this->db->update(
            'meal_plan',
            ['recipe_id' => $recipeId, 'recipe_title' => $recipeTitle, 'meal_label' => $label],
            ['id' => $id, 'owner_user_id' => $userId]
        );
        return $count > 0;
    }

    /** Remove one meal. Owner-scoped; false when not found. */
    public function removeEntry(string $userId, string $id): bool
    {
        return $this->db->delete('meal_plan', ['id' => $id, 'owner_user_id' => $userId]) > 0;
    }

    /** Remove every meal planned for a day. */
    public function clearDay(string $userId, string $date): void
    {
        $this->db->executeStatement(
            'DELETE FROM meal_plan WHERE owner_user_id = ? AND plan_date = ?',
            [$userId, $date]
        );
    }

    /** Distinct ingredient ids across every catalogue recipe planned in the range. @return list<string> */
    public function ingredientIdsForRange(string $userId, string $start, string $end): array
    {
        $rows = $this->db->fetchAllAssociative(
            'SELECT DISTINCT ri.ingredient_id
             FROM meal_plan mp
             JOIN recipe_ingredients ri ON ri.recipe_id = mp.recipe_id
             WHERE mp.owner_user_id = ? AND mp.plan_date >= ? AND mp.plan_date <= ? AND ri.ingredient_id IS NOT NULL',
            [$userId, $start, $end]
        );
        return array_values(array_map(fn ($r) => (string)$r['ingredient_id'], $rows));
    }
}
