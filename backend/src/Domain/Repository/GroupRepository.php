<?php
declare(strict_types=1);

namespace SevenKC\Domain\Repository;

use Doctrine\DBAL\Connection;
use SevenKC\Support\Uid;

final class GroupRepository
{
    public function __construct(private readonly Connection $db) {}

    public function create(string $ownerId, string $name, ?string $ownerDisplayName): array
    {
        $groupId = Uid::new();
        $token = Uid::token(18);
        $this->db->insert('groups', [
            'id' => $groupId,
            'name' => $name,
            'owner_user_id' => $ownerId,
            'invite_token' => $token,
            'created_at' => time(),
        ]);
        $this->db->insert('group_members', [
            'group_id' => $groupId,
            'user_id' => $ownerId,
            'role' => 'owner',
            'joined_at' => time(),
            'display_name' => $ownerDisplayName,
            'color' => $this->randomColor(),
        ]);
        return $this->find($groupId);
    }

    public function find(string $groupId): ?array
    {
        $row = $this->db->fetchAssociative('SELECT * FROM groups WHERE id = ?', [$groupId]);
        if (!$row) return null;
        $row['members'] = $this->members($groupId);
        return $row;
    }

    public function findByInviteToken(string $token): ?array
    {
        $row = $this->db->fetchAssociative('SELECT * FROM groups WHERE invite_token = ?', [$token]);
        return $row ?: null;
    }

    public function members(string $groupId): array
    {
        return $this->db->fetchAllAssociative(
            'SELECT gm.user_id, gm.role, gm.joined_at, COALESCE(gm.display_name, u.display_name, u.email) AS display_name, gm.color
             FROM group_members gm LEFT JOIN users u ON u.id = gm.user_id WHERE gm.group_id = ? ORDER BY gm.joined_at ASC',
            [$groupId]
        );
    }

    public function addMember(string $groupId, string $userId, ?string $displayName): void
    {
        $existing = $this->db->fetchAssociative(
            'SELECT user_id FROM group_members WHERE group_id = ? AND user_id = ?',
            [$groupId, $userId]
        );
        if ($existing) return;
        $this->db->insert('group_members', [
            'group_id' => $groupId,
            'user_id' => $userId,
            'role' => 'member',
            'joined_at' => time(),
            'display_name' => $displayName,
            'color' => $this->randomColor(),
        ]);
    }

    public function removeMember(string $groupId, string $userId): void
    {
        $this->db->delete('group_members', ['group_id' => $groupId, 'user_id' => $userId]);
    }

    public function countMembers(string $groupId): int
    {
        return (int)$this->db->fetchOne('SELECT COUNT(*) FROM group_members WHERE group_id = ?', [$groupId]);
    }

    public function delete(string $groupId): void
    {
        $this->db->executeStatement('DELETE FROM group_members WHERE group_id = ?', [$groupId]);
        $this->db->executeStatement('DELETE FROM group_feed_events WHERE group_id = ?', [$groupId]);
        $this->db->executeStatement('DELETE FROM meal_suggestions WHERE group_id = ?', [$groupId]);
        $this->db->delete('groups', ['id' => $groupId]);
    }

    public function feed(string $groupId, int $limit = 50): array
    {
        return $this->db->fetchAllAssociative(
            'SELECT * FROM group_feed_events WHERE group_id = ? ORDER BY created_at DESC LIMIT ' . (int)$limit,
            [$groupId]
        );
    }

    public function pushEvent(string $groupId, string $userId, string $kind, array $payload = []): void
    {
        $this->db->insert('group_feed_events', [
            'id' => Uid::new(),
            'group_id' => $groupId,
            'user_id' => $userId,
            'kind' => $kind,
            'payload_json' => json_encode($payload),
            'created_at' => time(),
        ]);
    }

    public function suggestions(string $groupId): array
    {
        $rows = $this->db->fetchAllAssociative(
            'SELECT * FROM meal_suggestions WHERE group_id = ? ORDER BY created_at DESC',
            [$groupId]
        );
        $out = [];
        foreach ($rows as $r) {
            $likes = $this->db->fetchAllAssociative(
                'SELECT user_id, created_at FROM suggestion_likes WHERE suggestion_id = ?',
                [$r['id']]
            );
            $comments = $this->db->fetchAllAssociative(
                'SELECT id, user_id, content, created_at FROM suggestion_comments WHERE suggestion_id = ? ORDER BY created_at ASC',
                [$r['id']]
            );
            $out[] = [
                'id' => $r['id'],
                'group_id' => $r['group_id'],
                'suggested_by' => $r['suggested_by_user_id'],
                'recipe_id' => $r['recipe_id'],
                'recipe_title' => $r['recipe_title'],
                'suggested_for_date' => $r['suggested_for_date'],
                'created_at' => (int)$r['created_at'],
                'cooked_meal_id' => $r['cooked_meal_id'],
                'likes' => array_map(fn ($l) => $l['user_id'], $likes),
                'comments' => array_map(fn ($c) => [
                    'id' => $c['id'],
                    'user_id' => $c['user_id'],
                    'content' => $c['content'],
                    'created_at' => (int)$c['created_at'],
                ], $comments),
            ];
        }
        return $out;
    }

    public function createSuggestion(string $groupId, string $userId, string $title, ?string $recipeId, ?string $date): string
    {
        $id = Uid::new();
        $this->db->insert('meal_suggestions', [
            'id' => $id,
            'group_id' => $groupId,
            'suggested_by_user_id' => $userId,
            'recipe_id' => $recipeId,
            'recipe_title' => $title,
            'suggested_for_date' => $date,
            'created_at' => time(),
            'cooked_meal_id' => null,
        ]);
        return $id;
    }

    public function toggleLike(string $suggestionId, string $userId): bool
    {
        $existing = $this->db->fetchAssociative(
            'SELECT 1 FROM suggestion_likes WHERE suggestion_id = ? AND user_id = ?',
            [$suggestionId, $userId]
        );
        if ($existing) {
            $this->db->delete('suggestion_likes', ['suggestion_id' => $suggestionId, 'user_id' => $userId]);
            return false;
        }
        $this->db->insert('suggestion_likes', [
            'suggestion_id' => $suggestionId,
            'user_id' => $userId,
            'created_at' => time(),
        ]);
        return true;
    }

    public function addComment(string $suggestionId, string $userId, string $content): string
    {
        $id = Uid::new();
        $this->db->insert('suggestion_comments', [
            'id' => $id,
            'suggestion_id' => $suggestionId,
            'user_id' => $userId,
            'content' => $content,
            'created_at' => time(),
        ]);
        return $id;
    }

    private function randomColor(): string
    {
        $palette = ['#c2410c','#0891b2','#65a30d','#7c3aed','#dc2626','#b45309','#0284c7','#be185d'];
        return $palette[array_rand($palette)];
    }
}
