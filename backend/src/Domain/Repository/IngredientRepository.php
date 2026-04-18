<?php
declare(strict_types=1);

namespace SevenKC\Domain\Repository;

use Doctrine\DBAL\Connection;

final class IngredientRepository
{
    public function __construct(private readonly Connection $db) {}

    public function all(): array
    {
        return $this->db->fetchAllAssociative('SELECT id, display, section, shelf_life_days FROM ingredients ORDER BY display');
    }

    public function search(string $q, int $limit = 20): array
    {
        $pattern = '%' . strtolower($q) . '%';
        return $this->db->fetchAllAssociative(
            'SELECT id, display, section, shelf_life_days FROM ingredients WHERE LOWER(display) LIKE ? ORDER BY display LIMIT ' . (int)$limit,
            [$pattern]
        );
    }

    public function find(string $id): ?array
    {
        $r = $this->db->fetchAssociative('SELECT id, display, section, shelf_life_days FROM ingredients WHERE id = ?', [$id]);
        return $r ?: null;
    }

    public function shelfLife(string $id): int
    {
        $r = $this->db->fetchAssociative('SELECT shelf_life_days FROM ingredients WHERE id = ?', [$id]);
        return (int)($r['shelf_life_days'] ?? 14);
    }
}
