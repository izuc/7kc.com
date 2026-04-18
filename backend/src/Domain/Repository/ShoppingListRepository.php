<?php
declare(strict_types=1);

namespace SevenKC\Domain\Repository;

use Doctrine\DBAL\Connection;
use SevenKC\Support\Uid;

final class ShoppingListRepository
{
    public function __construct(private readonly Connection $db) {}

    public function forUser(string $userId, ?string $groupId): array
    {
        $sql = 'SELECT * FROM shopping_lists WHERE owner_user_id = ?';
        $params = [$userId];
        if ($groupId) {
            $sql .= ' OR group_id = ?';
            $params[] = $groupId;
        }
        $sql .= ' ORDER BY archived_at IS NULL DESC, created_at DESC';
        // SQLite compatible version
        $lists = $this->db->fetchAllAssociative(
            'SELECT * FROM shopping_lists WHERE owner_user_id = ?' . ($groupId ? ' OR group_id = ?' : '') . ' ORDER BY created_at DESC',
            $params
        );
        return array_map([$this, 'hydrate'], $lists);
    }

    public function find(string $id): ?array
    {
        $row = $this->db->fetchAssociative('SELECT * FROM shopping_lists WHERE id = ?', [$id]);
        return $row ? $this->hydrate($row) : null;
    }

    public function findWithItems(string $id): ?array
    {
        $list = $this->find($id);
        if (!$list) return null;
        $list['items'] = $this->items($id);
        return $list;
    }

    public function items(string $listId): array
    {
        $rows = $this->db->fetchAllAssociative(
            'SELECT * FROM shopping_list_items WHERE list_id = ? ORDER BY is_bought ASC, sort_order ASC, added_at ASC',
            [$listId]
        );
        return array_map(fn ($r) => [
            'id' => $r['id'],
            'list_id' => $r['list_id'],
            'ingredient_id' => $r['ingredient_id'],
            'custom_name' => $r['custom_name'],
            'section' => $r['section'],
            'note' => $r['note'],
            'is_bought' => (bool)$r['is_bought'],
            'bought_by_user_id' => $r['bought_by_user_id'],
            'bought_at' => $r['bought_at'] !== null ? (int)$r['bought_at'] : null,
            'added_by_user_id' => $r['added_by_user_id'],
            'added_at' => (int)$r['added_at'],
            'moved_to_pantry' => (bool)$r['moved_to_pantry'],
            'sort_order' => (int)$r['sort_order'],
        ], $rows);
    }

    public function create(string $ownerId, ?string $groupId, string $name): string
    {
        $id = Uid::new();
        $this->db->insert('shopping_lists', [
            'id' => $id,
            'owner_user_id' => $ownerId,
            'group_id' => $groupId,
            'name' => $name,
            'created_at' => time(),
            'archived_at' => null,
        ]);
        return $id;
    }

    public function rename(string $id, string $name): void
    {
        $this->db->update('shopping_lists', ['name' => $name], ['id' => $id]);
    }

    public function setArchived(string $id, bool $archived): void
    {
        $this->db->update('shopping_lists', ['archived_at' => $archived ? time() : null], ['id' => $id]);
    }

    public function addItem(string $listId, string $addedBy, ?string $ingId, ?string $customName, string $section): string
    {
        $id = Uid::new();
        $this->db->insert('shopping_list_items', [
            'id' => $id,
            'list_id' => $listId,
            'ingredient_id' => $ingId,
            'custom_name' => $customName,
            'section' => $section,
            'note' => null,
            'is_bought' => 0,
            'bought_by_user_id' => null,
            'bought_at' => null,
            'added_by_user_id' => $addedBy,
            'added_at' => time(),
            'moved_to_pantry' => 0,
            'sort_order' => 0,
        ]);
        return $id;
    }

    public function deleteItem(string $itemId): void
    {
        $this->db->delete('shopping_list_items', ['id' => $itemId]);
    }

    public function toggleBought(string $itemId, string $userId): bool
    {
        $item = $this->db->fetchAssociative('SELECT is_bought FROM shopping_list_items WHERE id = ?', [$itemId]);
        if (!$item) return false;
        $nowBought = !$item['is_bought'];
        $this->db->update('shopping_list_items', [
            'is_bought' => $nowBought ? 1 : 0,
            'bought_by_user_id' => $nowBought ? $userId : null,
            'bought_at' => $nowBought ? time() : null,
        ], ['id' => $itemId]);
        return $nowBought;
    }

    public function markAllBought(string $listId, string $userId): int
    {
        return (int)$this->db->executeStatement(
            'UPDATE shopping_list_items SET is_bought = 1, bought_by_user_id = ?, bought_at = ? WHERE list_id = ? AND is_bought = 0',
            [$userId, time(), $listId]
        );
    }

    public function itemsToMove(string $listId, array $excludeIds = []): array
    {
        $rows = $this->db->fetchAllAssociative(
            'SELECT * FROM shopping_list_items WHERE list_id = ? AND is_bought = 1 AND moved_to_pantry = 0',
            [$listId]
        );
        if ($excludeIds) {
            $rows = array_values(array_filter($rows, fn ($r) => !in_array($r['id'], $excludeIds, true)));
        }
        return $rows;
    }

    public function markMoved(array $itemIds): void
    {
        foreach ($itemIds as $id) {
            $this->db->update('shopping_list_items', ['moved_to_pantry' => 1], ['id' => $id]);
        }
    }

    private function hydrate(array $row): array
    {
        return [
            'id' => $row['id'],
            'owner_user_id' => $row['owner_user_id'],
            'group_id' => $row['group_id'],
            'name' => $row['name'],
            'created_at' => (int)$row['created_at'],
            'archived_at' => $row['archived_at'] !== null ? (int)$row['archived_at'] : null,
        ];
    }
}
