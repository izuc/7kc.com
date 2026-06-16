<?php
declare(strict_types=1);

namespace SevenKC\Tests;

use SevenKC\Domain\Repository\UserRepository;

final class UserRepositoryTest extends TestCase
{
    public function testCreateLowercasesEmailAndVerifies(): void
    {
        $repo = new UserRepository($this->db);
        $user = $repo->create('Test@Example.com', password_hash('secret123', PASSWORD_BCRYPT), 'Tester');
        $this->assertSame('test@example.com', $user['email']);

        $found = $repo->findByEmail('test@example.com');
        $this->assertNotNull($found);
        $this->assertTrue(password_verify('secret123', $found['password_hash']));
        $this->assertFalse(password_verify('wrong', $found['password_hash']));
    }

    public function testGroupIdForReflectsMembership(): void
    {
        $repo = new UserRepository($this->db);
        $user = $repo->create('a@b.com', 'x', null);
        $this->assertNull($repo->groupIdFor($user['id']));
        $repo->setGroup($user['id'], 'grp1');
        $this->assertSame('grp1', $repo->groupIdFor($user['id']));
    }

    public function testTokenVersionStartsAtZeroAndBumps(): void
    {
        $repo = new UserRepository($this->db);
        $user = $repo->create('a@b.com', 'x', null);
        $this->assertSame(0, $repo->tokenVersion($user['id']));
        $repo->bumpTokenVersion($user['id']);
        $this->assertSame(1, $repo->tokenVersion($user['id']));
        $repo->bumpTokenVersion($user['id']);
        $this->assertSame(2, $repo->tokenVersion($user['id']));
    }

    public function testDigestOptinBackfillsTokenAndRoundTrips(): void
    {
        $repo = new UserRepository($this->db);
        $user = $repo->create('a@b.com', 'x', null);
        $this->assertFalse($repo->digestOptin($user['id']));

        $repo->setDigestOptin($user['id'], true);
        $this->assertTrue($repo->digestOptin($user['id']));

        // Enabling backfills an unsubscribe token, idempotently, that resolves back.
        $token = $repo->ensureUnsubscribeToken($user['id']);
        $this->assertNotSame('', $token);
        $this->assertSame($token, $repo->ensureUnsubscribeToken($user['id']));
        $this->assertSame($user['id'], $repo->byUnsubscribeToken($token)['id']);

        $repo->setDigestOptin($user['id'], false);
        $this->assertFalse($repo->digestOptin($user['id']));
        // Token survives unsubscribe so the same link keeps working.
        $this->assertSame($user['id'], $repo->byUnsubscribeToken($token)['id']);
    }

    public function testOptedInUsersOnlyReturnsOptedIn(): void
    {
        $repo = new UserRepository($this->db);
        $in = $repo->create('in@b.com', 'x', null);
        $repo->create('out@b.com', 'x', null);
        $repo->setDigestOptin($in['id'], true);

        $emails = array_column($repo->optedInUsers(), 'email');
        $this->assertSame(['in@b.com'], $emails);
    }
}
