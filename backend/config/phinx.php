<?php
declare(strict_types=1);

use Dotenv\Dotenv;

require __DIR__ . '/../vendor/autoload.php';

$root = dirname(__DIR__);
if (file_exists($root . '/.env')) {
    Dotenv::createImmutable($root)->load();
}

$driver = $_ENV['DB_DRIVER'] ?? 'sqlite';

$envs = [
    'default_migration_table' => 'phinxlog',
    'default_environment' => 'default',
];

if ($driver === 'mysql') {
    $envs['default'] = [
        'adapter' => 'mysql',
        'host' => $_ENV['DB_HOST'] ?? '127.0.0.1',
        'port' => (int)($_ENV['DB_PORT'] ?? 3306),
        'name' => $_ENV['DB_NAME'] ?? 'sevenkc',
        'user' => $_ENV['DB_USER'] ?? 'root',
        'pass' => $_ENV['DB_PASS'] ?? '',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ];
} else {
    $sqlitePath = $_ENV['DB_SQLITE_PATH'] ?? 'var/sevenkc.sqlite';
    // Match ConnectionFactory::create(): only prepend $root for RELATIVE paths,
    // so migrations and the running app always point at the same SQLite file.
    if (!str_starts_with($sqlitePath, '/') && !preg_match('#^[A-Z]:\\\\#i', $sqlitePath)) {
        $sqlitePath = $root . '/' . $sqlitePath;
    }
    $envs['default'] = [
        'adapter' => 'sqlite',
        'name' => $sqlitePath,
        'suffix' => '',
    ];
}

return [
    'paths' => [
        'migrations' => $root . '/db/migrations',
        'seeds' => $root . '/db/seeds',
    ],
    'environments' => $envs,
    'version_order' => 'creation',
];
