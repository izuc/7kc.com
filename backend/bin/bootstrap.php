<?php
declare(strict_types=1);

// Shared CLI bootstrap — builds the same PHP-DI container the HTTP app uses.
use DI\ContainerBuilder;
use Dotenv\Dotenv;

require __DIR__ . '/../vendor/autoload.php';

$root = dirname(__DIR__);
if (file_exists($root . '/.env')) {
    Dotenv::createImmutable($root)->load();
}

$builder = new ContainerBuilder();
$builder->addDefinitions(require $root . '/config/dependencies.php');
return $builder->build();
