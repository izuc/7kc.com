<?php
declare(strict_types=1);

namespace SevenKC\Domain\Repository;

use Doctrine\DBAL\Connection;
use SevenKC\Support\Uid;

final class PantryRepository
{
    public function __construct(private readonly Connection $db) {}

    public function forUser(string $userId, ?string $groupId): array
    {
        $sql = 'SELECT * FROM pantry_items WHERE owner_user_id = ?';
        $params = [$userId];
        if ($groupId) {
            $sql .= ' OR group_id = ?';
            $params[] = $groupId;
        }
        // Generous defensive bound (newest kept) — ~10x any realistic pantry, so it
        // never affects the client-side grouping/sort; it only caps pathological growth.
        $sql .= ' ORDER BY added_at DESC LIMIT 1000';
        $rows = $this->db->fetchAllAssociative($sql, $params);
        return array_map([$this, 'hydrate'], $rows);
    }

    public function find(string $id): ?array
    {
        $r = $this->db->fetchAssociative('SELECT * FROM pantry_items WHERE id = ?', [$id]);
        return $r ? $this->hydrate($r) : null;
    }

    /** Ownership-scoped lookup: returns the item only if the user owns it or shares its group. */
    public function findForUser(string $id, string $userId, ?string $groupId): ?array
    {
        $sql = 'SELECT * FROM pantry_items WHERE id = ? AND (owner_user_id = ?' . ($groupId ? ' OR group_id = ?' : '') . ')';
        $params = [$id, $userId];
        if ($groupId) $params[] = $groupId;
        $r = $this->db->fetchAssociative($sql, $params);
        return $r ? $this->hydrate($r) : null;
    }

    public function deleteForUser(string $id, string $userId, ?string $groupId): bool
    {
        if (!$this->findForUser($id, $userId, $groupId)) return false;
        $this->delete($id);
        return true;
    }

    public function add(string $ownerId, ?string $groupId, ?string $ingId, ?string $customName, ?int $expiresAt, bool $runningLow = false): string
    {
        $id = Uid::new();
        $this->db->insert('pantry_items', [
            'id' => $id,
            'owner_user_id' => $ownerId,
            'group_id' => $groupId,
            'ingredient_id' => $ingId,
            'custom_name' => $customName,
            'added_at' => time(),
            'expires_at' => $expiresAt,
            'running_low' => $runningLow ? 1 : 0,
            'notes' => null,
        ]);
        return $id;
    }

    public function runningLow(string $userId, ?string $groupId): array
    {
        $sql = 'SELECT * FROM pantry_items WHERE running_low = 1 AND (owner_user_id = ?' . ($groupId ? ' OR group_id = ?' : '') . ')';
        $params = [$userId];
        if ($groupId) $params[] = $groupId;
        return array_map([$this, 'hydrate'], $this->db->fetchAllAssociative($sql, $params));
    }

    /** A single user's items expiring within [$fromTs, $beforeTs] (for the weekly digest).
     *  The lower bound is essential — without it the digest would nag forever about items
     *  that expired long ago and were never deleted. */
    public function expiringSoon(string $userId, ?string $groupId, int $fromTs, int $beforeTs): array
    {
        $sql = 'SELECT * FROM pantry_items WHERE expires_at IS NOT NULL AND expires_at >= ? AND expires_at <= ? AND (owner_user_id = ?'
            . ($groupId ? ' OR group_id = ?' : '') . ') ORDER BY expires_at ASC';
        $params = [$fromTs, $beforeTs, $userId];
        if ($groupId) $params[] = $groupId;
        return array_map([$this, 'hydrate'], $this->db->fetchAllAssociative($sql, $params));
    }

    /** Items expiring in [$now, $now + withinDays], grouped by owner — for the expiry push cron.
     *  @return array<string, list<array{ingredient_id:?string,custom_name:?string,expires_at:int}>> */
    public function expiringSoonByUser(int $now, int $withinDays = 3): array
    {
        $rows = $this->db->fetchAllAssociative(
            'SELECT owner_user_id, ingredient_id, custom_name, expires_at FROM pantry_items
             WHERE expires_at IS NOT NULL AND expires_at >= ? AND expires_at <= ? ORDER BY owner_user_id, expires_at',
            [$now, $now + $withinDays * 86400]
        );
        $byUser = [];
        foreach ($rows as $r) {
            $byUser[$r['owner_user_id']][] = [
                'ingredient_id' => $r['ingredient_id'],
                'custom_name' => $r['custom_name'],
                'expires_at' => (int)$r['expires_at'],
            ];
        }
        return $byUser;
    }

    /**
     * Insert, OR if the user/group already stocks this ingredient, refresh that row
     * (reset expiry, clear running_low) instead of creating a duplicate.
     */
    public function addOrRefresh(string $ownerId, ?string $groupId, ?string $ingId, ?string $customName, ?int $expiresAt, bool $runningLow = false): string
    {
        if ($ingId) {
            $sql = 'SELECT id FROM pantry_items WHERE ingredient_id = ? AND (owner_user_id = ?' . ($groupId ? ' OR group_id = ?' : '') . ') LIMIT 1';
            $params = [$ingId, $ownerId];
            if ($groupId) $params[] = $groupId;
            $existingId = $this->db->fetchOne($sql, $params);
            if ($existingId !== false && $existingId !== null) {
                $this->db->update('pantry_items', [
                    'expires_at' => $expiresAt,
                    'running_low' => $runningLow ? 1 : 0,
                    'added_at' => time(),
                ], ['id' => $existingId]);
                return (string)$existingId;
            }
        }
        return $this->add($ownerId, $groupId, $ingId, $customName, $expiresAt, $runningLow);
    }

    public function update(string $id, array $fields): void
    {
        $allowed = array_intersect_key($fields, array_flip(['expires_at', 'running_low', 'notes', 'custom_name']));
        if (isset($allowed['running_low'])) {
            $allowed['running_low'] = $allowed['running_low'] ? 1 : 0;
        }
        if ($allowed) {
            $this->db->update('pantry_items', $allowed, ['id' => $id]);
        }
    }

    public function delete(string $id): void
    {
        $this->db->delete('pantry_items', ['id' => $id]);
    }

    /** Record a removal (e.g. an item tossed/expired) for the waste & savings stats. */
    public function logRemoval(string $userId, ?string $groupId, ?string $ingId, ?string $customName, string $reason): void
    {
        $this->db->insert('pantry_removals', [
            'id' => Uid::new(),
            'user_id' => $userId,
            'group_id' => $groupId,
            'ingredient_id' => $ingId,
            'custom_name' => $customName,
            'reason' => $reason,
            'removed_at' => time(),
        ]);
    }

    public function removeByIngredientIds(string $userId, ?string $groupId, array $ingIds): int
    {
        return count($this->removeByIngredientIdsReturning($userId, $groupId, $ingIds));
    }

    /**
     * Delete the user's/group's pantry rows for the given ingredient ids and return the
     * distinct ingredient ids that were actually removed. Phantom ids (not in the pantry)
     * and duplicates are dropped, so callers can persist a truthful "rescued" set rather
     * than the raw requested list (which would inflate the waste & savings stats).
     * @return list<string>
     */
    public function removeByIngredientIdsReturning(string $userId, ?string $groupId, array $ingIds): array
    {
        $ingIds = array_values(array_unique($ingIds));
        if (!$ingIds) return [];
        $placeholders = implode(',', array_fill(0, count($ingIds), '?'));
        $where = '(owner_user_id = ?' . ($groupId ? ' OR group_id = ?' : '') . ') AND ingredient_id IN (' . $placeholders . ')';
        $params = [$userId];
        if ($groupId) $params[] = $groupId;
        $params = array_merge($params, $ingIds);

        $matched = $this->db->fetchFirstColumn(
            "SELECT DISTINCT ingredient_id FROM pantry_items WHERE $where",
            $params
        );
        if (!$matched) return [];

        $this->db->executeStatement("DELETE FROM pantry_items WHERE $where", $params);
        return array_values(array_map('strval', $matched));
    }

    private function hydrate(array $r): array
    {
        return [
            'id' => $r['id'],
            'owner_user_id' => $r['owner_user_id'],
            'group_id' => $r['group_id'],
            'ingredient_id' => $r['ingredient_id'],
            'custom_name' => $r['custom_name'],
            'added_at' => (int)$r['added_at'],
            'expires_at' => $r['expires_at'] !== null ? (int)$r['expires_at'] : null,
            'running_low' => (bool)$r['running_low'],
            'notes' => $r['notes'],
        ];
    }
}
