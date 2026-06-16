<?php
declare(strict_types=1);

namespace SevenKC\Domain\Repository;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use SevenKC\Support\Uid;

/**
 * Solo week meal-planner. One planned meal per (owner, plan_date); plan_date is an
 * ISO 'YYYY-MM-DD' string so lexicographic range filters are correct.
 */
final class MealPlanRepository
{
    public function __construct(private readonly Connection $db) {}

    /** @return list<array{id:string,plan_date:string,recipe_id:?string,recipe_title:?string,created_at:int}> */
    public function forRange(string $userId, string $start, string $end): array
    {
        $rows = $this->db->fetchAllAssociative(
            'SELECT * FROM meal_plan WHERE owner_user_id = ? AND plan_date >= ? AND plan_date <= ? ORDER BY plan_date ASC',
            [$userId, $start, $end]
        );
        return array_map(fn ($r) => [
            'id' => $r['id'],
            'plan_date' => $r['plan_date'],
            'recipe_id' => $r['recipe_id'],
            'recipe_title' => $r['recipe_title'],
            'created_at' => (int)$r['created_at'],
        ], $rows);
    }

    /** Upsert the meal for a given day (keyed on owner + date). Returns the row id.
     *  A UNIQUE(owner_user_id, plan_date) index makes this race-safe: a concurrent
     *  INSERT that loses the race is caught and converted to an UPDATE. */
    public function upsertSlot(string $userId, string $date, ?string $recipeId, ?string $recipeTitle): string
    {
        $existing = $this->db->fetchOne(
            'SELECT id FROM meal_plan WHERE owner_user_id = ? AND plan_date = ?',
            [$userId, $date]
        );
        if ($existing) {
            $this->db->update('meal_plan', ['recipe_id' => $recipeId, 'recipe_title' => $recipeTitle], ['id' => $existing]);
            return (string)$existing;
        }
        $id = Uid::new();
        try {
            $this->db->insert('meal_plan', [
                'id' => $id,
                'owner_user_id' => $userId,
                'group_id' => null,
                'plan_date' => $date,
                'recipe_id' => $recipeId,
                'recipe_title' => $recipeTitle,
                'created_at' => time(),
            ]);
            return $id;
        } catch (UniqueConstraintViolationException) {
            // Another request inserted this (owner,date) first — update that row instead.
            $this->db->update('meal_plan', ['recipe_id' => $recipeId, 'recipe_title' => $recipeTitle], [
                'owner_user_id' => $userId,
                'plan_date' => $date,
            ]);
            return (string)$this->db->fetchOne(
                'SELECT id FROM meal_plan WHERE owner_user_id = ? AND plan_date = ?',
                [$userId, $date]
            );
        }
    }

    public function clearSlot(string $userId, string $date): void
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
