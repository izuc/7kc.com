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
}
