<?php
declare(strict_types=1);

namespace SevenKC\Domain\Repository;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use SevenKC\Support\Uid;

/** Browser Web-Push subscriptions, keyed by their unique endpoint URL. */
final class PushSubscriptionRepository
{
    public function __construct(private readonly Connection $db) {}

    /** Store (or refresh) a subscription, keyed on its endpoint. Race-safe. */
    public function upsertForUser(string $userId, string $endpoint, string $p256dh, string $auth): void
    {
        $existing = $this->db->fetchOne('SELECT id FROM push_subscriptions WHERE endpoint = ?', [$endpoint]);
        if ($existing) {
            $this->db->update('push_subscriptions', [
                'user_id' => $userId, 'p256dh' => $p256dh, 'auth' => $auth,
            ], ['id' => $existing]);
            return;
        }
        try {
            $this->db->insert('push_subscriptions', [
                'id' => Uid::new(),
                'user_id' => $userId,
                'endpoint' => $endpoint,
                'p256dh' => $p256dh,
                'auth' => $auth,
                'created_at' => time(),
            ]);
        } catch (UniqueConstraintViolationException) {
            $this->db->update('push_subscriptions', [
                'user_id' => $userId, 'p256dh' => $p256dh, 'auth' => $auth,
            ], ['endpoint' => $endpoint]);
        }
    }

    /** @return list<array{id:string,user_id:string,endpoint:string,p256dh:string,auth:string}> */
    public function forUser(string $userId): array
    {
        return $this->db->fetchAllAssociative(
            'SELECT id, user_id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
            [$userId]
        );
    }

    /** Prune by endpoint (used by the cron for expired/gone endpoints). */
    public function deleteByEndpoint(string $endpoint): bool
    {
        return $this->db->executeStatement('DELETE FROM push_subscriptions WHERE endpoint = ?', [$endpoint]) > 0;
    }

    /** Scoped delete for the authed unsubscribe — a user can only drop their own subscription. */
    public function deleteForUserByEndpoint(string $userId, string $endpoint): bool
    {
        return $this->db->executeStatement(
            'DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?',
            [$endpoint, $userId]
        ) > 0;
    }

    /** Every subscription (for the cron). @return list<array{...}> */
    public function all(): array
    {
        return $this->db->fetchAllAssociative('SELECT id, user_id, endpoint, p256dh, auth FROM push_subscriptions');
    }
}
