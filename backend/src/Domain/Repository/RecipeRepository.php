<?php
declare(strict_types=1);

namespace SevenKC\Domain\Repository;

use Doctrine\DBAL\Connection;
use SevenKC\Support\Uid;

final class RecipeRepository
{
    public function __construct(private readonly Connection $db) {}

    public function all(?string $userId = null, ?string $groupId = null): array
    {
        $sql = 'SELECT * FROM recipes WHERE is_custom = 0';
        $params = [];
        if ($userId) {
            $sql .= ' OR owner_user_id = ?';
            $params[] = $userId;
        }
        if ($groupId) {
            $sql .= ' OR group_id = ?';
            $params[] = $groupId;
        }
        $sql .= ' ORDER BY title ASC';
        $rows = $this->db->fetchAllAssociative($sql, $params);
        return array_map([$this, 'hydrate'], $rows);
    }

    public function findBySlug(string $slug): ?array
    {
        $r = $this->db->fetchAssociative('SELECT * FROM recipes WHERE slug = ?', [$slug]);
        return $r ? $this->withDetails($this->hydrate($r)) : null;
    }

    public function findById(string $id): ?array
    {
        $r = $this->db->fetchAssociative('SELECT * FROM recipes WHERE id = ?', [$id]);
        return $r ? $this->withDetails($this->hydrate($r)) : null;
    }

    public function withDetails(array $recipe): array
    {
        $ings = $this->db->fetchAllAssociative(
            'SELECT ri.*, i.display, i.section FROM recipe_ingredients ri LEFT JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = ? ORDER BY ri.sort_order',
            [$recipe['id']]
        );
        $steps = $this->db->fetchAllAssociative(
            'SELECT content, timer_seconds, sort_order FROM recipe_steps WHERE recipe_id = ? ORDER BY sort_order',
            [$recipe['id']]
        );
        $recipe['ingredients'] = array_map(fn ($r) => [
            'ingredient_id' => $r['ingredient_id'],
            'display' => $r['display'],
            'section' => $r['section'],
            'amount' => $r['amount_text'],
            'is_optional' => (bool)$r['is_optional'],
        ], $ings);
        $recipe['steps'] = array_map(fn ($r) => [
            'content' => $r['content'],
            'timer_seconds' => $r['timer_seconds'] !== null ? (int)$r['timer_seconds'] : null,
        ], $steps);
        return $recipe;
    }

    public function ingredientIdsForAll(): array
    {
        $rows = $this->db->fetchAllAssociative('SELECT recipe_id, ingredient_id FROM recipe_ingredients WHERE ingredient_id IS NOT NULL');
        $out = [];
        foreach ($rows as $r) {
            $out[$r['recipe_id']][] = $r['ingredient_id'];
        }
        return $out;
    }

    public function createCustom(string $ownerId, ?string $groupId, array $payload): string
    {
        $id = Uid::new();
        $slug = $this->slugify($payload['title']);
        $this->db->insert('recipes', [
            'id' => $id,
            'slug' => $slug . '-' . substr($id, 0, 6),
            'title' => $payload['title'],
            'description' => $payload['description'] ?? '',
            'prep_time' => (int)($payload['prep_time'] ?? 0),
            'cook_time' => (int)($payload['cook_time'] ?? 0),
            'servings' => (int)($payload['servings'] ?? 2),
            'tags_json' => json_encode($payload['tags'] ?? []),
            'palette_json' => json_encode($payload['palette'] ?? ['#8c8c8c', '#d4d4d4']),
            'source' => $payload['source'] ?? null,
            'image_url' => $payload['image_url'] ?? null,
            'is_custom' => 1,
            'owner_user_id' => $ownerId,
            'group_id' => $groupId,
            'created_at' => time(),
        ]);
        foreach ($payload['ingredients'] ?? [] as $idx => $ing) {
            $this->db->insert('recipe_ingredients', [
                'recipe_id' => $id,
                'sort_order' => $idx,
                'ingredient_id' => $ing['ingredient_id'] ?? $ing['id'] ?? null,
                'amount_text' => $ing['amount'] ?? null,
                'is_optional' => !empty($ing['is_optional']) ? 1 : 0,
            ]);
        }
        foreach ($payload['steps'] ?? [] as $idx => $step) {
            $this->db->insert('recipe_steps', [
                'recipe_id' => $id,
                'sort_order' => $idx,
                'content' => is_array($step) ? ($step['content'] ?? '') : $step,
                'timer_seconds' => is_array($step) ? ($step['timer_seconds'] ?? null) : null,
            ]);
        }
        return $id;
    }

    public function recordCooked(string $userId, ?string $groupId, string $recipeId, array $removedIngIds): string
    {
        $id = Uid::new();
        $this->db->insert('cooked_meals', [
            'id' => $id,
            'user_id' => $userId,
            'group_id' => $groupId,
            'recipe_id' => $recipeId,
            'cooked_at' => time(),
            'removed_pantry_json' => json_encode($removedIngIds),
        ]);
        return $id;
    }

    public function recentlyCookedIds(string $userId, int $since): array
    {
        return array_map(
            fn ($r) => $r['recipe_id'],
            $this->db->fetchAllAssociative(
                'SELECT recipe_id FROM cooked_meals WHERE user_id = ? AND cooked_at > ?',
                [$userId, $since]
            )
        );
    }

    private function hydrate(array $r): array
    {
        return [
            'id' => $r['id'],
            'slug' => $r['slug'],
            'title' => $r['title'],
            'description' => $r['description'],
            'prep_time' => (int)$r['prep_time'],
            'cook_time' => (int)$r['cook_time'],
            'servings' => (int)$r['servings'],
            'tags' => $r['tags_json'] ? (array)json_decode((string)$r['tags_json'], true) : [],
            'palette' => $r['palette_json'] ? (array)json_decode((string)$r['palette_json'], true) : ['#8c8c8c','#d4d4d4'],
            'image_url' => $r['image_url'],
            'is_custom' => (bool)$r['is_custom'],
            'owner_user_id' => $r['owner_user_id'],
            'group_id' => $r['group_id'],
        ];
    }

    private function slugify(string $s): string
    {
        $s = strtolower($s);
        $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? $s;
        return trim($s, '-');
    }
}
