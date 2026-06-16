<?php
declare(strict_types=1);

return [
    'app' => [
        'env' => $_ENV['APP_ENV'] ?? 'production',
        'debug' => filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN),
    ],
    'db' => [
        'driver' => $_ENV['DB_DRIVER'] ?? 'sqlite',
        'mysql' => [
            'host' => $_ENV['DB_HOST'] ?? '127.0.0.1',
            'port' => (int)($_ENV['DB_PORT'] ?? 3306),
            'dbname' => $_ENV['DB_NAME'] ?? 'sevenkc',
            'user' => $_ENV['DB_USER'] ?? 'root',
            'password' => $_ENV['DB_PASS'] ?? '',
            'charset' => 'utf8mb4',
        ],
        'sqlite' => [
            'path' => $_ENV['DB_SQLITE_PATH'] ?? 'var/sevenkc.sqlite',
        ],
    ],
    'jwt' => [
        'secret' => (static function (): string {
            $s = (string)($_ENV['JWT_SECRET'] ?? '');
            if ($s === '' || $s === 'change-me' || strlen($s) < 32) {
                throw new \RuntimeException(
                    'JWT_SECRET is missing, too short (<32 chars), or still the placeholder. '
                    . 'Set a strong value in backend/.env — e.g. `openssl rand -base64 48`.'
                );
            }
            return $s;
        })(),
        'ttl_hours' => (int)($_ENV['JWT_TTL_HOURS'] ?? 168),
        'alg' => 'HS256',
    ],
    'cors' => [
        'origin' => $_ENV['CORS_ALLOW_ORIGIN'] ?? '*',
    ],
    'paths' => [
        'root' => dirname(__DIR__),
        'shared' => dirname(__DIR__, 2) . '/shared',
    ],
];
