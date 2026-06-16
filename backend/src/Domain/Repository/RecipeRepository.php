<?php
declare(strict_types=1);

namespace SevenKC\Domain\Repository;

use Doctrine\DBAL\Connection;
use SevenKC\Support\Uid;

final class RecipeRepository
{
    public function __construct(private readonly Connection $db) {}

    /** @var array<string, list<string>>|null cached ingredient-id sets by diet concern */
    private ?array $dietSetsCache = null;

    private function dietSets(): array
    {
        if ($this->dietSetsCache !== null) return $this->dietSetsCache;
        $meat = [];
        $dairy = [];
        foreach ($this->db->fetchAllAssociative('SELECT id, section FROM ingredients') as $r) {
            if ($r['section'] === 'meat') $meat[] = $r['id']; // meat section also holds seafood
            if ($r['section'] === 'dairy') $dairy[] = $r['id'];
        }
        return $this->dietSetsCache = [
            'meat' => $meat,
            'dairy' => $dairy,
            'gluten' => ['flour', 'pasta', 'spaghetti', 'bread', 'breadcrumbs', 'soy_sauce', 'couscous', 'tortilla', 'noodles'],
            'nut' => ['almond', 'cashew', 'walnut', 'peanut', 'pistachio', 'pecan', 'hazelnut', 'pine_nut'],
        ];
    }

    /**
     * Diet flags DERIVED from a recipe's ingredients (authoritative — the hand-set tags
     * are demonstrably wrong, e.g. a "vegetarian" recipe containing bacon).
     */
    public function dietFor(array $ingredientIds): array
    {
        $sets = $this->dietSets();
        $has = fn (array $set) => count(array_intersect($ingredientIds, $set)) > 0;
        $meat = $has($sets['meat']);
        $dairy = $has($sets['dairy']);
        $egg = in_array('eggs', $ingredientIds, true);
        $honey = in_array('honey', $ingredientIds, true);
        return [
            'vegetarian' => !$meat,
            'vegan' => !$meat && !$dairy && !$egg && !$honey,
            'dairy_free' => !$dairy,
            'gluten_free' => !$has($sets['gluten']),
            'nut_free' => !$has($sets['nut']),
        ];
    }

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
        $recipes = array_map([$this, 'hydrate'], $rows);

        // attach compact ingredient_ids so the frontend can compose MealPlates
        // without fetching each recipe detail separately.
        $byRecipe = $this->ingredientIdsForAll();
        foreach ($recipes as &$r) {
            $r['ingredient_ids'] = $byRecipe[$r['id']] ?? [];
            $r['diet'] = $this->dietFor($r['ingredient_ids']);
        }
        unset($r);
        return $recipes;
    }

    /** Compact summaries (with ingredient_ids + diet) for a set of recipe ids, keyed by id. */
    public function summariesByIds(array $ids): array
    {
        $ids = array_values(array_unique(array_filter($ids)));
        if ($ids === []) return [];
        $ph = implode(',', array_fill(0, count($ids), '?'));
        $rows = $this->db->fetchAllAssociative("SELECT * FROM recipes WHERE id IN ($ph)", $ids);
        $byRecipe = $this->ingredientIdsForAll();
        $out = [];
        foreach ($rows as $r) {
            $s = $this->hydrate($r);
            $s['ingredient_ids'] = $byRecipe[$r['id']] ?? [];
            $s['diet'] = $this->dietFor($s['ingredient_ids']);
            $out[$r['id']] = $s;
        }
        return $out;
    }

    /** Public (non-custom) recipes carrying a given tag — for collection landing pages. */
    public function publicByTag(string $tag): array
    {
        $recipes = array_map([$this, 'hydrate'], $this->db->fetchAllAssociative(
            'SELECT * FROM recipes WHERE is_custom = 0 ORDER BY title ASC'
        ));
        $byRecipe = $this->ingredientIdsForAll();
        $out = [];
        foreach ($recipes as $r) {
            if (in_array($tag, $r['tags'], true)) {
                $r['ingredient_ids'] = $byRecipe[$r['id']] ?? [];
                $out[] = $r;
            }
        }
        return $out;
    }

    public function findBySlug(string $slug): ?array
    {
        $r = $this->db->fetchAssociative('SELECT * FROM recipes WHERE slug = ?', [$slug]);
        return $r ? $this->withDetails($this->hydrate($r)) : null;
    }

    /** Seeded (public) recipes are visible to all; custom recipes only to their owner/group. */
    public function findBySlugForUser(string $slug, string $userId, ?string $groupId): ?array
    {
        $sql = 'SELECT * FROM recipes WHERE slug = ? AND (is_custom = 0 OR owner_user_id = ?' . ($groupId ? ' OR group_id = ?' : '') . ')';
        $params = [$slug, $userId];
        if ($groupId) $params[] = $groupId;
        $r = $this->db->fetchAssociative($sql, $params);
        return $r ? $this->withDetails($this->hydrate($r)) : null;
    }

    /** Only the curated, non-custom catalog is exposed on the public (no-auth) endpoint. */
    public function findPublicBySlug(string $slug): ?array
    {
        $r = $this->db->fetchAssociative('SELECT * FROM recipes WHERE slug = ? AND is_custom = 0', [$slug]);
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
            'SELECT content, detail, timer_seconds, sort_order FROM recipe_steps WHERE recipe_id = ? ORDER BY sort_order',
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
            'detail' => $r['detail'] ?: null,
            'timer_seconds' => $r['timer_seconds'] !== null ? (int)$r['timer_seconds'] : null,
        ], $steps);
        $recipe['diet'] = $this->dietFor(array_values(array_filter(array_map(
            fn ($i) => $i['ingredient_id'],
            $recipe['ingredients']
        ))));
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

    /** Distinct recipes the user has cooked, newest first, with cook counts (for the "Recently cooked" rail). */
    public function cookedSummary(string $userId, int $limit = 12): array
    {
        $rows = $this->db->fetchAllAssociative(
            'SELECT recipe_id, COUNT(*) AS cooked_count, MAX(cooked_at) AS last_cooked FROM cooked_meals WHERE user_id = ? GROUP BY recipe_id ORDER BY last_cooked DESC LIMIT ' . (int)$limit,
            [$userId]
        );
        if (!$rows) return [];

        $ids = array_column($rows, 'recipe_id');
        $ph = implode(',', array_fill(0, count($ids), '?'));
        $byId = [];
        foreach ($this->db->fetchAllAssociative("SELECT * FROM recipes WHERE id IN ($ph)", $ids) as $r) {
            $byId[$r['id']] = $this->hydrate($r);
        }
        $ings = $this->ingredientIdsForAll();

        $out = [];
        foreach ($rows as $row) {
            $rec = $byId[$row['recipe_id']] ?? null;
            if (!$rec) continue;
            $rec['ingredient_ids'] = $ings[$rec['id']] ?? [];
            $out[] = [
                'recipe' => $rec,
                'cooked_count' => (int)$row['cooked_count'],
                'last_cooked' => (int)$row['last_cooked'],
            ];
        }
        return $out;
    }

    public function toggleFavourite(string $userId, string $recipeId): bool
    {
        $exists = $this->db->fetchOne('SELECT 1 FROM recipe_favourites WHERE user_id = ? AND recipe_id = ?', [$userId, $recipeId]);
        if ($exists) {
            $this->db->delete('recipe_favourites', ['user_id' => $userId, 'recipe_id' => $recipeId]);
            return false;
        }
        $this->db->insert('recipe_favourites', ['user_id' => $userId, 'recipe_id' => $recipeId, 'created_at' => time()]);
        return true;
    }

    public function favourites(string $userId): array
    {
        $rows = $this->db->fetchAllAssociative(
            'SELECT r.* FROM recipe_favourites f JOIN recipes r ON r.id = f.recipe_id WHERE f.user_id = ? ORDER BY f.created_at DESC',
            [$userId]
        );
        $recipes = array_map([$this, 'hydrate'], $rows);
        $ings = $this->ingredientIdsForAll();
        foreach ($recipes as &$r) {
            $r['ingredient_ids'] = $ings[$r['id']] ?? [];
        }
        unset($r);
        return $recipes;
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
            'sponsored_by' => $r['sponsored_by'] ?? null,
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
