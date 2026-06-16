<?php
declare(strict_types=1);

namespace SevenKC\Domain\Repository;

use Doctrine\DBAL\Connection;
use SevenKC\Support\Uid;

final class UserRepository
{
    public function __construct(private readonly Connection $db) {}

    public function findByEmail(string $email): ?array
    {
        $row = $this->db->fetchAssociative('SELECT * FROM users WHERE email = ?', [strtolower($email)]);
        return $row ?: null;
    }

    public function findById(string $id): ?array
    {
        $row = $this->db->fetchAssociative('SELECT * FROM users WHERE id = ?', [$id]);
        return $row ?: null;
    }

    public function create(string $email, string $passwordHash, ?string $displayName): array
    {
        $id = Uid::new();
        $this->db->insert('users', [
            'id' => $id,
            'email' => strtolower($email),
            'password_hash' => $passwordHash,
            'display_name' => $displayName,
            'group_id' => null,
            'created_at' => time(),
        ]);
        return $this->findById($id);
    }

    public function setGroup(string $userId, ?string $groupId): void
    {
        $this->db->update('users', ['group_id' => $groupId], ['id' => $userId]);
    }

    public function groupIdFor(string $userId): ?string
    {
        $row = $this->db->fetchAssociative('SELECT group_id FROM users WHERE id = ?', [$userId]);
        return $row['group_id'] ?? null;
    }

    /** @return list<string> the diet keys the user requires (e.g. ['vegetarian','gluten_free']) */
    public function dietFor(string $userId): array
    {
        $row = $this->db->fetchAssociative('SELECT diet_json FROM users WHERE id = ?', [$userId]);
        $d = $row && $row['diet_json'] ? json_decode((string)$row['diet_json'], true) : [];
        return is_array($d) ? array_values(array_filter($d, 'is_string')) : [];
    }

    public function setDiet(string $userId, array $diet): void
    {
        $this->db->update('users', ['diet_json' => json_encode(array_values($diet))], ['id' => $userId]);
    }

    /**
     * Hard-delete a user and all their data in one transaction. Any group they OWN is
     * handed to the longest-tenured remaining member, or dissolved if they were the
     * only one. Mirrors the cascade documented in docs/ADMIN.md (plus the newer tables).
     */
    public function deleteAccount(string $userId): void
    {
        $this->db->transactional(function ($db) use ($userId): void {
            foreach ($db->fetchAllAssociative('SELECT id FROM groups WHERE owner_user_id = ?', [$userId]) as $g) {
                $gid = $g['id'];
                $next = $db->fetchOne(
                    'SELECT user_id FROM group_members WHERE group_id = ? AND user_id != ? ORDER BY joined_at ASC LIMIT 1',
                    [$gid, $userId]
                );
                if ($next) {
                    $db->update('groups', ['owner_user_id' => $next], ['id' => $gid]);
                    $db->update('group_members', ['role' => 'owner'], ['group_id' => $gid, 'user_id' => $next]);
                } else {
                    $db->executeStatement('DELETE FROM group_feed_events WHERE group_id = ?', [$gid]);
                    $db->executeStatement('DELETE FROM meal_suggestions WHERE group_id = ?', [$gid]);
                    $db->executeStatement('DELETE FROM group_members WHERE group_id = ?', [$gid]);
                    $db->delete('groups', ['id' => $gid]);
                }
            }

            $db->executeStatement('DELETE FROM suggestion_comments WHERE user_id = ?', [$userId]);
            $db->executeStatement('DELETE FROM suggestion_likes WHERE user_id = ?', [$userId]);
            $db->executeStatement('DELETE FROM meal_suggestions WHERE suggested_by_user_id = ?', [$userId]);
            $db->executeStatement('DELETE FROM group_feed_events WHERE user_id = ?', [$userId]);
            $db->executeStatement('DELETE FROM cooked_meals WHERE user_id = ?', [$userId]);
            $db->executeStatement('DELETE FROM pantry_removals WHERE user_id = ?', [$userId]);
            $db->executeStatement('DELETE FROM recipe_favourites WHERE user_id = ?', [$userId]);
            $db->executeStatement('DELETE FROM pantry_items WHERE owner_user_id = ?', [$userId]);
            $db->executeStatement('DELETE FROM shopping_list_items WHERE added_by_user_id = ?', [$userId]);
            $db->executeStatement('DELETE FROM shopping_lists WHERE owner_user_id = ?', [$userId]);
            $db->executeStatement('DELETE FROM recipes WHERE owner_user_id = ?', [$userId]);
            $db->executeStatement('DELETE FROM group_members WHERE user_id = ?', [$userId]);
            $db->delete('users', ['id' => $userId]);
        });
    }
}
