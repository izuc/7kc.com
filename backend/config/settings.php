<?php
declare(strict_types=1);

return [
    'app' => [
        'env' => $_ENV['APP_ENV'] ?? 'production',
        // Public web origin — used to build absolute links in emails (unsubscribe etc.).
        'url' => rtrim($_ENV['APP_URL'] ?? ($_ENV['PUBLIC_WEB_ORIGIN'] ?? ''), '/'),
        // Debug detail is never exposed in production, regardless of APP_DEBUG.
        'debug' => ($_ENV['APP_ENV'] ?? 'production') !== 'production'
            && filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN),
    ],
    // Optional Web Push (VAPID). Empty = feature off; never throws.
    'push' => [
        'public_key' => $_ENV['VAPID_PUBLIC_KEY'] ?? '',
        'private_key' => $_ENV['VAPID_PRIVATE_KEY'] ?? '',
        'subject' => $_ENV['VAPID_SUBJECT'] ?? '',
    ],
    // Optional outbound mail (weekly digest). Empty = feature off; never throws.
    'mail' => [
        'dsn' => $_ENV['MAIL_DSN'] ?? '',
        'host' => $_ENV['SMTP_HOST'] ?? '',
        'port' => (int)($_ENV['SMTP_PORT'] ?? 587),
        'user' => $_ENV['SMTP_USER'] ?? '',
        'pass' => $_ENV['SMTP_PASS'] ?? '',
        'from' => $_ENV['MAIL_FROM'] ?? '',
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
        // Never wildcard in production: require an explicit origin there, allow '*' only in dev.
        'origin' => (static function (): string {
            $o = $_ENV['CORS_ALLOW_ORIGIN'] ?? ($_ENV['PUBLIC_WEB_ORIGIN'] ?? '');
            if ($o !== '') return $o;
            return (($_ENV['APP_ENV'] ?? 'production') === 'production') ? '' : '*';
        })(),
    ],
    // Optional vision-LLM photo scanning. Configured by the SITE OPERATOR via .env
    // (not per user). Point it at any OpenAI-compatible endpoint — a local LM Studio
    // / Ollama on the host, or OpenAI. Feature is OFF unless endpoint + model are set.
    'ai_scan' => [
        'endpoint' => trim((string)($_ENV['AI_SCAN_ENDPOINT'] ?? '')),
        'model' => trim((string)($_ENV['AI_SCAN_MODEL'] ?? '')),
        'api_key' => trim((string)($_ENV['AI_SCAN_API_KEY'] ?? '')),
    ],
    'paths' => [
        'root' => dirname(__DIR__),
        'shared' => dirname(__DIR__, 2) . '/shared',
    ],
];
