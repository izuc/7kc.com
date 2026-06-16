<?php
declare(strict_types=1);

namespace SevenKC\Tests;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\DriverManager;
use PHPUnit\Framework\TestCase as BaseTestCase;

/** Base test case: a fresh in-memory SQLite DB (schema loaded) per test. */
abstract class TestCase extends BaseTestCase
{
    protected Connection $db;

    protected function setUp(): void
    {
        $this->db = DriverManager::getConnection(['driver' => 'pdo_sqlite', 'memory' => true]);
        /** @var \PDO $pdo */
        $pdo = $this->db->getNativeConnection();
        $pdo->exec((string)file_get_contents(__DIR__ . '/schema.sql'));
    }
}
