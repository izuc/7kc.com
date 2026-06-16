<?php
declare(strict_types=1);

namespace SevenKC\Domain\Repository;

use Doctrine\DBAL\Connection;
use SevenKC\Support\Uid;

/** Public, per-recipe comments. */
final class RecipeCommentRepository
{
    public function __construct(private readonly Connection $db) {}

    /** Newest-first comments for a recipe, with the author's display name. */
    public function forRecipe(string $recipeId, int $limit = 200): array
    {
        $rows = $this->db->fetchAllAssociative(
            'SELECT c.id, c.user_id, c.content, c.created_at, u.display_name, u.email
             FROM recipe_comments c JOIN users u ON u.id = c.user_id
             WHERE c.recipe_id = ? ORDER BY c.created_at DESC LIMIT ' . (int)$limit,
            [$recipeId]
        );
        return array_map(fn ($r) => [
            'id' => $r['id'],
            'user_id' => $r['user_id'],
            // A display name if set, else the email's local part — never the full email.
            'author' => $r['display_name'] ?: explode('@', (string)$r['email'])[0],
            'content' => $r['content'],
            'created_at' => (int)$r['created_at'],
        ], $rows);
    }

    public function add(string $recipeId, string $userId, string $content): string
    {
        $id = Uid::new();
        $this->db->insert('recipe_comments', [
            'id' => $id,
            'recipe_id' => $recipeId,
            'user_id' => $userId,
            'content' => $content,
            'created_at' => time(),
        ]);
        return $id;
    }

    public function find(string $id): ?array
    {
        $r = $this->db->fetchAssociative('SELECT * FROM recipe_comments WHERE id = ?', [$id]);
        return $r ?: null;
    }

    public function delete(string $id): void
    {
        $this->db->executeStatement('DELETE FROM recipe_comments WHERE id = ?', [$id]);
    }

    public function count(string $recipeId): int
    {
        return (int)$this->db->fetchOne('SELECT COUNT(*) FROM recipe_comments WHERE recipe_id = ?', [$recipeId]);
    }
}
