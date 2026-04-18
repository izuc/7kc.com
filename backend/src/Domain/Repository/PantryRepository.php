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
        $sql .= ' ORDER BY added_at DESC';
        $rows = $this->db->fetchAllAssociative($sql, $params);
        return array_map([$this, 'hydrate'], $rows);
    }

    public function find(string $id): ?array
    {
        $r = $this->db->fetchAssociative('SELECT * FROM pantry_items WHERE id = ?', [$id]);
        return $r ? $this->hydrate($r) : null;
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

    public function removeByIngredientIds(string $userId, ?string $groupId, array $ingIds): int
    {
        if (!$ingIds) return 0;
        $placeholders = implode(',', array_fill(0, count($ingIds), '?'));
        $where = '(owner_user_id = ?' . ($groupId ? ' OR group_id = ?' : '') . ') AND ingredient_id IN (' . $placeholders . ')';
        $params = [$userId];
        if ($groupId) $params[] = $groupId;
        $params = array_merge($params, $ingIds);
        return (int)$this->db->executeStatement("DELETE FROM pantry_items WHERE $where", $params);
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
