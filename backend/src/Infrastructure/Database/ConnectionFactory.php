<?php
declare(strict_types=1);

namespace SevenKC\Infrastructure\Database;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\DriverManager;

final class ConnectionFactory
{
    public static function create(array $cfg): Connection
    {
        $driver = $cfg['driver'] ?? 'sqlite';

        if ($driver === 'mysql') {
            $my = $cfg['mysql'];
            return DriverManager::getConnection([
                'driver' => 'pdo_mysql',
                'host' => $my['host'],
                'port' => $my['port'],
                'dbname' => $my['dbname'],
                'user' => $my['user'],
                'password' => $my['password'],
                'charset' => $my['charset'],
            ]);
        }

        $root = dirname(__DIR__, 3);
        $path = $cfg['sqlite']['path'];
        if (!str_starts_with($path, '/') && !preg_match('#^[A-Z]:\\\\#i', $path)) {
            $path = $root . '/' . $path;
        }
        $dir = dirname($path);
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        return DriverManager::getConnection([
            'driver' => 'pdo_sqlite',
            'path' => $path,
        ]);
    }
}
