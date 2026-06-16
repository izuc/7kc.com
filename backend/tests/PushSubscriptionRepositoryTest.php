<?php
declare(strict_types=1);

namespace SevenKC\Tests;

use SevenKC\Domain\Repository\PushSubscriptionRepository;

final class PushSubscriptionRepositoryTest extends TestCase
{
    private function repo(): PushSubscriptionRepository
    {
        return new PushSubscriptionRepository($this->db);
    }

    public function testUpsertInsertsThenUpdatesSameEndpoint(): void
    {
        $repo = $this->repo();
        $repo->upsertForUser('userA', 'https://push.example/abc', 'p1', 'a1');
        $repo->upsertForUser('userA', 'https://push.example/abc', 'p2', 'a2'); // same endpoint → update

        $rows = $repo->forUser('userA');
        $this->assertCount(1, $rows);
        $this->assertSame('p2', $rows[0]['p256dh']);
        $this->assertSame('a2', $rows[0]['auth']);
    }

    public function testEndpointCanMoveToAnotherUser(): void
    {
        // Same browser, different account → the endpoint re-binds to the new user.
        $repo = $this->repo();
        $repo->upsertForUser('userA', 'https://push.example/abc', 'p', 'a');
        $repo->upsertForUser('userB', 'https://push.example/abc', 'p', 'a');
        $this->assertCount(0, $repo->forUser('userA'));
        $this->assertCount(1, $repo->forUser('userB'));
    }

    public function testDeleteByEndpoint(): void
    {
        $repo = $this->repo();
        $repo->upsertForUser('userA', 'https://push.example/abc', 'p', 'a');
        $this->assertTrue($repo->deleteByEndpoint('https://push.example/abc'));
        $this->assertFalse($repo->deleteByEndpoint('https://push.example/abc')); // already gone
        $this->assertCount(0, $repo->forUser('userA'));
    }

    public function testAllReturnsEverySubscription(): void
    {
        $repo = $this->repo();
        $repo->upsertForUser('userA', 'https://push.example/a', 'p', 'a');
        $repo->upsertForUser('userB', 'https://push.example/b', 'p', 'a');
        $this->assertCount(2, $repo->all());
    }
}
