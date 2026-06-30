<?php
declare(strict_types=1);

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\DriverManager;
use Psr\Container\ContainerInterface;
use SevenKC\Infrastructure\Auth\JwtService;
use SevenKC\Infrastructure\Database\ConnectionFactory;
use SevenKC\Infrastructure\Mail\Mailer;
use SevenKC\Support\AiScanner;

return [
    'settings' => require __DIR__ . '/settings.php',

    AiScanner::class => function (ContainerInterface $c): AiScanner {
        return new AiScanner($c->get('settings')['ai_scan']);
    },

    Connection::class => function (ContainerInterface $c): Connection {
        return ConnectionFactory::create($c->get('settings')['db']);
    },

    JwtService::class => function (ContainerInterface $c): JwtService {
        $cfg = $c->get('settings')['jwt'];
        return new JwtService($cfg['secret'], $cfg['alg'], $cfg['ttl_hours']);
    },

    Mailer::class => function (ContainerInterface $c): Mailer {
        $s = $c->get('settings');
        return new Mailer($s['mail'], $s['app']['url'] ?? '');
    },
];
