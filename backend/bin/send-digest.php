<?php
declare(strict_types=1);

// Weekly cron: email opted-in users a short "use it up" digest of their expiring +
// running-low items. STRICTLY transactional — a user is skipped (no email) when they
// have nothing to use up, and digest_optin defaults off. Mailer no-ops (exit 0) when
// SMTP/symfony-mailer aren't configured.
//
//   php bin/send-digest.php

use SevenKC\Domain\Repository\IngredientRepository;
use SevenKC\Domain\Repository\PantryRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Mail\Mailer;

/** @var \DI\Container $container */
$container = require __DIR__ . '/bootstrap.php';

$users = $container->get(UserRepository::class);
$pantry = $container->get(PantryRepository::class);
$ingredients = $container->get(IngredientRepository::class);
$mailer = $container->get(Mailer::class);

$appUrl = $mailer->appUrl();
$now = time();
$sent = 0;
$skipped = 0;

$label = function (array $item) use ($ingredients): string {
    if (!empty($item['custom_name'])) return (string)$item['custom_name'];
    if (!empty($item['ingredient_id'])) {
        $i = $ingredients->find((string)$item['ingredient_id']);
        return (string)($i['display'] ?? $item['ingredient_id']);
    }
    return 'an item';
};

foreach ($users->optedInUsers() as $u) {
    $groupId = $u['group_id'] ?: null;
    $expiring = $pantry->expiringSoon($u['id'], $groupId, $now, $now + 3 * 86400);
    $low = $pantry->runningLow($u['id'], $groupId);
    if (!$expiring && !$low) {
        $skipped++;
        continue; // nothing to use up → never send
    }

    $lines = ['Hi' . ($u['display_name'] ? ' ' . $u['display_name'] : '') . ',', ''];
    if ($expiring) {
        $lines[] = 'Use these up soon:';
        foreach ($expiring as $it) $lines[] = '  • ' . $label($it);
        $lines[] = '';
    }
    if ($low) {
        $lines[] = 'Running low — worth restocking:';
        foreach ($low as $it) $lines[] = '  • ' . $label($it);
        $lines[] = '';
    }
    $lines[] = 'Open 7 Day Kitchen to plan dinner around them.';
    if ($appUrl !== '') {
        $token = $users->ensureUnsubscribeToken($u['id']);
        $lines[] = '';
        $lines[] = 'Unsubscribe: ' . $appUrl . '/api/v1/unsubscribe?token=' . $token;
    }

    if ($mailer->send((string)$u['email'], 'Your kitchen this week — use it up', implode("\n", $lines))) {
        $sent++;
    }
}

fwrite(STDOUT, json_encode(['msg' => 'digest', 'sent' => $sent, 'skipped_empty' => $skipped]) . "\n");
exit(0);
