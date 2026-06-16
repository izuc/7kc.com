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
}
